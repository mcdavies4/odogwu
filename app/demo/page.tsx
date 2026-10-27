import { SprayScreen } from "@/components/SprayScreen";

export const metadata = { title: "Try spraying · Odogwu" };

// No payment, no database: a ₦5,000 practice pack to feel the swipe.
export default function Demo() {
  return <SprayScreen slug="demo" celebrant="the birthday girl" reference="demo" />;
}
