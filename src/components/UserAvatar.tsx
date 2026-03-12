"use client";

import { useState } from "react";
import Image from "next/image";

interface UserAvatarProps {
  name?: string;
  avatarType?: string;
  avatarSeed?: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({
  name,
  avatarType,
  avatarSeed,
  avatarUrl,
  size = 40,
  className = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Uploaded avatar
  if (avatarType === "upload" && avatarUrl && !imgError) {
    return (
      <Image
        src={avatarUrl}
        alt={name ?? "Avatar"}
        width={size}
        height={size}
        className={`object-cover ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Multiavatar via API (default)
  if (!imgError) {
    const seed = encodeURIComponent(avatarSeed || name || "default");
    return (
      <Image
        src={`https://api.multiavatar.com/${seed}.svg`}
        alt={`${name ?? "User"}'s avatar`}
        width={size}
        height={size}
        className={className}
        unoptimized
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: initials
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div
      style={{ width: size, height: size }}
      className={`bg-wvsu-gold flex items-center justify-center text-wvsu-blue font-black font-display ${className}`}
    >
      <span style={{ fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
}
