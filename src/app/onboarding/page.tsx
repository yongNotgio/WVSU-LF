"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";
import { useRouter } from "next/navigation";

const COLLEGES = [
  { code: "CAS", name: "College of Arts and Sciences" },
  { code: "CBM", name: "College of Business and Management" },
  { code: "COC", name: "College of Communication" },
  { code: "COD", name: "College of Dentistry" },
  { code: "COE", name: "College of Education" },
  { code: "CICT", name: "College of Information and Communications Technology" },
  { code: "COM", name: "College of Medicine" },
  { code: "CON", name: "College of Nursing" },
  { code: "PESCAR", name: "College of PESCAR" },
  { code: "COL", name: "College of Law" },
  { code: "ILS", name: "Integrated Laboratory School" },
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
              className="h-20 w-auto"
            />
          </div>
          <div className="text-xs text-wvsu-muted mt-1 font-mono">
            COMPLETE YOUR PROFILE
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-wvsu-border rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-wvsu-blue px-5 py-4">
            <div className="font-display text-lg text-white">Profile Setup</div>
          </div>
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-wvsu-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-wvsu-blue transition-colors"
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
                className="w-full border border-wvsu-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-wvsu-blue transition-colors bg-white"
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
              className="w-full bg-wvsu-blue rounded-xl text-white py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-wvsu-blue-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Get Started"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
