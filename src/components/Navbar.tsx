"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Star, Upload } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

export function Navbar() {
  const stats = useQuery(api.auth.getUserStats);
  const unreadCount = useQuery(api.chat.getUnreadCount);
  const updateAvatar = useMutation(api.auth.updateAvatar);
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const pathname = usePathname();
  const navLinks = [
    { label: "Feed", href: "/feed" },
    { label: "My Posts", href: "/my-posts" },
    { label: "Messages", href: "/messages" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateAvatar({ avatarId: storageId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 bg-wvsu-blue border-b-[3px] border-wvsu-blue-deeper">
      {/* Brand */}
      <Link href="/feed" className="flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] bg-white border-2 border-wvsu-gold flex items-center justify-center font-display text-sm text-wvsu-blue font-black tracking-tighter">
          W
        </div>
        <div className="font-display text-lg text-white tracking-wide">
          WVS<span className="text-wvsu-gold">ULF</span>
        </div>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-0.5">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-3.5 py-1.5 text-[13px] font-semibold uppercase tracking-wider border-b-2 transition-all ${
              pathname?.startsWith(link.href)
                ? "text-white border-b-wvsu-gold"
                : "text-white/75 border-transparent hover:text-white hover:border-wvsu-gold"
            }`}
          >
            {link.label}
            {link.label === "Messages" && !!unreadCount && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-lost-red text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full font-mono">
                {unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Karma Badge + User Menu */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 bg-wvsu-blue-deeper border border-white/15 px-3 py-1.5 text-[13px] font-bold text-wvsu-gold font-mono">
          <div className="w-[7px] h-[7px] bg-wvsu-gold rounded-full animate-pulse" />
          <Star className="h-3.5 w-3.5 fill-current" />
          {stats?.karma ?? 0} KARMA
        </div>

        {/* Avatar / User Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-sm overflow-hidden border-2 border-white/30 hover:border-wvsu-gold transition-colors"
          >
            <UserAvatar
              name={stats?.name}
              avatarType={stats?.avatarType}
              avatarUrl={stats?.avatarUrl}
              size={28}
            />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-60 bg-white border-2 border-wvsu-border shadow-[4px_4px_0_var(--blue)] z-50">
                {/* User info */}
                <div className="p-3 border-b border-wvsu-border flex items-center gap-3">
                  <div className="w-12 h-12 rounded-sm overflow-hidden shrink-0">
                    <UserAvatar
                      name={stats?.name}
                      avatarType={stats?.avatarType}
                      avatarUrl={stats?.avatarUrl}
                      size={48}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-wvsu-text truncate">
                      {stats?.name ?? "User"}
                    </div>
                    <div className="text-[11px] text-wvsu-muted font-mono">
                      {stats?.college || "No college"}
                    </div>
                  </div>
                </div>

                {/* Avatar options */}
                <div className="p-2 border-b border-wvsu-border space-y-1">
                  <div className="text-[9px] font-bold tracking-[0.12em] uppercase text-wvsu-muted font-mono px-2 pt-1">
                    Avatar
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-wvsu-text hover:bg-wvsu-light-blue transition-colors disabled:opacity-50 text-left"
                  >
                    <Upload className="h-3.5 w-3.5 text-wvsu-blue" />
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                {/* Logout */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-lost-red hover:bg-lost-red/5 transition-colors text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
