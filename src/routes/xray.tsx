import { createFileRoute } from "@tanstack/react-router";
import { PanoramicPage } from "@/components/analysis/panoramic-page";

export const Route = createFileRoute("/xray")({
  ssr: false,
  component: XrayPage,
});

function XrayPage() {
  return <PanoramicPage />;
}
