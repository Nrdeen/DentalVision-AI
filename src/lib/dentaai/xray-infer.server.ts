import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { annotateFinding, routeXrayClass, severityOf } from "./ensemble";
import type { Finding, XrayQuality, XrayQualityFlag, XrayQualityLevel } from "./types";

const INFER_PORT = Number(process.env.XRAY_INFER_PORT || 8765);
const INFER_HOST = "127.0.0.1";
const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, "scripts", "infer-xray.py");

type RawDetection = {
  cls: number;
  name: string;
  conf: number;
  xyxyn: [number, number, number, number];
};

type InferPayload = {
  ok: boolean;
  error?: string;
  weights?: string | null;
  detections?: RawDetection[];
  quality?: {
    level?: string;
    flags?: string[];
    width?: number;
    height?: number;
    prepared?: boolean;
    inverted?: boolean;
    cropped?: boolean;
  };
};

function parseQuality(raw: InferPayload["quality"]): XrayQuality | null {
  if (!raw) return null;
  const level: XrayQualityLevel =
    raw.level === "poor" || raw.level === "fair" || raw.level === "good" ? raw.level : "fair";
  const allowed: XrayQualityFlag[] = [
    "small",
    "blur",
    "dark",
    "bright",
    "compressed",
    "crop",
    "inverted",
    "narrow",
  ];
  return {
    level,
    flags: (raw.flags ?? []).filter((f): f is XrayQualityFlag => allowed.includes(f as XrayQualityFlag)),
    width: Number(raw.width) || 0,
    height: Number(raw.height) || 0,
    prepared: Boolean(raw.prepared),
    inverted: Boolean(raw.inverted),
    cropped: Boolean(raw.cropped),
  };
}

let child: ChildProcess | null = null;
let ready: Promise<void> | null = null;

function pythonCandidates(): { bin: string; prefix: string[] }[] {
  if (process.env.XRAY_PYTHON) return [{ bin: process.env.XRAY_PYTHON, prefix: [] }];
  if (process.platform === "win32") {
    return [
      { bin: "python", prefix: [] },
      { bin: "py", prefix: ["-3"] },
    ];
  }
  return [
    { bin: "python3", prefix: [] },
    { bin: "python", prefix: [] },
  ];
}

function positionFromBox(bbox: [number, number, number, number]): string {
  const cx = (bbox[0] + bbox[2]) / 2;
  const cy = (bbox[1] + bbox[3]) / 2;
  const upper = cy < 0.48;
  const right = cx < 0.5;
  // Suffixed "Region" because bbox center only approximates a screen quadrant,
  // not a confirmed tooth-level diagnosis (the model has no tooth numbering).
  if (upper && right) return "upperRightRegion";
  if (upper && !right) return "upperLeftRegion";
  if (!upper && right) return "lowerRightRegion";
  return "lowerLeftRegion";
}

export function detectionsToFindings(detections: RawDetection[]): Finding[] {
  return detections.map((d, i) => {
    const mapped = routeXrayClass(d.cls, d.name);
    const bbox = d.xyxyn;
    return annotateFinding({
      id: `x-${d.cls}-${i}-${Math.round(bbox[0] * 1000)}-${Math.round(bbox[1] * 1000)}`,
      key: mapped.key,
      confidence: d.conf,
      tooth: "-",
      positionKey: positionFromBox(bbox),
      severity: severityOf(d.conf),
      descriptionKey: mapped.descriptionKey,
      bbox,
      colorVar: mapped.colorVar,
      source: "xray",
      modelName: "xray",
      modelClassId: d.cls,
      modelClassName: d.name,
      specialistId: mapped.specialist,
      displayPolicy: mapped.policy,
    });
  });
}

async function health(): Promise<boolean> {
  try {
    const res = await fetch(`http://${INFER_HOST}:${INFER_PORT}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function startServer(): Promise<void> {
  if (await health()) return;
  if (!existsSync(SCRIPT)) {
    throw new Error(`Inference script missing: ${SCRIPT}`);
  }
  const candidates = pythonCandidates();
  let proc: ChildProcess | null = null;
  let lastErr = "";
  for (const { bin, prefix } of candidates) {
    const next = spawn(bin, [...prefix, SCRIPT, "--serve", "--host", INFER_HOST, "--port", String(INFER_PORT)], {
      cwd: ROOT,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const launched = await new Promise<boolean>((resolve) => {
      const onError = (err: Error) => {
        lastErr = err.message;
        resolve(false);
      };
      next.once("error", onError);
      next.once("spawn", () => {
        next.off("error", onError);
        resolve(true);
      });
    });
    if (launched) {
      proc = next;
      break;
    }
  }
  if (!proc) {
    throw new Error(`Could not start Python (${lastErr || "no interpreter"})`);
  }
  child = proc;
  proc.stdout?.on("data", (buf: Buffer) => {
    process.stdout.write(`[xray-infer] ${buf.toString()}`);
  });
  proc.stderr?.on("data", (buf: Buffer) => {
    process.stderr.write(`[xray-infer] ${buf.toString()}`);
  });
  proc.on("exit", (code) => {
    if (child === proc) {
      child = null;
      ready = null;
    }
    process.stderr.write(`[xray-infer] exited code=${code}\n`);
  });

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (proc.exitCode != null) {
      throw new Error(`Python inference process exited (code ${proc.exitCode})`);
    }
    if (await health()) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("Timed out waiting for the X-ray inference server");
}

async function ensureServer(): Promise<void> {
  if (await health()) return;
  if (!ready) {
    ready = startServer().catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
}

export async function handleXrayInfer(request: Request): Promise<Response> {
  if (request.method === "GET") {
    try {
      await ensureServer();
      const ok = await health();
      return Response.json({ ok });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ ok: false, error: message }, { status: 503 });
    }
  }

  let body: { image?: unknown; conf?: unknown };
  try {
    body = (await request.json()) as { image?: unknown; conf?: unknown };
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const image = typeof body.image === "string" ? body.image : "";
  if (!image) {
    return Response.json({ ok: false, error: "Missing image" }, { status: 400 });
  }

  try {
    await ensureServer();
    const res = await fetch(`http://${INFER_HOST}:${INFER_PORT}/predict`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        image,
        conf: typeof body.conf === "number" ? body.conf : 0.15,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const payload = (await res.json()) as InferPayload;
    if (!payload.ok) {
      return Response.json(
        { ok: false, error: payload.error || "Inference failed" },
        { status: 500 },
      );
    }
    const findings = detectionsToFindings(payload.detections ?? []);
    return Response.json({
      ok: true,
      weights: payload.weights ?? null,
      findings,
      count: findings.length,
      quality: parseQuality(payload.quality),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
