import { t } from '../i18n';

type CollectionLabel = { name: string; packKey?: string | null };

/** Translate built-in pack titles while keeping personal collection names intact. */
export function collectionDisplayName(collection: CollectionLabel): string {
  switch (collection.packKey) {
    case 'top_5000': return t('Top 5000 words');
    case 'phrasal_verbs': return t('Phrasal verbs');
    case 'irregular_verbs': return t('Irregular verbs');
    case 'business': return t('Business');
    case 'academic': return t('Academic');
    case 'travel': return t('Travel');
    default: return collection.name;
  }
}
