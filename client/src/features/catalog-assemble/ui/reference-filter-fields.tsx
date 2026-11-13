'use client';

import { useReferenceOptions } from '@/features/reference-shelf';
import {
  REFERENCE_FILTER_LIMIT,
  type ReferenceFilter,
} from '@/shared/lib/reference-filter';
import { MultiSelect } from '@/shared/ui/multi-select';

/** Фильтры «Артисты» / «Тексты» с полки эталонов. */
export function ReferenceFilterFields({
  value,
  hint,
  onChange,
}: {
  value: ReferenceFilter;
  hint: string;
  onChange: (next: ReferenceFilter) => void;
}) {
  const { artistGroups, textGroups } = useReferenceOptions(true);

  return (
    <div className="flex flex-col gap-2">
      <MultiSelect
        label={`Эталоны · артисты, до ${REFERENCE_FILTER_LIMIT}`}
        allLabel="Вся полка"
        emptyText="На полке нет артистов"
        groups={artistGroups}
        value={value.artistIds}
        max={REFERENCE_FILTER_LIMIT}
        onChange={(artistIds) => {
          onChange({ ...value, artistIds });
        }}
      />
      <MultiSelect
        label={`Эталоны · тексты, до ${REFERENCE_FILTER_LIMIT}`}
        allLabel="Любые тексты"
        emptyText="На полке нет текстов"
        groups={textGroups}
        value={value.textIds}
        max={REFERENCE_FILTER_LIMIT}
        onChange={(textIds) => {
          onChange({ ...value, textIds });
        }}
      />
      <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p>
    </div>
  );
}
