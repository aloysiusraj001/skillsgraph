import type { RoleId } from "@/lib/domain";
import { ROLES } from "@/lib/domain";

const PORTRAIT_TINT: Record<RoleId | "teacher", { bg: string; ring: string; skin: string; hair: string; coat: string }> = {
  leader: {
    bg: "#E8EEFC",
    ring: "#2F62E0",
    skin: "#A86B43",
    hair: "#1E2235",
    coat: "#2F62E0",
  },
  interviewer: {
    bg: "#E3F4EE",
    ring: "#0E948C",
    skin: "#F0C3A4",
    hair: "#3D2B24",
    coat: "#0E948C",
  },
  mapper: {
    bg: "#FDF3DC",
    ring: "#E0941A",
    skin: "#F4CEAE",
    hair: "#1F2430",
    coat: "#C97D0C",
  },
  insight: {
    bg: "#F3EEFE",
    ring: "#7A45D6",
    skin: "#D99B72",
    hair: "#2A2438",
    coat: "#7A45D6",
  },
  devil: {
    bg: "#FDECEB",
    ring: "#E25B4A",
    skin: "#E8B494",
    hair: "#27232A",
    coat: "#C94435",
  },
  teacher: {
    bg: "#FBF0CF",
    ring: "#B8860B",
    skin: "#E7B996",
    hair: "#2C3548",
    coat: "#1E2A44",
  },
};

