"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
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
    <div className="min-h-screen bg-wvsu-off-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-wvsu-blue border-3 border-wvsu-gold flex items-center justify-center font-display text-2xl text-white font-black mx-auto mb-3">
            W
          </div>
          <div className="font-display text-2xl text-wvsu-text">
            WVS<span className="text-wvsu-gold">ULF</span>
          </div>
          <div className="text-xs text-wvsu-muted mt-1 font-mono">
            CREATE YOUR ACCOUNT
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border-2 border-wvsu-border shadow-[4px_4px_0_var(--blue)]">
          <div className="bg-wvsu-blue px-4 py-3">
            <div className="font-display text-lg text-white">Sign Up</div>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors"
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
                className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors"
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
                className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wvsu-blue text-white py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-wvsu-blue-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <div className="px-5 pb-5 text-center">
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
