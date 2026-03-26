"use client";

import { useEffect } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Navbar } from "../../components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const storeUser = useMutation(api.auth.storeUser);
  const user = useQuery(api.auth.currentUser);

  useEffect(() => {
    if (isAuthenticated) {
      storeUser();
    }
  }, [isAuthenticated, storeUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect to onboarding if profile incomplete
  useEffect(() => {
    if (user && (!user.name || !user.college)) {
      router.push("/onboarding");
    }
  }, [user, router]);

  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wvsu-off-white flex items-center justify-center">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="WVSU LF Logo"
            width={56}
            height={56}
            priority
            className="mx-auto mb-3 h-14 w-14 animate-pulse"
          />
          <div className="text-sm text-wvsu-muted font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const year = new Date().getFullYear();

  return (
    <div className="h-[100dvh] overflow-hidden bg-wvsu-off-white flex flex-col">
      <Navbar />
      <main className="flex-1 min-h-0 overflow-hidden pt-0">
        <div className="mx-auto h-full w-full max-w-[1280px] px-0 overflow-hidden">
          {children}
        </div>
      </main>
      <footer className="hidden md:block shrink-0 border-t border-wvsu-blue/15 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-3 text-xs text-wvsu-muted sm:px-6">
          <p>WVSULF © {year}</p>
          <p>Built for the WVSU community</p>
        </div>
      </footer>
    </div>
  );
}
