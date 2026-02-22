import { useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/src/store/auth.store";
import { TechStatus, UserRole } from "@/src/types/auth.types";

export function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();

  const { token, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const group = segments[0];
    const pathname = segments.join("/");

    // No autenticado → auth
    if (!token) {
      if (group !== "(auth)") {
        router.replace("/login");
      }
      return;
    }

    // Técnico pendiente → verification
    if (user?.role === UserRole.TECH && user.state === TechStatus.PENDING) {
      if (pathname !== "(flows)/verification_code") {
        router.replace("/verification_code");
      }
      return;
    }

    // Técnico activo → sección técnico
    if (user?.role === UserRole.TECH) {
      if (group !== "(technician)") {
        router.replace("/(technician)/home");
      }
      return;
    }

    // Cliente → tabs generales
    if (group !== "(tabs)") {
      router.replace("/home");
    }
  }, [token, user, segments, mounted]);
}
