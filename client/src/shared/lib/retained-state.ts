'use client';

import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

const retained = new Map<string, unknown>();

/**
 * `useState`, который переживает размонтирование: значение держится
 * до перезагрузки страницы. Один ключ — одно значение одного типа.
 */
export function useRetainedState<T>(
  key: string,
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() =>
    retained.has(key) ? (retained.get(key) as T) : initial
  );

  useEffect(() => {
    retained.set(key, value);
  }, [key, value]);

  return [value, setValue];
}
