import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { Slot } from "expo-router";

export default function RootLayout() {
  useAuthGuard();

  return <Slot />;
}
