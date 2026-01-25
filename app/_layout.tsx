import { useAuthStore } from "@/src/store/auth.store";
import { TechStatus, UserRole } from "@/src/types/auth.types";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const { token, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const group = segments[0]; // (auth) | (tabs) | (flows)
    const pathname = segments.join("/");

    // 1️⃣ NO autenticado → auth
    if (!token) {
      if (group !== "(auth)") {
        router.replace("/login");
      }
      return;
    }

    // 2️⃣ Técnico pendiente → verification
    if (user?.role === UserRole.TECH && user.state === TechStatus.PENDING) {
      if (pathname !== "(flows)/verification_code") {
        router.replace("/verification_code");
      }
      return;
    }

    // 3️⃣ Usuario normal → tabs
    if (group !== "(tabs)") {
      router.replace("/home");
    }
  }, [token, user, segments, mounted]);

  return <Slot />;
}
