"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";

const COLLEGES = [
  { code: "CICT", name: "College of Information and Communications Technology" },
  { code: "CON", name: "College of Nursing" },
  { code: "CAS", name: "College of Arts and Sciences" },
  { code: "CED", name: "College of Education" },
  { code: "CBAA", name: "College of Business Administration and Accountancy" },
  { code: "COE", name: "College of Engineering" },
  { code: "COM", name: "College of Medicine" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useQuery(api.auth.currentUser);
  const updateProfile = useMutation(api.auth.updateProfile);

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [loading, setLoading] = useState(false);

  // If user already has a name/college, redirect to feed
  if (user && user.name && user.college) {
    router.push("/feed");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !college) return;

    setLoading(true);
    try {
      await updateProfile({ name: name.trim(), college });
      router.push("/feed");
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
            Welcome to WVS<span className="text-wvsu-gold">ULF</span>
          </div>
          <div className="text-xs text-wvsu-muted mt-1 font-mono">
            COMPLETE YOUR PROFILE
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border-2 border-wvsu-border shadow-[4px_4px_0_var(--blue)]">
          <div className="bg-wvsu-blue px-4 py-3">
            <div className="font-display text-lg text-white">Profile Setup</div>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
                College
              </label>
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full border-2 border-wvsu-border px-3 py-2 text-sm outline-none focus:border-wvsu-blue transition-colors bg-white"
                required
              >
                <option value="">Select your college</option>
                {COLLEGES.map((c) => (
                  <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wvsu-blue text-white py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-wvsu-blue-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Get Started"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
