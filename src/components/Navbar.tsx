"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Link2, LogOut, Menu, Upload, X } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

export function Navbar() {
  const stats = useQuery(api.auth.getUserStats);
  const unreadCount = useQuery(api.chat.getUnreadCount);
  const updateAvatar = useMutation(api.auth.updateAvatar);
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const navLinks = [
    { label: "Feed", href: "/feed" },
    { label: "My Posts", href: "/my-posts" },
    { label: "Messages", href: "/messages" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  const handleLogout = async () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
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
      setMenuOpen(false);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E9ECEF] shadow-sm">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-7 h-[62px] flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <Link href="/feed" className="logo flex items-center gap-2.5 no-underline shrink-0">
          <div className="logo-mark w-9 h-9 rounded-[10px] bg-[#5BC4F5] flex items-center justify-center text-[#0D4F66] transition-transform duration-300">
            <Link2 size={17} />
          </div>
          <span className="logo-name font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-[1.15rem]">
            <span className="text-[#1A9FD4]">WVSU</span><span className="text-black">LF</span>
          </span>
        </Link>
        {/* Nav Links */}
        <ul className="hidden md:flex nav-links gap-0.5 list-none overflow-x-auto whitespace-nowrap max-w-[52vw] sm:max-w-none">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[.84rem] font-semibold transition-all duration-200 no-underline ${pathname?.startsWith(link.href)
                  ? 'bg-[#EBF7FD] text-[#1A9FD4] font-bold' : 'text-[#868E96] hover:bg-[#F8F9FA] hover:text-[#212529]'}`}
              >
                {link.label}
                {link.label === "Messages" && !!unreadCount && unreadCount > 0 && (
                  <span className="nav-badge bg-[#FF6B6B] text-white text-[.58rem] px-1.5 py-0.5 rounded-full font-bold ml-1">{unreadCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        {/* Right */}
        <div className="nav-right flex items-center gap-2 shrink-0">
          <button className="hidden md:flex icon-btn w-9 h-9 rounded-[10px] bg-[#F8F9FA] border border-[#E9ECEF] items-center justify-center text-[15px] cursor-pointer relative transition-all duration-200 hover:bg-[#EBF7FD] hover:border-[#5BC4F5]">
            <Bell size={15} className="text-[#495057]" />
            <span className="notif-dot absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-[#FF6B6B] rounded-full border-[1.5px] border-white animate-pulse"></span>
          </button>
          <div ref={menuRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="nav-av w-9 h-9 rounded-[10px] bg-white border border-[#5bc4f54d] overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-[#5BC4F5]"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <UserAvatar
                name={stats?.name}
                avatarType={stats?.avatarType}
                avatarUrl={stats?.avatarUrl}
                size={36}
                className="w-full h-full rounded-[10px]"
              />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-[12px] border border-[#E9ECEF] bg-white shadow-lg p-1.5 z-50"
                role="menu"
                aria-label="Profile actions"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/onboarding");
                  }}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[.82rem] font-semibold text-[#212529] hover:bg-[#F8F9FA]"
                  role="menuitem"
                >
                  Customize profile
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[.82rem] font-semibold text-[#212529] hover:bg-[#F8F9FA] disabled:opacity-60"
                  role="menuitem"
                >
                  <span className="inline-flex items-center gap-2">
                    <Upload size={14} />
                    {uploading ? "Uploading avatar..." : "Upload avatar"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[.82rem] font-semibold text-[#D9480F] hover:bg-[#FFF4E6]"
                  role="menuitem"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut size={14} />
                    Log out
                  </span>
                </button>
              </div>
            )}

          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden w-9 h-9 rounded-[10px] border border-[#E9ECEF] bg-[#F8F9FA] text-[#495057] inline-flex items-center justify-center"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-all duration-300 ${mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
        {/* Drawer panel */}
        <div
          className={`absolute top-0 left-0 h-full w-[280px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#E9ECEF]">
            <Link href="/feed" className="logo flex items-center gap-2.5 no-underline" onClick={() => setMobileMenuOpen(false)}>
              <div className="logo-mark w-8 h-8 rounded-[9px] bg-[#5BC4F5] flex items-center justify-center text-[#0D4F66]">
                <Link2 size={15} />
              </div>
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-[1.05rem]">
                <span className="text-[#1A9FD4]">WVSU</span><span className="text-black">LF</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 rounded-[8px] border border-[#E9ECEF] bg-[#F8F9FA] text-[#868E96] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* Profile card */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E9ECEF] bg-[#F8F9FA]">
            <UserAvatar
              name={stats?.name}
              avatarType={stats?.avatarType}
              avatarUrl={stats?.avatarUrl}
              size={40}
              className="rounded-[10px] shrink-0"
            />
            <div className="min-w-0">
              <div className="text-[.88rem] font-bold text-[#212529] truncate">{stats?.name ?? "Profile"}</div>
              <div className="text-[.75rem] text-[#868E96] truncate">{stats?.college ?? "WVSU"}</div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1 px-3 py-3 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-3 rounded-[10px] text-[.88rem] font-semibold no-underline transition-colors ${pathname?.startsWith(link.href)
                  ? "bg-[#EBF7FD] text-[#1A9FD4]"
                  : "text-[#495057] hover:bg-[#F8F9FA]"}`}
              >
                <span>{link.label}</span>
                {link.label === "Messages" && !!unreadCount && unreadCount > 0 && (
                  <span className="bg-[#FF6B6B] text-white text-[.62rem] px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="px-3 pb-5 flex flex-col gap-1 border-t border-[#E9ECEF] pt-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/onboarding");
              }}
              className="w-full text-left px-3 py-2.5 rounded-[10px] text-[.87rem] font-semibold text-[#212529] hover:bg-[#F8F9FA] transition-colors"
            >
              Customize profile
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => avatarInputRef.current?.click()}
              className="w-full text-left px-3 py-2.5 rounded-[10px] text-[.87rem] font-semibold text-[#212529] hover:bg-[#F8F9FA] transition-colors disabled:opacity-60 inline-flex items-center gap-2"
            >
              <Upload size={14} />
              {uploading ? "Uploading avatar..." : "Upload avatar"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2.5 rounded-[10px] text-[.87rem] font-semibold text-[#D9480F] hover:bg-[#FFF4E6] transition-colors inline-flex items-center gap-2"
            >
              <LogOut size={14} />
              Log out
            </button>
          </div>
        </div>
      </div>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />
    </nav>
  );
}
