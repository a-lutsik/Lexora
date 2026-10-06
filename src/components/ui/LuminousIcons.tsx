// ============================================================
// LEXORA — Luminous dual-tone icons (cyan → magenta)
// Matches Concept 1 branding. Used in sidebar + Translation Hub.
// ============================================================

import { useId, type ReactNode } from 'react';

export type LuminousIconProps = {
  className?: string;
  size?: number;
};

type NeonFrameProps = LuminousIconProps & {
  children: (ids: { cyan: string; magenta: string }) => ReactNode;
};

function NeonFrame({ className, size = 18, children }: NeonFrameProps) {
  const rawId = useId().replace(/:/g, '');
  const cyan = `${rawId}-cyan`;
  const magenta = `${rawId}-magenta`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={cyan} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-neon-cyan)" />
          <stop offset="100%" stopColor="var(--color-accent-hover)" />
        </linearGradient>
        <linearGradient id={magenta} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-neon-magenta)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      {children({ cyan, magenta })}
    </svg>
  );
}

export function IconNavBook({ className = 'nav-icon', size = 18 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={`url(#${magenta})`} strokeWidth={1.75} />
          <path
            d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
            stroke={`url(#${cyan})`}
            strokeWidth={1.75}
          />
        </>
      )}
    </NeonFrame>
  );
}

export function IconNavCards({ className = 'nav-icon', size = 18 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <rect x="2" y="7" width="16" height="13" rx="2" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <path
            d="M6 7V5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2h-2"
            stroke={`url(#${magenta})`}
            strokeWidth={1.75}
          />
        </>
      )}
    </NeonFrame>
  );
}

export function IconNavPen({ className = 'nav-icon', size = 18 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <path d="M12 20h9" stroke={`url(#${magenta})`} strokeWidth={1.75} strokeLinecap="round" />
          <path
            d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
            stroke={`url(#${cyan})`}
            strokeWidth={1.75}
          />
        </>
      )}
    </NeonFrame>
  );
}

export function IconNavTranslate({ className = 'nav-icon', size = 18 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1" stroke={`url(#${cyan})`} strokeWidth={1.75} strokeLinecap="round" />
          <path d="M22 22l-5-10-5 10M14 18h6" stroke={`url(#${magenta})`} strokeWidth={1.75} strokeLinecap="round" />
        </>
      )}
    </NeonFrame>
  );
}

export function IconNavMic({ className = 'nav-icon', size = 18 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <rect x="9" y="2" width="6" height="10" rx="3" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <path d="M5 10v1a7 7 0 0014 0v-1" stroke="currentColor" strokeWidth={1.5} opacity={0.7} />
          <path d="M12 18v4M8 22h8" stroke={`url(#${magenta})`} strokeWidth={1.75} strokeLinecap="round" />
        </>
      )}
    </NeonFrame>
  );
}

export function IconNavDialogue({ className = 'nav-icon', size = 18 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <path
            d="M4 6.5C4 5.12 5.12 4 6.5 4h7C14.88 4 16 5.12 16 6.5v5c0 1.38-1.12 2.5-2.5 2.5H10l-3.5 3V14H6.5C5.12 14 4 12.88 4 11.5v-5z"
            stroke={`url(#${cyan})`}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          <path
            d="M10 16.5c0-.83.67-1.5 1.5-1.5H15l2.5 2.2V17h.5c1.1 0 2-.9 2-2v-3.5c0-.83-.67-1.5-1.5-1.5"
            stroke={`url(#${magenta})`}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </NeonFrame>
  );
}

export function IconNavCollections({ className = 'nav-icon', size = 18 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <rect x="2" y="3" width="7" height="7" rx="1.5" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <rect x="15" y="3" width="7" height="7" rx="1.5" stroke={`url(#${magenta})`} strokeWidth={1.75} />
          <rect x="2" y="14" width="7" height="7" rx="1.5" stroke={`url(#${magenta})`} strokeWidth={1.75} />
          <rect x="15" y="14" width="7" height="7" rx="1.5" stroke={`url(#${cyan})`} strokeWidth={1.75} />
        </>
      )}
    </NeonFrame>
  );
}

export function IconNavStats({ className = 'nav-icon', size = 18 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <rect x="3" y="12" width="4.5" height="9" rx="1.5" stroke={`url(#${magenta})`} strokeWidth={1.75} />
          <rect x="9.75" y="3" width="4.5" height="18" rx="1.5" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <rect x="16.5" y="8" width="4.5" height="13" rx="1.5" stroke={`url(#${magenta})`} strokeWidth={1.75} />
        </>
      )}
    </NeonFrame>
  );
}

export function IconNavSettings({ className = 'nav-icon', size = 18 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <circle cx="12" cy="12" r="3" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <path
            d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"
            stroke={`url(#${magenta})`}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </>
      )}
    </NeonFrame>
  );
}

export function IconMic({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan }) => (
        <>
          <rect x="9" y="3" width="6" height="10" rx="3" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <path d="M6 10v1a6 6 0 0012 0v-1M12 17v4M9 21h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        </>
      )}
    </NeonFrame>
  );
}

