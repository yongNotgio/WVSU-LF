"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  FileText,
  Grid2x2,
  LogOut,
  Menu,
  MessageSquare,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { UserAvatar } from "./UserAvatar";

export function Navbar() {
  const stats = useQuery(api.auth.getUserStats);
  const unreadCount = useQuery(api.chat.getUnreadCount);
  const notifications = useQuery(api.notifications.getMyNotifications, { limit: 8 });
  const unreadNotificationCount = useQuery(api.notifications.getUnreadNotificationCount);
  const updateAvatar = useMutation(api.auth.updateAvatar);
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  const markNotificationRead = useMutation(api.notifications.markNotificationRead);
  const markAllNotificationsRead = useMutation(api.notifications.markAllNotificationsRead);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const navLinks = [
    { label: "Feed", href: "/feed", icon: Grid2x2 },
    { label: "My Posts", href: "/my-posts", icon: FileText },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
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

  const openNotification = async (note: {
    _id: Id<"notifications">;
    isRead: boolean;
    link?: string;
  }) => {
    if (!note.isRead) {
      await markNotificationRead({ notificationId: note._id });
    }
    setNotifOpen(false);
    if (note.link) {
      router.push(note.link);
    }
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (!notifRef.current) return;
      if (!notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setNotifOpen(false);
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
    <>
      <nav className="top-nav">
      <div
        className={`nav-wrap ${
          mobileMenuOpen
            ? "pointer-events-none opacity-0 md:pointer-events-auto md:opacity-100"
            : ""
        }`}
      >
        {/* Brand */}
        <Link href="/feed" className="logo flex items-center no-underline shrink-0 gap--5.5">
            <Image
              src="/logo.png"
              alt="WVSU LF Logo"
              width={50}
              height={50}
              priority
              className="h-20 w-auto"
            />
        </Link>
        {/* Nav Links */}
        <ul className="hidden md:flex nav-links gap-0.5 list-none overflow-x-auto whitespace-nowrap max-w-[52vw] sm:max-w-none ml-auto">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname?.startsWith(link.href) ? "on" : ""}
              >
                <link.icon size={16} />
                {link.label}
                {link.label === "Messages" && !!unreadCount && unreadCount > 0 && (
                  <span className="nav-badge bg-[#EF4444] text-white text-[10px] px-1.5 py-[1px] rounded-full font-bold ml-1">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        {/* Right */}
        <div className="nav-right flex items-center gap-2 shrink-0">
          <div ref={notifRef} className="relative hidden md:block">
            <button
              className="icon-btn w-9 h-9 rounded-[10px] bg-white border border-[rgba(59,155,212,0.15)] items-center justify-center text-[15px] cursor-pointer relative transition-all duration-200 hover:bg-[#C8E4F7] hover:border-[rgba(59,155,212,0.25)] hover:shadow-sm inline-flex"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="Open notifications"
              type="button"
            >
              <Bell size={15} className="text-[#4A6478]" />
              {!!unreadNotificationCount && unreadNotificationCount > 0 && (
                <span className="notif-dot absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 bg-[#EF4444] rounded-full border-[1.5px] border-white text-white text-[9px] font-bold leading-[11px] flex items-center justify-center">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-[12px] border border-[rgba(59,155,212,0.15)] bg-white shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-[rgba(59,155,212,0.15)] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A2E3B] uppercase tracking-wider">Notifications</span>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-[#1E6FA0] hover:underline disabled:opacity-50"
                    disabled={!unreadNotificationCount}
                    onClick={async () => {
                      await markAllNotificationsRead({});
                    }}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {!notifications || notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-[#7A97A8]">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((note) => (
                      <button
                        key={note._id}
                        type="button"
                        onClick={() => openNotification(note)}
                        className={`w-full text-left px-3 py-2.5 border-b border-[rgba(59,155,212,0.08)] hover:bg-[#F0F6FB] ${
                          note.isRead ? "bg-white" : "bg-[#E8F7FF]"
                        }`}
                      >
                        <div className="text-[12px] font-semibold text-[#1A2E3B]">{note.title}</div>
                        <div className="text-[11px] text-[#4A6478] mt-0.5 line-clamp-2">{note.body}</div>
                        <div className="text-[10px] text-[#7A97A8] mt-1">{getTimeAgo(note._creationTime)}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div ref={menuRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="nav-av w-9 h-9 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <UserAvatar
                name={stats?.name}
                avatarType={stats?.avatarType}
                avatarUrl={stats?.avatarUrl}
                size={36}
                className="w-full h-full rounded-full"
              />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-[12px] border border-[rgba(59,155,212,0.15)] bg-white shadow-xl p-1.5 z-50"
                role="menu"
                aria-label="Profile actions"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/onboarding");
                  }}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[.82rem] font-semibold text-[#1A2E3B] hover:bg-[#E8F2FA]"
                  role="menuitem"
                >
                  Customize profile
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[.82rem] font-semibold text-[#1A2E3B] hover:bg-[#E8F2FA] disabled:opacity-60"
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
            className="md:hidden w-9 h-9 rounded-[10px] border border-[rgba(59,155,212,0.15)] bg-white text-[#4A6478] inline-flex items-center justify-center hover:bg-[#E8F2FA]"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      </nav>

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-0 z-[500] md:hidden transition-all duration-300 ${mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 z-[501] bg-white transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
        {/* Drawer panel */}
        <div
          className={`fixed inset-y-0 left-0 z-[502] isolate h-full w-[280px] bg-white border-r border-[rgba(59,155,212,0.2)] shadow-2xl opacity-100 flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ backgroundColor: "#ffffff" }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[rgba(59,155,212,0.15)]">
            <Link href="/feed" className="logo flex items-center no-underline gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Image
                src="/logo.png"
                alt="WVSU LF Logo"
                width={34}
                height={34}
                className="h-8 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 rounded-[8px] border border-[rgba(59,155,212,0.15)] bg-[#F0F6FB] text-[#7A97A8] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* Profile card */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[rgba(59,155,212,0.15)] bg-[#F0F6FB]">
            <UserAvatar
              name={stats?.name}
              avatarType={stats?.avatarType}
              avatarUrl={stats?.avatarUrl}
              size={40}
              className="rounded-full shrink-0"
            />
            <div className="min-w-0">
              <div className="text-[.88rem] font-bold text-[#1A2E3B] truncate">{stats?.name ?? "Profile"}</div>
              <div className="text-[.75rem] text-[#7A97A8] truncate">{stats?.college ?? "WVSU"}</div>
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
                  ? "bg-[#E8F2FA] text-[#1E6FA0]"
                  : "text-[#4A6478] hover:bg-[#F0F6FB]"}`}
              >
                <span className="inline-flex items-center gap-2">
                  <link.icon size={16} />
                  {link.label}
                </span>
                {link.label === "Messages" && !!unreadCount && unreadCount > 0 && (
                  <span className="bg-[#EF4444] text-white text-[.62rem] px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile donate card */}
          <div className="mx-3 mb-2 rounded-xl border border-[#FDECB5] bg-[#FFFDF7] p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg border border-[#FDECB5] bg-white flex items-center justify-center text-sm">
                ☕
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-[#92400E] leading-tight">Keep the devs caffeinated.</div>
                <div className="text-[11px] text-[#B17108]">Buy us a coffee</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-[10px] bg-[#EFA13A] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#DE8F25]"
            >
              Donate
            </button>
          </div>

          {/* Bottom actions */}
          <div className="px-3 pb-5 flex flex-col gap-1 border-t border-[rgba(59,155,212,0.15)] pt-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/onboarding");
              }}
              className="w-full text-left px-3 py-2.5 rounded-[10px] text-[.87rem] font-semibold text-[#1A2E3B] hover:bg-[#F0F6FB] transition-colors"
            >
              Customize profile
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => avatarInputRef.current?.click()}
              className="w-full text-left px-3 py-2.5 rounded-[10px] text-[.87rem] font-semibold text-[#1A2E3B] hover:bg-[#F0F6FB] transition-colors disabled:opacity-60 inline-flex items-center gap-2"
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
    </>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
