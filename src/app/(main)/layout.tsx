"use client";

import { useEffect } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wvsu-off-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-wvsu-blue border-3 border-wvsu-gold flex items-center justify-center font-display text-2xl text-white font-black mx-auto mb-3 animate-pulse">
            W
          </div>
          <div className="text-sm text-wvsu-muted font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-wvsu-off-white">
      <Navbar />
      <main className="pt-0 pb-8">
        <div className="mx-auto w-full max-w-[1280px] px-0">
          {children}
        </div>
      </main>
    </div>
  );
}
