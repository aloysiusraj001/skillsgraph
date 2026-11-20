"use client";

import { useId } from "react";
import type { RoleId } from "@/lib/domain";
import { ROLES } from "@/lib/domain";

const EXPLORER_PALETTE: Record<
  RoleId | "teacher",
  { bg: string; ring: string; hood: string; suit: string; trim: string }
> = {
  leader: {
    bg: "#E8EEFC",
    ring: "#2F62E0",
    hood: "#2F62E0",
    suit: "#234CB5",
    trim: "#F6C453",
  },
  interviewer: {
    bg: "#E3F4EE",
    ring: "#0E948C",
    hood: "#0E948C",
    suit: "#0A706A",
    trim: "#A9E3D2",
  },
  mapper: {
    bg: "#FDF3DC",
    ring: "#E0941A",
    hood: "#E0941A",
    suit: "#B8740B",
    trim: "#FFE3A3",
  },
  insight: {
    bg: "#F3EEFE",
    ring: "#7A45D6",
    hood: "#7A45D6",
    suit: "#5D2FB0",
    trim: "#DFCFFE",
  },
  devil: {
    bg: "#FDECEB",
    ring: "#E25B4A",
    hood: "#E25B4A",
    suit: "#BA3E30",
    trim: "#FFD2CC",
  },
  teacher: {
    bg: "#FBF0CF",
    ring: "#B8860B",
    hood: "#1E2A44",
    suit: "#151F33",
    trim: "#F2C14E",
  },
};

