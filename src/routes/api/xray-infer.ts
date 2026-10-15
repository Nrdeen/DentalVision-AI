import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/xray-infer")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleXrayInfer } = await import("@/lib/dentaai/xray-infer.server");
        return handleXrayInfer(request);
      },
      POST: async ({ request }) => {
        const { handleXrayInfer } = await import("@/lib/dentaai/xray-infer.server");
        return handleXrayInfer(request);
      },
    },
  },
});
