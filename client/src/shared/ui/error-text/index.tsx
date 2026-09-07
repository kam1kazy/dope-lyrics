'use client';

import { Fira_Mono } from 'next/font/google';

import { formatQueryError } from '@/shared/lib/format-query-error';

const fira = Fira_Mono({ weight: ['500'], subsets: ['latin'] });

export const ErrorText = ({
  title,
  description,
  error,
}: {
  title: string;
  description?: string;
  error?: unknown;
}) => {
  const detail =
    description ??
    (error !== undefined ? formatQueryError(error) : 'Ошибка загрузки данных');

  return (
    <div
      className={`${fira.className} m-auto flex flex-col items-center justify-center text-center text-4xl text-foreground`}
    >
      <p className="error-glitch" data-glitch={title}>
        {title}
      </p>
      <p className="mt-5 block max-w-[22rem] text-sm text-muted-foreground">
        {detail}
      </p>
    </div>
  );
};
