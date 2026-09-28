"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// The admin session lives in an httpOnly cookie, so pages cannot read it
// directly — they ask the server whether the session is valid and get bounced
// to the login screen when it is not.
export function useAdminAuth() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/auth")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const ok = data?.authenticated === true;
        setAuthenticated(ok);
        if (!ok) router.replace("/admin");
      })
      .catch(() => {
        if (cancelled) return;
        setAuthenticated(false);
        router.replace("/admin");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = useCallback(async () => {
    await fetch("/api/admin/auth", { method: "DELETE" }).catch(() => {});
    router.replace("/admin");
  }, [router]);

  return { authenticated, logout };
}
