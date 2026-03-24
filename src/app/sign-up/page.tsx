"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signUp" });
      router.push("/onboarding");
    } catch {
      setError("Failed to create account. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-wvsu-off-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5">
            <Image
              src="/logo.png"
              alt="WVSU LF Logo"
              width={46}
              height={46}
              priority
              className="h-10 w-auto"
            />
          </div>
          <div className="text-xs text-wvsu-muted mt-1 font-mono">
            CREATE YOUR ACCOUNT
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-wvsu-border rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-wvsu-blue px-5 py-4">
            <div className="font-display text-lg text-white">Sign Up</div>
          </div>
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="bg-lost-red/10 border border-lost-red text-lost-red text-xs px-3 py-2">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@wvsu.edu.ph"
                className="w-full border border-wvsu-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-wvsu-blue transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full border border-wvsu-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-wvsu-blue transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full border border-wvsu-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-wvsu-blue transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wvsu-blue rounded-xl text-white py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-wvsu-blue-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <div className="px-5 pb-6 text-center">
            <span className="text-xs text-wvsu-muted">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-wvsu-blue font-semibold hover:underline"
              >
                Sign In
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
