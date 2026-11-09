import { env } from '~/config/env';
import type { AiUsageKind, AiUsageStatus } from '~/generated/prisma/client';
import { prisma } from '~/infrastructure/prisma';

const RECENT_LIMIT = 20;
const DAY_MS = 86_400_000;

export const estimateCostRub = (
  tokensIn: number,
  tokensOut: number
): number | null => {
  if (!env.AI_COST_RUB_PER_1M_IN && !env.AI_COST_RUB_PER_1M_OUT) {
    return null;
  }

  return (
    (tokensIn * env.AI_COST_RUB_PER_1M_IN +
      tokensOut * env.AI_COST_RUB_PER_1M_OUT) /
    1_000_000
  );
};

export type RecordUsageInput = {
  userId: number;
  kind: AiUsageKind;
  model: string;
  frameVersion: number;
  promptId: number | null;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  status: AiUsageStatus;
  error?: string;
};

export const recordUsage = (input: RecordUsageInput) =>
  prisma.aiUsage.create({
    data: {
      ...input,
      costRub:
        input.status === 'OK'
          ? estimateCostRub(input.tokensIn, input.tokensOut)
          : null,
    },
  });

export type UsagePeriodSummary = {
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costRub: number | null;
};

const summarize = async (
  userId: number,
  since: Date | null
): Promise<UsagePeriodSummary> => {
  const result = await prisma.aiUsage.aggregate({
    where: { userId, ...(since ? { createdAt: { gte: since } } : {}) },
    _count: { _all: true },
    _sum: { tokensIn: true, tokensOut: true, costRub: true },
  });
  const cost = result._sum.costRub;

  return {
    requests: result._count._all,
    tokensIn: result._sum.tokensIn ?? 0,
    tokensOut: result._sum.tokensOut ?? 0,
    costRub: cost === null ? null : Number(cost),
  };
};

export const usageSummary = async (userId: number) => {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [today, month, all] = await Promise.all([
    summarize(userId, startOfToday),
    summarize(userId, new Date(now - 30 * DAY_MS)),
    summarize(userId, null),
  ]);

  return { today, month, all };
};

export const recentUsage = (userId: number) =>
  prisma.aiUsage.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
    take: RECENT_LIMIT,
  });