export function RolePortrait({
  role,
  size = 48,
  className = "",
  initials,
  title,
}: {
  role: RoleId;
  size?: number;
  className?: string;
  initials?: string;
  title?: string;
}) {
  const uid = useId();
  const clipId = `explorer-clip-${role}-${uid}`;
  const palette = EXPLORER_PALETTE[role];
  const label = title ?? ROLES[role].name;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label={label}
      className={className}
    >
      <title>{label}</title>
      <defs>
        <clipPath id={clipId}>
          <circle cx="40" cy="40" r="36" />
        </clipPath>
      </defs>

      {/* Soft tinted medallion backdrop */}
      <circle cx="40" cy="40" r="37" fill={palette.bg} stroke={palette.ring} strokeWidth="2.5" />

      <g clipPath={`url(#${clipId})`}>
        {/* Subtle geometric backdrop glow */}
        <circle cx="57" cy="21" r="15" fill={palette.ring} opacity="0.12" />

        {/* Shoulders & Explorer Parka */}
        <path d="M16 80c2-15 11-22 24-22s22 7 24 22Z" fill={palette.suit} />
        <path
          d="M29 59c3.5 4.5 18.5 4.5 22 0"
          fill="none"
          stroke={palette.trim}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Role-specific headgear behind/around the hood */}
        {role === "devil" && (
          <>
            {/* Playful twin hood peaks */}
            <path d="M24 30l-3-11 10 5Z" fill={palette.hood} />
            <path d="M56 30l3-11-10 5Z" fill={palette.hood} />
          </>
        )}

        {role === "interviewer" && (
          <>
            {/* Oversized studio headphone band */}
            <path
              d="M20 38c0-13 9-22 20-22s20 9 20 22"
              fill="none"
              stroke="#1E2A44"
              strokeWidth="4.2"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Explorer Hood */}
        <circle cx="40" cy="37" r="19" fill={palette.hood} />
        {/* Hood inner trim ring */}
        <rect x="23" y="23.5" width="34" height="25" rx="12.5" fill={palette.trim} opacity="0.92" />
        {/* Dark Cartoon Visor Faceplate */}
        <rect x="25" y="25.5" width="30" height="21" rx="10.5" fill="#1E2A44" />

        {/* Role-specific crests, goggles, lenses & expressions */}
        {role === "leader" && (
          <>
            {/* Navigator golden star crest on hood */}
            <circle cx="40" cy="18.5" r="6" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
            <polygon points="40,14 41.6,17.4 45,18.5 41.6,19.6 40,23 38.4,19.6 35,18.5 38.4,17.4" fill="#F6C453" />
            {/* Bright confident cartoon eyes */}
            <circle cx="34" cy="35" r="2.8" fill="#FFFFFF" />
            <circle cx="46" cy="35" r="2.8" fill="#FFFFFF" />
            <circle cx="34.7" cy="34.4" r="1" fill="#A9E3D2" />
            <circle cx="46.7" cy="34.4" r="1" fill="#A9E3D2" />
            <path d="M35.5 40.5c2.2 2 6.8 2 9 0" fill="none" stroke="#F6C453" strokeWidth="2" strokeLinecap="round" />
            {/* Compass badge */}
            <circle cx="58" cy="60" r="8.5" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
            <polygon points="58,54 60.5,60 58,66 55.5,60" fill={palette.ring} />
          </>
        )}

        {role === "interviewer" && (
          <>
            {/* Headphone ear cups */}
            <rect x="17" y="29" width="6.5" height="14" rx="3.2" fill="#1E2A44" stroke={palette.trim} strokeWidth="1.4" />
            <rect x="56.5" y="29" width="6.5" height="14" rx="3.2" fill="#1E2A44" stroke={palette.trim} strokeWidth="1.4" />
            {/* Warm happy listening eyes */}
            <path d="M30.5 35.5q3.5-4 7 0" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M42.5 35.5q3.5-4 7 0" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M36 40.5c2 1.8 6 1.8 8 0" fill="none" stroke="#A9E3D2" strokeWidth="2" strokeLinecap="round" />
            {/* Studio mic prop */}
            <circle cx="58" cy="60" r="8.5" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
            <rect x="55.5" y="54" width="5" height="8" rx="2.5" fill={palette.ring} />
            <path d="M53.8 59a4.2 4.2 0 0 0 8.4 0M58 63.2v2.4" fill="none" stroke="#1E2A44" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}

        {role === "mapper" && (
          <>
            {/* Explorer goggles pushed up onto brow */}
            <rect x="27" y="15.5" width="11.5" height="8" rx="4" fill="#FFFFFF" stroke="#1E2A44" strokeWidth="1.8" />
            <rect x="41.5" y="15.5" width="11.5" height="8" rx="4" fill="#FFFFFF" stroke="#1E2A44" strokeWidth="1.8" />
            <path d="M38.5 19.5h3" stroke="#1E2A44" strokeWidth="1.8" />
            <circle cx="31.5" cy="19" r="1.4" fill="#A9E3D2" />
            <circle cx="46" cy="19" r="1.4" fill="#A9E3D2" />
            {/* Curious wide eyes */}
            <circle cx="34" cy="35" r="2.8" fill="#FFFFFF" />
            <circle cx="46" cy="35" r="2.8" fill="#FFFFFF" />
            <path d="M36 40.5c2.2 1.8 5.8 1.8 8 0" fill="none" stroke="#FFE3A3" strokeWidth="2" strokeLinecap="round" />
            {/* Connected pattern nodes badge */}
            <circle cx="58" cy="60" r="8.5" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
            <path d="M54.5 58l6.5-1.5-2.5 6.5Z" fill="none" stroke={palette.suit} strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="54.5" cy="58" r="1.7" fill={palette.suit} />
            <circle cx="61" cy="56.5" r="1.7" fill={palette.suit} />
            <circle cx="58.5" cy="63" r="1.7" fill={palette.suit} />
          </>
        )}

        {role === "insight" && (
          <>
            {/* Left eye curious + Right eye behind glowing magnifier lens */}
            <circle cx="33" cy="35.5" r="2.4" fill="#FFFFFF" />
            <circle cx="46" cy="35" r="6.8" fill="#322359" stroke="#F6C453" strokeWidth="2" />
            <circle cx="46" cy="35" r="3.4" fill="#FFFFFF" />
            <circle cx="47.5" cy="33.5" r="1.1" fill="#DFCFFE" />
            <path d="M30.5 30.5l5-1.2" stroke="#DFCFFE" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M36 41c2 1.3 5 1.3 7.5-.2" fill="none" stroke="#DFCFFE" strokeWidth="1.9" strokeLinecap="round" />
            {/* Diamond spark badge */}
            <circle cx="58" cy="60" r="8.5" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
            <polygon points="58,53.5 62.5,60 58,66.5 53.5,60" fill={palette.ring} />
            <circle cx="58" cy="60" r="1.8" fill="#FFFFFF" />
          </>
        )}

        {role === "devil" && (
          <>
            {/* Cheeky raised-eyebrow challenger eyes */}
            <path d="M30 31.5l6.5-1.2" stroke="#FFD2CC" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M42.5 29.5q3.5-3 7-.5" fill="none" stroke="#FFD2CC" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="34" cy="35.5" r="2.6" fill="#FFFFFF" />
            <circle cx="46" cy="35.5" r="2.8" fill="#FFFFFF" />
            <path d="M35.5 41.2c2.5 1 5.5.4 8-1.4" fill="none" stroke="#FFD2CC" strokeWidth="2" strokeLinecap="round" />
            {/* Challenge shield triangle badge */}
            <circle cx="58" cy="60" r="8.5" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
            <polygon points="58,54 63.5,64 52.5,64" fill={palette.ring} />
            <rect x="57.3" y="57" width="1.4" height="3.8" rx="0.7" fill="#FFFFFF" />
            <circle cx="58" cy="62.4" r="0.8" fill="#FFFFFF" />
          </>
        )}

        {/* Optional student initials tag for multi-team classrooms */}
        {initials && (
          <g>
            <circle cx="21" cy="60" r="9.5" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
            <text
              x="21"
              y="63.5"
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#1E2A44"
              fontFamily="system-ui, sans-serif"
            >
              {initials.slice(0, 2).toUpperCase()}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}

export function TeacherPortrait({
  size = 48,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const uid = useId();
  const clipId = `explorer-clip-teacher-${uid}`;
  const palette = EXPLORER_PALETTE.teacher;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label="Teacher"
      className={className}
    >
      <title>Teacher</title>
      <defs>
        <clipPath id={clipId}>
          <circle cx="40" cy="40" r="36" />
        </clipPath>
      </defs>

      <circle cx="40" cy="40" r="37" fill={palette.bg} stroke={palette.ring} strokeWidth="2.5" />

      <g clipPath={`url(#${clipId})`}>
        <circle cx="24" cy="22" r="13" fill={palette.ring} opacity="0.14" />
        {/* Navy guide coat + gold collar */}
        <path d="M16 80c2-15 11-22 24-22s22 7 24 22Z" fill={palette.suit} />
        <path d="M30 59c3.5 4.5 16.5 4.5 20 0" fill="none" stroke={palette.trim} strokeWidth="3" strokeLinecap="round" />

        {/* Guide cowl & visor */}
        <circle cx="40" cy="37" r="19" fill={palette.hood} />
        <rect x="23" y="23.5" width="34" height="25" rx="12.5" fill={palette.trim} opacity="0.95" />
        <rect x="25" y="25.5" width="30" height="21" rx="10.5" fill="#1E2A44" />

        {/* Warm calm eyes + smile */}
        <circle cx="34" cy="35" r="2.6" fill="#FFFFFF" />
        <circle cx="46" cy="35" r="2.6" fill="#FFFFFF" />
        <path d="M35.5 40.5c2.5 2 6.5 2 9 0" fill="none" stroke="#F2C14E" strokeWidth="2" strokeLinecap="round" />

        {/* Gold checkmark guide badge */}
        <circle cx="58" cy="60" r="8.5" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
        <path
          d="M54.5 60.5l2.3 2.3 4.8-5.2"
          fill="none"
          stroke={palette.ring}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function RoleToken({
  role,
  size = 36,
  variant = "auto",
}: {
  role: RoleId;
  size?: number;
  variant?: "auto" | "badge" | "portrait";
}) {
  if (variant === "portrait" || (variant === "auto" && size >= 34)) {
    return <RolePortrait role={role} size={size} className="shrink-0" />;
  }

  const { color, ink, name } = ROLES[role];
  const label = name;
  if (role === "leader") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label} className="shrink-0">
        <polygon points="24,2 44,13.5 44,34.5 24,46 4,34.5 4,13.5" fill={color} />
        <circle cx="24" cy="19" r="5" fill={ink} />
        <path d="M13 34.5c1.8-6 5.6-8.5 11-8.5s9.2 2.5 11 8.5" fill={ink} />
      </svg>
    );
  }
  if (role === "interviewer") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label} className="shrink-0">
        <circle cx="24" cy="22" r="16" fill={color} />
        <path d="M16 36l-2 8 10-6" fill={color} />
        <circle cx="18" cy="22" r="2" fill={ink} />
        <circle cx="24" cy="22" r="2" fill={ink} />
        <circle cx="30" cy="22" r="2" fill={ink} />
      </svg>
    );
  }
  if (role === "mapper") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label} className="shrink-0">
        <rect x="6" y="6" width="36" height="36" rx="10" fill={color} />
        <circle cx="16" cy="18" r="3" fill={ink} />
        <circle cx="32" cy="16" r="3" fill={ink} />
        <circle cx="24" cy="30" r="3" fill={ink} />
        <path d="M18 19l12-2M18 20l5 8M30 18l-5 10" stroke={ink} strokeWidth="2" fill="none" />
      </svg>
    );
  }
  if (role === "insight") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label} className="shrink-0">
        <polygon points="24,3 45,24 24,45 3,24" fill={color} />
        <circle cx="24" cy="20" r="6" fill={ink} />
        <rect x="21.5" y="26" width="5" height="8" rx="1" fill={ink} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label} className="shrink-0">
      <polygon points="24,4 46,42 2,42" fill={color} />
      <rect x="22" y="16" width="4" height="14" rx="1" fill={ink} />
      <circle cx="24" cy="35" r="2.2" fill={ink} />
    </svg>
  );
}
