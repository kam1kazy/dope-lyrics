'use client';

import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

/**
 * `useState`, значение которого лежит в localStorage и переживает перезагрузку.
 * Читает после монтирования (SSR отдаёт `initial`); `parse` проверяет сохранённое.
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
  parse: (stored: unknown) => T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(parse(JSON.parse(raw)));
      }
    } catch {
      // битое значение — остаётся initial
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- читаем один раз при монтировании
  }, [key]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
  }, [key, value, hydrated]);

  return [value, setValue];
}
