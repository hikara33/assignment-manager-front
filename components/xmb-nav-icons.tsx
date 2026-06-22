type IconProps = { active: boolean; size?: number };

const inactive = "var(--nav-inactive)";
const activeColor = "var(--nav-active)";

function iconColor(active: boolean) {
  return active ? activeColor : inactive;
}

export function NavIconOverview({ active, size = 32 }: IconProps) {
  const c = iconColor(active);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="6"
        fill={active ? c : "none"}
        stroke={c}
        strokeWidth="1.5"
      />
      <rect x="8" y="8" width="7" height="7" rx="1.5" fill={active ? "var(--card-tone)" : c} />
      <rect x="17" y="8" width="7" height="4" rx="1" fill={active ? "var(--card-tone)" : c} opacity={active ? 0.7 : 1} />
      <rect x="17" y="14" width="7" height="10" rx="1" fill={active ? "var(--card-tone)" : c} opacity={active ? 0.5 : 0.7} />
      <rect x="8" y="17" width="7" height="7" rx="1.5" fill={active ? "var(--card-tone)" : c} opacity={active ? 0.85 : 1} />
    </svg>
  );
}

export function NavIconTasks({ active, size = 32 }: IconProps) {
  const c = iconColor(active);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect
        x="6"
        y="4"
        width="20"
        height="24"
        rx="5"
        fill={active ? c : "none"}
        stroke={c}
        strokeWidth="1.5"
      />
      <line x1="10" y1="11" x2="22" y2="11" stroke={active ? "var(--card-tone)" : c} strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="16" x2="19" y2="16" stroke={active ? "var(--card-tone)" : c} strokeWidth="2" strokeLinecap="round" opacity={active ? 0.8 : 0.6} />
      <line x1="10" y1="21" x2="16" y2="21" stroke={active ? "var(--card-tone)" : c} strokeWidth="2" strokeLinecap="round" opacity={active ? 0.6 : 0.4} />
    </svg>
  );
}

export function NavIconTeams({ active, size = 32 }: IconProps) {
  const c = iconColor(active);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="6"
        fill={active ? c : "none"}
        stroke={c}
        strokeWidth="1.5"
      />
      <circle cx="13" cy="13" r="3.5" fill={active ? "var(--card-tone)" : c} />
      <circle cx="21" cy="13" r="2.5" fill={active ? "var(--card-tone)" : c} opacity={active ? 0.7 : 0.5} />
      <path
        d="M7 24c0-3.5 2.5-6 6-6s6 2.5 6 6"
        fill={active ? "var(--card-tone)" : "none"}
        stroke={active ? "var(--card-tone)" : c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M19 19c3 0 6 1.5 6 5"
        fill="none"
        stroke={active ? "var(--card-tone)" : c}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={active ? 0.6 : 0.4}
      />
    </svg>
  );
}

export function NavIconProfile({ active, size = 32 }: IconProps) {
  const c = iconColor(active);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="6"
        fill={active ? c : "none"}
        stroke={c}
        strokeWidth="1.5"
      />
      <circle cx="16" cy="13" r="4" fill={active ? "var(--card-tone)" : c} />
      <path
        d="M9 25c0-4 3-7 7-7s7 3 7 7"
        fill={active ? "var(--card-tone)" : "none"}
        stroke={active ? "var(--card-tone)" : c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NavIconAdmin({ active, size = 32 }: IconProps) {
  const c = iconColor(active);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="6"
        fill={active ? c : "none"}
        stroke={c}
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="5" fill={active ? "var(--card-tone)" : "none"} stroke={active ? "var(--card-tone)" : c} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="1.5" fill={active ? c : c} />
      <line x1="16" y1="7" x2="16" y2="10" stroke={active ? "var(--card-tone)" : c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="22" x2="16" y2="25" stroke={active ? "var(--card-tone)" : c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="16" x2="10" y2="16" stroke={active ? "var(--card-tone)" : c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="16" x2="25" y2="16" stroke={active ? "var(--card-tone)" : c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
