import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/intraoral-infer")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleIntraoralInfer } = await import("@/lib/dentaai/intraoral-infer.server");
        return handleIntraoralInfer(request);
      },
      POST: async ({ request }) => {
        const { handleIntraoralInfer } = await import("@/lib/dentaai/intraoral-infer.server");
        return handleIntraoralInfer(request);
      },
    },
  },
});
