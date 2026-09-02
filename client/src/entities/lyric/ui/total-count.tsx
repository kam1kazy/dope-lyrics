'use client';

export interface TotalCountProps {
  count: number;
}

export const TotalCount = ({ count }: TotalCountProps) => {
  return (
    <div className="mt-5 flex justify-center border-t border-border pt-3">
      {count ? <b>Всего текстов: {count}</b> : null}
    </div>
  );
};
