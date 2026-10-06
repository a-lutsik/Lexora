// ============================================================
// LEXORA — Searchable Language Select
// Combobox for long language lists (filter by name/native/code).
// Trigger is a WAI-ARIA select-only combobox; while open, focus is in
// the search field, which carries aria-activedescendant for the list.
// ============================================================

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { getLanguageEntry } from '../../lib/languages';
import type { SelectOption } from './Select';
import './Select.css';
import './LanguageSelect.css';

type LanguageSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  id?: string;
  /** Extra option prepended (e.g. Auto-Detect). */
  leadingOptions?: SelectOption[];
  /** Short trigger label (Auto / English) for tight layouts like the popup. */
  compact?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function triggerLabel(option: SelectOption | undefined, compact: boolean, placeholder: string): string {
  if (!option) return placeholder;
  if (!compact) return option.label;
  if (option.value === 'auto') return 'Auto';
  return getLanguageEntry(option.value)?.name ?? option.label;
}

function optionId(listboxId: string, value: string): string {
  return `${listboxId}-${value}`;
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

export function LanguageSelect({
  options,
  value,
  onChange,
  placeholder = 'Select language…',
  disabled = false,
  ariaLabel,
  className = '',
  id,
  leadingOptions = [],
  compact = false,
  onOpenChange,
}: LanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const setOpen = (next: boolean) => {
    setIsOpen(next);
    onOpenChangeRef.current?.(next);
  };

  const allOptions = useMemo(
    () => [...leadingOptions, ...options],
    [leadingOptions, options],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((opt) => {
      const hay = `${opt.label} ${opt.value}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allOptions, query]);

  const selectedOption = allOptions.find((opt) => opt.value === value);
  const highlightedOption = isOpen ? filtered[highlightedIndex] : undefined;
  const activeDescendantId = highlightedOption
    ? optionId(listboxId, highlightedOption.value)
    : undefined;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('.custom-select-option');
      const item = items[highlightedIndex];
      if (item && typeof item.scrollIntoView === 'function') {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  const open = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    const idx = filtered.findIndex((o) => o.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Focus sits in the search field while open; hand it back to the combobox
  // instead of letting it drop to <body> when the popup unmounts.
  const closeToTrigger = () => {
    setOpen(false);
    setQuery('');
    triggerRef.current?.focus();
  };

  const handleSelect = (val: string) => {
    onChange(val);
    closeToTrigger();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        open();
      } else {
        setHighlightedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        open();
      } else {
        setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filtered[highlightedIndex]) {
        handleSelect(filtered[highlightedIndex].value);
      } else {
        open();
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        closeToTrigger();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container language-select ${compact ? 'language-select--compact' : ''} ${isOpen ? 'is-open' : ''} ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        role="combobox"
        className="custom-select-trigger"
        onClick={() => (isOpen ? closeToTrigger() : open())}
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
            <span>{triggerLabel(selectedOption, compact, placeholder)}</span>
          ) : (
            <span className="custom-select-placeholder">{placeholder}</span>
          )}
        </span>
        <span className="custom-select-chevron">
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && (
        <div className="language-select-dropdown">
          <input
            ref={inputRef}
            type="search"
            className="language-select-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search languages…"
            aria-label="Search languages"
            aria-controls={listboxId}
            aria-activedescendant={activeDescendantId}
            autoComplete="off"
          />
          <ul
            ref={listRef}
            id={listboxId}
            className="language-select-list"
            role="listbox"
            // Not aria-labelledby the combobox: Chromium would name the list after its value.
            aria-label={ariaLabel}
          >
            {filtered.length === 0 ? (
              <li className="custom-select-option is-disabled" role="presentation">
                No languages match
              </li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;
                return (
                  <li
                    key={option.value}
                    id={optionId(listboxId, option.value)}
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
                      <span className="language-select-code">{option.value}</span>
                    </div>
                    {isSelected && (
                      <span className="custom-select-check">
                        <CheckIcon />
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
