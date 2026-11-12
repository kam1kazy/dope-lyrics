import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import {
  LINE_MARKS_FRAME,
  LINE_MARKS_FRAME_VERSION,
} from '~/modules/ai/line-marks/frame';
import {
  applyLineMarksAnswer,
  buildLineMarksUser,
  type LineMarkInput,
  validateMarks,
} from '~/modules/ai/line-marks/request';
import { callModel } from '~/modules/ai/model/model-call';
import { isAiConfigured } from '~/modules/ai/model/polza.client';
import { getCurrentPrompt } from '~/modules/ai/prompt/ai-prompt.service';

export type ReviseMarkedLinesInput = {
  aiText: string;
  marks: readonly LineMarkInput[];
  theme?: string | null;
};

/** «Внести правки»: модель переписывает только красные строки показанного ответа. */
export const reviseMarkedLines = async (
  userId: number,
  input: ReviseMarkedLinesInput
) => {
  if (!isAiConfigured()) {
    throw new GraphQLError('ИИ не настроен');
  }

  const marks = validateMarks(input.aiText, input.marks);
  const prompt = await getCurrentPrompt(userId);
  const { value: aiText, usageId } = await callModel(
    {
      userId,
      kind: 'LINE_MARKS',
      frameVersion: LINE_MARKS_FRAME_VERSION,
      promptId: prompt?.id ?? null,
      system: LINE_MARKS_FRAME,
      user: buildLineMarksUser({
        theme: input.theme?.trim() || null,
        authorPrompt: prompt?.text ?? '',
        aiText: input.aiText,
        marks,
      }),
      maxTokens: env.AI_MAX_TOKENS,
    },
    (text) => applyLineMarksAnswer(text, input.aiText, marks)
  );

  return { aiText, usageId };
};
