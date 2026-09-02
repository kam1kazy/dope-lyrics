'use client';

import { Fira_Mono } from 'next/font/google';

const fira = Fira_Mono({ weight: ['500'], subsets: ['latin'] });

export const ErrorText = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  return (
    <div
      className={`${fira.className} m-auto flex flex-col items-center justify-center text-center text-4xl text-foreground`}
    >
      <p className="error-glitch" data-glitch={title}>
        {title}
      </p>
      <p className="mt-5 block text-sm text-muted-foreground">
        {description ? description : 'Ошибка загрузки данных'}
      </p>
    </div>
  );
};
