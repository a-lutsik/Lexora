// ============================================================
// LEXORA — Official Brand Logo & Mark
// Concept 1: The Luminous L
// ============================================================

import './Logo.css';

type LogoProps = {
  size?: number;
  showText?: boolean;
  className?: string;
};

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/lexora_logo_master.png"
      alt="Lexora"
      width={size}
      height={size}
      className="lexora-logo-mark-img"
    />
  );
}

export function Logo({ size = 32, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`lexora-brand-logo ${className}`.trim()}>
      <LogoMark size={size} />
      {showText && <span className="lexora-brand-name">LEXORA</span>}
    </div>
  );
}

type BrandBadgeProps = {
  size?: number;
  className?: string;
};

export function BrandBadge({ size = 16, className = '' }: BrandBadgeProps) {
  return (
    <div className={`lexora-brand-badge ${className}`.trim()} data-tauri-drag-region>
      <LogoMark size={size} />
      <span className="lexora-brand-badge-name">Lexora</span>
    </div>
  );
}
