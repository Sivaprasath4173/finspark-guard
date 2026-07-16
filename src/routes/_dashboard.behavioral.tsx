import { createFileRoute } from "@tanstack/react-router";
import BehavioralPage from "@/pages/Behavioral";

export const Route = createFileRoute("/_dashboard/behavioral")({
  component: BehavioralPage,
});