export function RolePortrait({
  role,
  size = 48,
  className = "",
}: {
  role: RoleId;
  size?: number;
  className?: string;
}) {
  const palette = PORTRAIT_TINT[role];
  const label = ROLES[role].name;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label={label}
      className={className}
    >
      <defs>
        <clipPath id={`clip-${role}-${size}`}>
          <circle cx="40" cy="40" r="36" />
        </clipPath>
      </defs>

      {/* Soft tinted medallion backdrop */}
      <circle cx="40" cy="40" r="37" fill={palette.bg} stroke={palette.ring} strokeWidth="2.5" />

      <g clipPath={`url(#clip-${role}-${size})`}>
        {/* Subtle geometric backdrop motif */}
        <circle cx="56" cy="22" r="14" fill={palette.ring} opacity="0.1" />

        {role === "leader" && (
          <>
            {/* Shoulders & crisp collar */}
            <path d="M16 80c2-17 11-24 24-24s22 7 24 24Z" fill={palette.coat} />
            <path d="M33 56l7 8 7-8" fill="#FFFFFF" opacity="0.9" />
            {/* Hair back + neck */}
            <circle cx="40" cy="31" r="17" fill={palette.hair} />
            <rect x="35" y="45" width="10" height="12" rx="5" fill={palette.skin} />
            {/* Face */}
            <circle cx="40" cy="35" r="13" fill={palette.skin} />
            {/* Curly top & warm headband */}
            <circle cx="30" cy="25" r="6" fill={palette.hair} />
            <circle cx="40" cy="21" r="6.5" fill={palette.hair} />
            <circle cx="50" cy="25" r="6" fill={palette.hair} />
            <path d="M28 28c6-4 18-4 24 0" fill="none" stroke="#F6C453" strokeWidth="2.5" strokeLinecap="round" />
            {/* Calm eyes & smile */}
            <circle cx="35.5" cy="35.5" r="1.5" fill="#1E2235" />
            <circle cx="44.5" cy="35.5" r="1.5" fill="#1E2235" />
            <path d="M36 41c2.2 2 5.8 2 8 0" fill="none" stroke="#6E3B20" strokeWidth="1.8" strokeLinecap="round" />
            {/* Compass / leadership pin */}
            <circle cx="57" cy="60" r="8" fill="#FFFFFF" stroke={palette.ring} strokeWidth="2" />
            <polygon points="57,54 59.5,60 57,66 54.5,60" fill={palette.ring} />
          </>
        )}

        {role === "interviewer" && (
          <>
            {/* Jacket & scarf */}
            <path d="M15 80c2-16 11-23 25-23s23 7 25 23Z" fill={palette.coat} />
            <path d="M31 57c3 5 15 5 18 0" fill="none" stroke="#A9E3D2" strokeWidth="4" strokeLinecap="round" />
            <rect x="35" y="45" width="10" height="12" rx="5" fill={palette.skin} />
            {/* Head & textured short hair */}
            <circle cx="40" cy="35" r="13" fill={palette.skin} />
            <path d="M27 33c0-10 6-16 13-16s13 6 13 15c-3-4-7-6-13-6s-10 2-13 7Z" fill={palette.hair} />
            {/* Expressive round glasses */}
            <circle cx="35" cy="36" r="4.2" fill="none" stroke="#1E2A44" strokeWidth="1.7" />
            <circle cx="45" cy="36" r="4.2" fill="none" stroke="#1E2A44" strokeWidth="1.7" />
            <path d="M39.2 36h1.6" stroke="#1E2A44" strokeWidth="1.7" />
            <circle cx="35" cy="36" r="1.3" fill="#1E2A44" />
            <circle cx="45" cy="36" r="1.3" fill="#1E2A44" />
            <path d="M36.5 42c2 1.6 5 1.6 7 0" fill="none" stroke="#7A4630" strokeWidth="1.7" strokeLinecap="round" />
            {/* Studio mic + sound wave */}
            <rect x="55" y="51" width="7" height="12" rx="3.5" fill="#1E2A44" stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M58.5 63v6M52 57a6.5 6.5 0 0 0 13 0" fill="none" stroke="#1E2A44" strokeWidth="1.6" strokeLinecap="round" />
          </>
        )}

        {role === "mapper" && (
          <>
            {/* Cardigan */}
            <path d="M16 80c2-16 11-23 24-23s22 7 24 23Z" fill={palette.coat} />
            <path d="M34 57l6 10 6-10" fill="#FFF8EB" />
            {/* Sleek bob hair */}
            <path d="M23 36c0-13 7-20 17-20s17 7 17 20v13H23V36Z" fill={palette.hair} />
            <rect x="35" y="45" width="10" height="12" rx="5" fill={palette.skin} />
            <circle cx="40" cy="35" r="12.5" fill={palette.skin} />
            {/* Clean fringe */}
            <path d="M27.5 31c4-5 10-7 16.5-5 4 1.2 6.5 3 8.5 5-4-4-9-7-15-7-5 0-8 3-10 7Z" fill={palette.hair} />
            <circle cx="35.5" cy="36" r="1.4" fill="#1F2430" />
            <circle cx="44.5" cy="36" r="1.4" fill="#1F2430" />
            <path d="M36.5 41.5c2 1.6 5 1.6 7 0" fill="none" stroke="#8C5132" strokeWidth="1.7" strokeLinecap="round" />
            {/* Connected pattern nodes */}
            <circle cx="57" cy="59" r="9" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
            <path d="M53.5 57l6.5-1.5-2.5 6.5Z" fill="none" stroke={palette.coat} strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="53.5" cy="57" r="1.8" fill={palette.coat} />
            <circle cx="60" cy="55.5" r="1.8" fill={palette.coat} />
            <circle cx="57.5" cy="62" r="1.8" fill={palette.coat} />
          </>
        )}

        {role === "insight" && (
          <>
            {/* Sweater */}
            <path d="M16 80c2-16 11-23 24-23s22 7 24 23Z" fill={palette.coat} />
            <path d="M33 58c3 4 11 4 14 0" fill="none" stroke="#E9DFFE" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="35" y="45" width="10" height="12" rx="5" fill={palette.skin} />
            <circle cx="40" cy="35" r="13" fill={palette.skin} />
            {/* Wavy swept hair */}
            <path d="M26 35c-1-11 6-18 15-18 8 0 13 6 12 15-4-5-9-6-15-5-5 1-9 4-12 8Z" fill={palette.hair} />
            {/* Rectangular analytical glasses */}
            <rect x="30.5" y="33" width="8" height="6" rx="2" fill="none" stroke="#1E2235" strokeWidth="1.6" />
            <rect x="41.5" y="33" width="8" height="6" rx="2" fill="none" stroke="#1E2235" strokeWidth="1.6" />
            <path d="M38.5 35.5h3" stroke="#1E2235" strokeWidth="1.6" />
            <circle cx="34.5" cy="36" r="1.3" fill="#1E2235" />
            <circle cx="45.5" cy="36" r="1.3" fill="#1E2235" />
            <path d="M36.5 42c2 1.4 5 1.4 7 0" fill="none" stroke="#7A4528" strokeWidth="1.7" strokeLinecap="round" />
            {/* Glowing lightbulb / diamond spark */}
            <circle cx="57.5" cy="59" r="9" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
            <polygon points="57.5,52.5 62.5,59 57.5,65.5 52.5,59" fill={palette.ring} />
            <circle cx="57.5" cy="59" r="2" fill="#FFFFFF" />
          </>
        )}

        {role === "devil" && (
          <>
            {/* Structured jacket */}
            <path d="M16 80c2-16 11-23 24-23s22 7 24 23Z" fill={palette.coat} />
            <path d="M32 57l8 9 8-9" fill="#FFFFFF" opacity="0.92" />
            {/* Voluminous dark hair */}
            <path d="M23 40c0-15 7-23 17-23s17 8 17 23v8H23v-8Z" fill={palette.hair} />
            <rect x="35" y="45" width="10" height="12" rx="5" fill={palette.skin} />
            <circle cx="40" cy="35" r="12.5" fill={palette.skin} />
            {/* Side-swept brow hair & observant expression */}
            <path d="M27.5 32c5-6 13-7 25-2-2-6-7-9-13-9-6 0-10 4-12 11Z" fill={palette.hair} />
            <path d="M32.5 32l5-1" stroke={palette.hair} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M42.5 31.5l5 .5" stroke={palette.hair} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="35.5" cy="36" r="1.4" fill="#27232A" />
            <circle cx="44.5" cy="36" r="1.4" fill="#27232A" />
            <path d="M37 42c2 1 4.5.8 6.5-.3" fill="none" stroke="#854B34" strokeWidth="1.7" strokeLinecap="round" />
            {/* Challenge triangle shield */}
            <circle cx="57.5" cy="59" r="9" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
            <polygon points="57.5,53 63,63 52,63" fill={palette.ring} />
            <rect x="56.8" y="56" width="1.4" height="4" rx="0.7" fill="#FFFFFF" />
            <circle cx="57.5" cy="61.5" r="0.8" fill="#FFFFFF" />
          </>
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
  const palette = PORTRAIT_TINT.teacher;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label="Teacher"
      className={className}
    >
      <defs>
        <clipPath id={`clip-teacher-${size}`}>
          <circle cx="40" cy="40" r="36" />
        </clipPath>
      </defs>
      <circle cx="40" cy="40" r="37" fill={palette.bg} stroke={palette.ring} strokeWidth="2.5" />
      <g clipPath={`url(#clip-teacher-${size})`}>
        <circle cx="24" cy="22" r="12" fill={palette.ring} opacity="0.14" />
        <path d="M16 80c2-16 11-23 24-23s22 7 24 23Z" fill={palette.coat} />
        <path d="M33 57l7 9 7-9" fill="#FFFFFF" opacity="0.92" />
        <rect x="35" y="45" width="10" height="12" rx="5" fill={palette.skin} />
        <circle cx="40" cy="35" r="13" fill={palette.skin} />
        <path d="M27 33c0-10 6-16 13-16s13 6 13 15c-4-4-8-5-13-5s-9 2-13 6Z" fill={palette.hair} />
        <circle cx="35.5" cy="35.5" r="1.4" fill="#1E2A44" />
        <circle cx="44.5" cy="35.5" r="1.4" fill="#1E2A44" />
        <path d="M36 41c2.2 1.8 5.8 1.8 8 0" fill="none" stroke="#7A4C2E" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="57" cy="59" r="8.5" fill="#FFFFFF" stroke={palette.ring} strokeWidth="1.8" />
        <path d="M53.5 59.5l2.3 2.3 4.8-5.2" fill="none" stroke={palette.ring} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
