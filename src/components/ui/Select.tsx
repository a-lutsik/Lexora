// ============================================================
// LEXORA — Custom Select Component
// Instant single-click activation, accessible keyboard controls,
// glassmorphism styling, and seamless options rendering.
// Trigger is a WAI-ARIA select-only combobox; focus stays on it while
// the list is open, so it carries aria-activedescendant for the list.
// ============================================================

import { useState, useRef, useEffect, useId } from 'react';
import './Select.css';

export type SelectOption = {
  value: string;
  label: string;
  badge?: string;
  icon?: string;
  disabled?: boolean;
};

type SelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  id?: string;
  /** Override label on the closed trigger only (selected value unchanged). */
  displayLabel?: string;
};

// By index: option values are arbitrary strings and may contain spaces, which ids cannot.
function optionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${index}`;
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option…',
  disabled = false,
  ariaLabel,
  className = '',
  id,
  displayLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;

  const selectedOption = options.find((opt) => opt.value === value);
  const activeDescendantId =
    isOpen && options[highlightedIndex] ? optionId(listboxId, highlightedIndex) : undefined;

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keep highlighted option scrolled into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('.custom-select-option');
      const item = items[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev + 1 < options.length ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(options.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : options.length - 1));
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && options[highlightedIndex]) {
        handleSelect(options[highlightedIndex].value);
      } else {
        setIsOpen((prev) => !prev);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${isOpen ? 'is-open' : ''} ${className}`}
    >
      <button
        type="button"
        id={selectId}
        role="combobox"
        className="custom-select-trigger"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={activeDescendantId}
        aria-label={ariaLabel}
      >
        <span className="custom-select-value">
          {selectedOption ? (
            <>
              <span>{displayLabel ?? selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="custom-select-badge">{selectedOption.badge}</span>
              )}
            </>
          ) : (
            <span className="custom-select-placeholder">{placeholder}</span>
          )}
        </span>
        <span className="custom-select-chevron">
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && (
        <ul
          ref={dropdownRef}
          id={listboxId}
          className="custom-select-dropdown"
          role="listbox"
          // Not aria-labelledby the combobox: Chromium would name the list after its value.
          aria-label={ariaLabel}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <li
                key={option.value}
                id={optionId(listboxId, index)}
                className={`custom-select-option ${isSelected ? 'is-selected' : ''} ${
                  isHighlighted ? 'is-highlighted' : ''
                }`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="custom-select-option-label">
                  <span>{option.label}</span>
                  {option.badge && (
                    <span className="custom-select-badge">{option.badge}</span>
                  )}
                </div>
                {isSelected && (
                  <span className="custom-select-check">
                    <CheckIcon />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
