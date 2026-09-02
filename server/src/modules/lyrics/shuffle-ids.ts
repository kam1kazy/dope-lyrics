const GRAPHQL_INT_MAX = 2_147_483_647;

export function toShuffleSeed(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  const asInt = Math.trunc(value);
  const wrapped =
    ((asInt % GRAPHQL_INT_MAX) + GRAPHQL_INT_MAX) % GRAPHQL_INT_MAX;

  return wrapped === 0 ? 1 : wrapped;
}

export function shuffleIds(ids: number[], seed: number): number[] {
  const result = [...ids];
  let state = toShuffleSeed(seed);

  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    const current = result[index];
    const next = result[swapIndex];

    if (current === undefined || next === undefined) {
      continue;
    }

    result[index] = next;
    result[swapIndex] = current;
  }

  return result;
}
