// ============================================================
// LEXORA — Button Component
// ============================================================

import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: React.ReactNode;
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  onClick?:  React.MouseEventHandler<HTMLButtonElement>;
  type?:     'button' | 'submit' | 'reset';
  'aria-label'?: string;
};

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  isLoading = false,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size}${isLoading ? ' btn--loading' : ''}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={isLoading}
    >
      {isLoading && (
        <span className="btn-spinner animate-spin" aria-hidden="true" />
      )}
      <span className="btn-content">{children}</span>
    </button>
  );
}

// Icon-only button variant
type IconButtonProps = {
  icon: React.ReactNode;
  'aria-label': string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: 'ghost' | 'secondary';
  size?: 'sm' | 'md';
  disabled?: boolean;
};

export function IconButton({
  icon,
  'aria-label': ariaLabel,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn--icon btn--${variant} btn--${size}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
}