export function IconUpload({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <path d="M12 16V5M8 9l4-4 4 4" stroke={`url(#${cyan})`} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19h14" stroke={`url(#${magenta})`} strokeWidth={1.75} strokeLinecap="round" />
        </>
      )}
    </NeonFrame>
  );
}

export function IconPlay({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan }) => (
        <path d="M8 5.14v13.72L19.12 12 8 5.14z" fill={`url(#${cyan})`} />
      )}
    </NeonFrame>
  );
}

export function IconCopy({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <rect x="9" y="9" width="11" height="11" rx="2" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <path d="M5 15V5a2 2 0 012-2h10" stroke={`url(#${magenta})`} strokeWidth={1.75} />
        </>
      )}
    </NeonFrame>
  );
}

export function IconCheck({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan }) => (
        <path d="M5 12l5 5L20 7" stroke={`url(#${cyan})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </NeonFrame>
  );
}

export function IconBookmark({ className, size = 16, filled = false }: LuminousIconProps & { filled?: boolean }) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan }) => (
        <path
          d="M6 4h12a1 1 0 011 1v16l-7-3.5L5 21V5a1 1 0 011-1z"
          fill={filled ? `url(#${cyan})` : 'none'}
          stroke={`url(#${cyan})`}
          strokeWidth={1.75}
        />
      )}
    </NeonFrame>
  );
}

export function IconMore({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <circle cx="6" cy="12" r="1.5" fill={`url(#${cyan})`} />
          <circle cx="12" cy="12" r="1.5" fill={`url(#${magenta})`} />
          <circle cx="18" cy="12" r="1.5" fill={`url(#${cyan})`} />
        </>
      )}
    </NeonFrame>
  );
}

export function IconSwap({ className, size = 18 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <path d="M7 8h13M16 4l4 4-4 4" stroke={`url(#${cyan})`} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 16H4M8 12l-4 4 4 4" stroke={`url(#${magenta})`} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </NeonFrame>
  );
}

export function IconSpeaker({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <path d="M4 10v4h4l5 4V6l-5 4H4z" stroke={`url(#${cyan})`} strokeWidth={1.75} strokeLinejoin="round" />
          <path d="M16.5 8.5a4.5 4.5 0 010 7" stroke={`url(#${magenta})`} strokeWidth={1.75} strokeLinecap="round" />
        </>
      )}
    </NeonFrame>
  );
}

export function IconStar({ className, size = 16, filled = false }: LuminousIconProps & { filled?: boolean }) {
  return (
    <NeonFrame className={className} size={size}>
      {({ magenta }) => (
        <path
          d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8 6.7 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z"
          fill={filled ? `url(#${magenta})` : 'none'}
          stroke={`url(#${magenta})`}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}
    </NeonFrame>
  );
}

export function IconUser({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan }) => (
        <>
          <circle cx="12" cy="8" r="3.2" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <path d="M5 19c1.4-3.2 3.8-5 7-5s5.6 1.8 7 5" stroke={`url(#${cyan})`} strokeWidth={1.75} strokeLinecap="round" />
        </>
      )}
    </NeonFrame>
  );
}

export function IconPhoto({ className, size = 32 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <rect x="3" y="5" width="18" height="14" rx="3" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <circle cx="8.5" cy="10" r="1.6" fill={`url(#${magenta})`} />
          <path d="M21 16l-5-5-8 8" stroke={`url(#${magenta})`} strokeWidth={1.75} strokeLinejoin="round" />
        </>
      )}
    </NeonFrame>
  );
}

export function IconFile({ className, size = 32 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <path d="M6 4a2 2 0 012-2h7l5 5v13a2 2 0 01-2 2H8a2 2 0 01-2-2V4z" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <path d="M15 2v5h5" stroke={`url(#${magenta})`} strokeWidth={1.75} />
        </>
      )}
    </NeonFrame>
  );
}

export function IconClipboard({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <rect x="6" y="5" width="12" height="16" rx="2" stroke={`url(#${cyan})`} strokeWidth={1.75} />
          <path d="M9 5V4a2 2 0 012-2h2a2 2 0 012 2v1" stroke={`url(#${magenta})`} strokeWidth={1.75} />
        </>
      )}
    </NeonFrame>
  );
}

export function IconDownload({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <path d="M12 4v11m0 0l-4-4m4 4l4-4" stroke={`url(#${cyan})`} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19h14" stroke={`url(#${magenta})`} strokeWidth={1.75} strokeLinecap="round" />
        </>
      )}
    </NeonFrame>
  );
}

export function IconSparkles({ className, size = 16 }: LuminousIconProps) {
  return (
    <NeonFrame className={className} size={size}>
      {({ cyan, magenta }) => (
        <>
          <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4L12 2z" stroke={`url(#${cyan})`} strokeWidth={1.5} />
          <path d="M19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" stroke={`url(#${magenta})`} strokeWidth={1.25} />
        </>
      )}
    </NeonFrame>
  );
}

