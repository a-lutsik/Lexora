// ============================================================
// LEXORA — Translation Hub Custom Vector Icons
// Offers two design styles:
// - 'line': Minimalist outline (matches sidebar navigation)
// - 'dualtone': Luminous Dual-Tone Glass (VisionOS / Raycast Pro style)
// ============================================================

type IconProps = {
  className?: string;
  size?: number;
  variant?: 'line' | 'dualtone';
};

/**
 * 1. Text Translation Icon
 */
export function IconTabText({ className = 'translate-tab-icon', size = 18, variant = 'dualtone' }: IconProps) {
  if (variant === 'dualtone') {
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
          <linearGradient id="txt-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="txt-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {/* T character */}
        <path d="M3 5h8M7 5v10M5 15h4" stroke="url(#txt-cyan)" strokeWidth={2} strokeLinecap="round" />
        {/* Transfer Spark */}
        <path d="M11 10l2-2 2 2" stroke="#38bdf8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* A character */}
        <path d="M14 18l3-8 3 8M15 15h4" stroke="url(#txt-purple)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4.5h8M7 4.5v11M5 15.5h4" />
      <path d="M12.5 9.5h4.5M11.5 15.5l3.2-6.5 3.3 6.5M12.8 13.5h3.9" />
    </svg>
  );
}

/**
 * 2. Image & Photo OCR Icon
 */
export function IconTabImage({ className = 'translate-tab-icon', size = 18, variant = 'dualtone' }: IconProps) {
  if (variant === 'dualtone') {
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
          <linearGradient id="img-laser" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Camera/Lens Frame */}
        <rect x="3" y="4" width="18" height="16" rx="4" stroke="currentColor" strokeWidth={1.5} opacity="0.6" />
        {/* Aperture Center */}
        <circle cx="12" cy="12" r="4" stroke="#818cf8" strokeWidth={1.75} />
        <circle cx="12" cy="12" r="1.5" fill="#38bdf8" />
        {/* Laser Scan Beam */}
        <line x1="1" y1="12" x2="23" y2="12" stroke="url(#img-laser)" strokeWidth={2} strokeLinecap="round" />
        {/* Corner OCR Brackets */}
        <path d="M6 7H5v1M18 7h1v1M6 17H5v-1M18 17h1v-1" stroke="#38bdf8" strokeWidth={2} strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="3" width="15" height="14" rx="3" />
      <circle cx="7" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M17.5 13.5l-4-4-6.5 6.5" />
      <path d="M11 11.5l2-2 4.5 4" />
    </svg>
  );
}

/**
 * 3. Document Translation Icon
 */
export function IconTabDocument({ className = 'translate-tab-icon', size = 18, variant = 'dualtone' }: IconProps) {
  if (variant === 'dualtone') {
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
          <linearGradient id="doc-lines" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        {/* Document Silhouette */}
        <path
          d="M5 4a2 2 0 012-2h8l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V4z"
          stroke="currentColor"
          strokeWidth={1.5}
          opacity="0.7"
        />
        {/* Folded Corner with neon fill */}
        <path d="M15 2v5h5" stroke="#818cf8" strokeWidth={1.5} />
        {/* Translated Glowing Lines */}
        <line x1="8" y1="10" x2="16" y2="10" stroke="url(#doc-lines)" strokeWidth={2} strokeLinecap="round" />
        <line x1="8" y1="13" x2="14" y2="13" stroke="url(#doc-lines)" strokeWidth={2} strokeLinecap="round" />
        <line x1="8" y1="16" x2="16" y2="16" stroke="url(#doc-lines)" strokeWidth={2} strokeLinecap="round" />
        <line x1="8" y1="19" x2="12" y2="19" stroke="url(#doc-lines)" strokeWidth={2} strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 3.5C4 2.67 4.67 2 5.5 2H11.5L16 6.5V16.5C16 17.33 15.33 18 14.5 18H5.5C4.67 18 4 17.33 4 16.5V3.5Z" />
      <path d="M11.5 2V6.5H16" />
      <path d="M7 9.5h6M7 12.5h6M7 15h3.5" />
    </svg>
  );
}

