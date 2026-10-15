import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Finding } from "./types";

const INFER_PORT = Number(process.env.INTRAORAL_INFER_PORT || 8766);
const INFER_HOST = "127.0.0.1";
const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, "scripts", "infer-intraoral.py");

type InferResponse = {
  ok: boolean;
  error?: string;
  findings?: Finding[];
  count?: number;
  mio_classification?: unknown;
};

let child: ChildProcess | null = null;
let ready: Promise<void> | null = null;

function pythonCandidates(): { bin: string; prefix: string[] }[] {
  if (process.env.INTRAORAL_PYTHON) return [{ bin: process.env.INTRAORAL_PYTHON, prefix: [] }];
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
    process.stdout.write(`[intraoral-infer] ${buf.toString()}`);
  });
  proc.stderr?.on("data", (buf: Buffer) => {
    process.stderr.write(`[intraoral-infer] ${buf.toString()}`);
  });
  proc.on("exit", (code) => {
    if (child === proc) {
      child = null;
      ready = null;
    }
    process.stderr.write(`[intraoral-infer] exited code=${code}\n`);
  });

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (proc.exitCode != null) {
      throw new Error(`Python inference process exited (code ${proc.exitCode})`);
    }
    if (await health()) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("Timed out waiting for the intraoral inference server");
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

export async function handleIntraoralInfer(request: Request): Promise<Response> {
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

  let body: { image?: unknown };
  try {
    body = (await request.json()) as { image?: unknown };
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
      body: JSON.stringify({ image }),
      signal: AbortSignal.timeout(120_000),
    });
    const payload = (await res.json()) as InferResponse;
    if (!payload.ok) {
      return Response.json(
        { ok: false, error: payload.error || "Inference failed" },
        { status: 500 },
      );
    }
    return Response.json({
      ok: true,
      findings: payload.findings ?? [],
      count: payload.count ?? 0,
      ...(payload.mio_classification ? { mio_classification: payload.mio_classification } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
