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
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E9ECEF] shadow-sm">
      <div className="max-w-[1280px] mx-auto px-7 h-[62px] flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/feed" className="logo flex items-center gap-2.5 no-underline shrink-0">
          <div className="logo-mark w-9 h-9 rounded-[10px] bg-[#5BC4F5] flex items-center justify-center text-[17px] transition-transform duration-300" >🔗</div>
          <span className="logo-name font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-[1.15rem]">
            <span className="text-[#1A9FD4]">WVSU</span><span className="text-black">LF</span>
          </span>
        </Link>
        {/* Nav Links */}
        <ul className="nav-links flex gap-0.5 list-none">
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
          <button className="icon-btn w-9 h-9 rounded-[10px] bg-[#F8F9FA] border border-[#E9ECEF] flex items-center justify-center text-[15px] cursor-pointer relative transition-all duration-200 hover:bg-[#EBF7FD] hover:border-[#5BC4F5]">
            🔔<span className="notif-dot absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-[#FF6B6B] rounded-full border-[1.5px] border-white animate-pulse"></span>
          </button>
          <div className="nav-av w-9 h-9 rounded-[10px] bg-[#EBF7FD] border border-[#5bc4f54d] flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif] text-[.75rem] font-extrabold text-[#1A9FD4] cursor-pointer transition-all duration-200 hover:bg-[#5BC4F5] hover:text-white">
            {stats?.name?.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) || 'JD'}
          </div>
        </div>
      </div>
    </nav>
  );
}