/**
 * 4. Speech & Live Audio Icon
 */
export function IconTabAudio({ className = 'translate-tab-icon', size = 18, variant = 'dualtone' }: IconProps) {
  if (variant === 'dualtone') {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        {/* Neon Mic */}
        <rect x="9" y="3" width="6" height="10" rx="3" stroke="#38bdf8" strokeWidth={1.75} />
        <path d="M6 10v1a6 6 0 0012 0v-1" stroke="currentColor" strokeWidth={1.5} opacity="0.8" />
        <path d="M12 17v4M9 21h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        {/* EQ Soundwave Bars */}
        <line x1="3" y1="10" x2="3" y2="12" stroke="#c084fc" strokeWidth={1.75} strokeLinecap="round" />
        <line x1="21" y1="10" x2="21" y2="12" stroke="#c084fc" strokeWidth={1.75} strokeLinecap="round" />
        <line x1="1" y1="9" x2="1" y2="13" stroke="#818cf8" strokeWidth={1.5} strokeLinecap="round" />
        <line x1="23" y1="9" x2="23" y2="13" stroke="#818cf8" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="7.5" y="2.5" width="5" height="8.5" rx="2.5" />
      <path d="M4.5 8.5v1a5.5 5.5 0 0011 0v-1" />
      <path d="M10 15v3M7 18h6" />
    </svg>
  );
}

/**
 * 5. Live Interpreter Icon (two speech bubbles + sync arrows)
 */
export function IconTabInterpreter({ className = 'translate-tab-icon', size = 18, variant = 'dualtone' }: IconProps) {
  if (variant === 'dualtone') {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 5.5A2.5 2.5 0 015.5 3h6A2.5 2.5 0 0114 5.5v3A2.5 2.5 0 0111.5 11H8l-3 2.5V11h0A2.5 2.5 0 013 8.5z" stroke="#38bdf8" strokeWidth={1.6} strokeLinejoin="round" />
        <path d="M21 15.5a2.5 2.5 0 00-2.5-2.5h-6a2.5 2.5 0 00-2.5 2.5v3a2.5 2.5 0 002.5 2.5H16l3 2.5V21h0a2.5 2.5 0 002-2.5z" stroke="#c084fc" strokeWidth={1.6} strokeLinejoin="round" />
        <path d="M17 6h2.5a1.5 1.5 0 011.5 1.5V9M7 18H4.5A1.5 1.5 0 013 16.5V15" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" opacity="0.8" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 5.5A2.5 2.5 0 015.5 3h6A2.5 2.5 0 0114 5.5v3A2.5 2.5 0 0111.5 11H8l-3 2.5V11A2.5 2.5 0 013 8.5z" />
      <path d="M21 15.5a2.5 2.5 0 00-2.5-2.5h-6a2.5 2.5 0 00-2.5 2.5v3a2.5 2.5 0 002.5 2.5H16l3 2.5V21a2.5 2.5 0 002-2.5z" />
    </svg>
  );
}

/**
 * 6. Translation History Icon
 */
export function IconTabHistory({ className = 'translate-tab-icon', size = 18, variant = 'dualtone' }: IconProps) {
  if (variant === 'dualtone') {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        {/* Clock Body */}
        <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth={1.5} opacity="0.6" />
        {/* Chronograph Crown */}
        <path d="M10 2h4M12 2v3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        {/* Neon Clock Hands */}
        <path d="M12 8.5v4.5l3 2" stroke="#c084fc" strokeWidth={1.75} strokeLinecap="round" />
        {/* Cyan Orbital Glow Ring */}
        <path
          d="M3 13a9 9 0 0115.5-6.3L20 8"
          stroke="#38bdf8"
          strokeWidth={1.75}
          strokeLinecap="round"
        />
        <path d="M20 4v4h-4" stroke="#38bdf8" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10" cy="10.5" r="7" />
      <path d="M10 6.5v4l2.5 1.5" />
      <path d="M3.5 3.5l-1 3.5 3.5.5" />
    </svg>
  );
}
