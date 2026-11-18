import type { RoleId } from "@/lib/domain";
import { ROLES } from "@/lib/domain";

export function RoleToken({ role, size = 36 }: { role: RoleId; size?: number }) {
  const { color, ink, name } = ROLES[role];
  const label = name;
  if (role === "leader") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label}>
        <polygon points="24,2 44,13.5 44,34.5 24,46 4,34.5 4,13.5" fill={color} />
        <circle cx="24" cy="19" r="5" fill={ink} />
        <path d="M13 34.5c1.8-6 5.6-8.5 11-8.5s9.2 2.5 11 8.5" fill={ink} />
      </svg>
    );
  }
  if (role === "interviewer") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label}>
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
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label}>
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
      <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label}>
        <polygon points="24,3 45,24 24,45 3,24" fill={color} />
        <circle cx="24" cy="20" r="6" fill={ink} />
        <rect x="21.5" y="26" width="5" height="8" rx="1" fill={ink} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label}>
      <polygon points="24,4 46,42 2,42" fill={color} />
      <rect x="22" y="16" width="4" height="14" rx="1" fill={ink} />
      <circle cx="24" cy="35" r="2.2" fill={ink} />
    </svg>
  );
}
