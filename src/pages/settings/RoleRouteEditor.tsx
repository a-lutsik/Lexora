// ============================================================
// LEXORA — RoleRouteEditor (Settings → AI-модели → Расширенные)
// Main + fallback model of one role. Providers may be mixed here;
// unknown model ids go through «Другая модель…».
// ============================================================

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Select, type SelectOption } from '../../components/ui/Select';
import { useSetRoleRoute } from '../../hooks/useModelRoutes';
import {
  ROLE_ENGINES,
  ROLE_HINTS,
  ROLE_LABELS,
  TIER_LABELS,
  modelsForRole,
  parseTargetKey,
  providerLabel,
  statusNote,
  targetKey,
  targetLabel,
} from '../../lib/modelRouting';
import { formatIpcError } from '../../lib/utils';
import type { AppSettings, ModelSpec, RoleStatus, RouteTarget } from '../../lib/types';

type RoleRouteEditorProps = {
  status: RoleStatus;
  catalog: ModelSpec[];
  onSaved: (settings: AppSettings) => void;
};

/** Select value of an empty slot. */
const NONE = '';
const OTHER = '__other__';

type SlotDraft = {
  choice: string;
  provider: string;
  model: string;
};

function slotFrom(target: RouteTarget | undefined): SlotDraft {
  if (!target) return { choice: NONE, provider: '', model: '' };
  return { choice: targetKey(target), provider: target.provider, model: target.model };
}

function slotTarget(slot: SlotDraft): RouteTarget | null {
  if (slot.choice === NONE) return null;
  if (slot.choice === OTHER) {
    const provider = slot.provider.trim();
    const model = slot.model.trim();
    return provider && model ? { provider, model } : null;
  }
  return parseTargetKey(slot.choice);
}

function chainKeyOf(chain: RouteTarget[]): string {
  return chain.map(targetKey).join('|');
}

function modelOptions(catalog: ModelSpec[], status: RoleStatus): SelectOption[] {
  const options: SelectOption[] = modelsForRole(catalog, status.role).map((m) => ({
    value: targetKey({ provider: m.provider, model: m.id }),
    label: `${providerLabel(m.provider)} · ${m.label}`,
    badge: statusNote(m.status) ?? TIER_LABELS[m.tier],
  }));
  // Saved custom ids stay visible even though the catalog does not know them.
  for (const target of status.chain) {
    const key = targetKey(target);
    if (!options.some((o) => o.value === key)) {
      options.push({ value: key, label: targetLabel(catalog, target), badge: 'Своя' });
    }
  }
  return options;
}

export function RoleRouteEditor({ status, catalog, onSaved }: RoleRouteEditorProps) {
  const setRoute = useSetRoleRoute();
  const savedKey = chainKeyOf(status.chain);
  const [primary, setPrimary] = useState<SlotDraft>(() => slotFrom(status.chain[0]));
  const [fallback, setFallback] = useState<SlotDraft>(() => slotFrom(status.chain[1]));
  const [syncedKey, setSyncedKey] = useState(savedKey);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // A package applied elsewhere replaced the chain — drop the stale drafts.
  if (syncedKey !== savedKey) {
    setSyncedKey(savedKey);
    setPrimary(slotFrom(status.chain[0]));
    setFallback(slotFrom(status.chain[1]));
  }

  const roleLabel = ROLE_LABELS[status.role];
  const idBase = `ai-route-${status.role}`;
  const options = modelOptions(catalog, status);
  const engineOptions: SelectOption[] = ROLE_ENGINES[status.role].map((p) => ({
    value: p,
    label: providerLabel(p),
  }));

  const draft: RouteTarget[] = [];
  for (const target of [slotTarget(primary), slotTarget(fallback)]) {
    if (target && !draft.some((t) => targetKey(t) === targetKey(target))) {
      draft.push(target);
    }
  }
  const incomplete =
    (primary.choice === OTHER && slotTarget(primary) === null) ||
    (fallback.choice === OTHER && slotTarget(fallback) === null);
  const dirty = chainKeyOf(draft) !== savedKey;

  const save = async () => {
    setError(null);
    setJustSaved(false);
    try {
      const setup = await setRoute.mutateAsync({ role: status.role, targets: draft });
      onSaved(setup.settings);
      setJustSaved(true);
    } catch (err) {
      setError(formatIpcError(err, 'Не удалось сохранить модель'));
    }
  };

  const renderSlot = (
    name: 'primary' | 'fallback',
    label: string,
    noneLabel: string,
    slot: SlotDraft,
    setSlot: (slot: SlotDraft) => void,
  ) => {
    const slotOptions: SelectOption[] = [
      { value: NONE, label: noneLabel },
      ...options,
      { value: OTHER, label: 'Другая модель…' },
    ];
    const choose = (value: string) => {
      setJustSaved(false);
      if (value === OTHER) {
        const current = parseTargetKey(slot.choice);
        setSlot({
          choice: OTHER,
          provider: current?.provider ?? engineOptions[0]?.value ?? '',
          model: current?.model ?? '',
        });
        return;
      }
      setSlot({ choice: value, provider: '', model: '' });
    };
    return (
      <div className="ai-route-slot">
        <span className="ai-route-slot-label" id={`${idBase}-${name}`}>
          {label}
        </span>
        <Select
          options={slotOptions}
          value={slot.choice}
          onChange={choose}
          ariaLabel={`${label} модель: ${roleLabel}`}
        />
        {slot.choice === OTHER && (
          <div className="ai-route-other">
            <Select
              options={engineOptions}
              value={slot.provider}
              onChange={(provider) => setSlot({ ...slot, provider })}
              ariaLabel={`Провайдер (${label.toLowerCase()}): ${roleLabel}`}
            />
            <input
              type="text"
              className="settings-input settings-input--mono"
              value={slot.model}
              placeholder="ID модели, например qwen3:8b"
              autoComplete="off"
              spellCheck={false}
              aria-label={`ID модели (${label.toLowerCase()}): ${roleLabel}`}
              onChange={(e) => {
                setJustSaved(false);
                setSlot({ ...slot, model: e.target.value });
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ai-route" role="group" aria-labelledby={`${idBase}-title`}>
      <div className="ai-route-head">
        <span id={`${idBase}-title`} className="ai-route-title">
          {roleLabel}
        </span>
        <span className="ai-route-hint">{ROLE_HINTS[status.role]}</span>
      </div>
      <div className="ai-route-slots">
        {renderSlot('primary', 'Основная', '— выключено —', primary, setPrimary)}
        {renderSlot('fallback', 'Запасная', '— нет —', fallback, setFallback)}
      </div>
      <div className="ai-route-actions">
        <Button
          size="sm"
          variant="secondary"
          onClick={save}
          disabled={!dirty || incomplete}
          isLoading={setRoute.isPending}
          aria-label={`Сохранить модель: ${roleLabel}`}
        >
          Сохранить
        </Button>
        {justSaved && !dirty && (
          <span className="ai-route-saved" role="status">
            ✓ Сохранено
          </span>
        )}
      </div>
      {error && (
        <p className="ai-route-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
