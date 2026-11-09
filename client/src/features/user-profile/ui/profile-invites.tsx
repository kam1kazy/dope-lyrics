'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { Copy, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  CREATE_INVITE,
  type ICreatedInvite,
  type IInvite,
  MY_INVITES,
  REVOKE_INVITE,
} from '../api/queries';

const BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '') ?? '';

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Moscow',
  });

const inviteLink = (code: string): string | null =>
  BOT_USERNAME ? `https://t.me/${BOT_USERNAME}?start=inv_${code}` : null;

type InvitesData = { myInvites: IInvite[] };
type CreateData = { createInvite: ICreatedInvite };
type RevokeData = { revokeInvite: boolean };

function CreatedInvite({ invite }: { invite: ICreatedInvite }) {
  const [copied, setCopied] = useState(false);
  const link = inviteLink(invite.code);
  const value = link ?? `/start inv_${invite.code}`;

  return (
    <div className="border-border flex flex-col gap-2 rounded-md border p-3">
      <p className="text-sm">
        {link
          ? 'Ссылка-приглашение. Отправьте её другу — она сработает один раз.'
          : 'Код приглашения. Друг отправляет боту эту команду — сработает один раз.'}
      </p>
      <div className="flex gap-2" data-swipe-ignore>
        <Input readOnly value={value} onFocus={(e) => e.target.select()} />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Скопировать"
          onClick={() => {
            void navigator.clipboard
              .writeText(value)
              .then(() => setCopied(true))
              .catch(() => setCopied(false));
          }}
        >
          <Copy className="size-4" />
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        {copied ? 'Скопировано. ' : ''}Действует до{' '}
        {formatDate(invite.expiresAt)}. Больше эту ссылку не покажем.
      </p>
    </div>
  );
}

export function ProfileInvites() {
  const [created, setCreated] = useState<ICreatedInvite | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    loading,
    error: listError,
  } = useQuery<InvitesData>(MY_INVITES, { fetchPolicy: 'network-only' });

  const [createInvite, { loading: creating }] = useMutation<CreateData>(
    CREATE_INVITE,
    { refetchQueries: [{ query: MY_INVITES }] }
  );
  const [revokeInvite, { loading: revoking }] = useMutation<RevokeData>(
    REVOKE_INVITE,
    { refetchQueries: [{ query: MY_INVITES }] }
  );

  const invites = data?.myInvites ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Приглашения</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={creating}
          onClick={() => {
            setError(null);
            void createInvite()
              .then((result) => {
                setCreated(result.data?.createInvite ?? null);
              })
              .catch(() => {
                setError('Не удалось создать приглашение');
              });
          }}
        >
          <Plus className="size-4" />
          {creating ? 'Создаю…' : 'Создать приглашение'}
        </Button>
      </div>

      {created ? <CreatedInvite invite={created} /> : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {loading && !data ? <Spinner className="size-4" /> : null}

      {listError ? (
        <p className="text-muted-foreground text-sm">
          Не удалось загрузить приглашения
        </p>
      ) : null}

      {!loading && !listError && invites.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Действующих приглашений нет
        </p>
      ) : null}

      {invites.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="border-border flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <p className="text-sm">
                Создано {formatDate(invite.createdAt)}, действует до{' '}
                {formatDate(invite.expiresAt)}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={revoking}
                onClick={() => {
                  setError(null);
                  void revokeInvite({ variables: { id: invite.id } })
                    .then((result) => {
                      if (!result.data?.revokeInvite) {
                        setError('Не удалось отозвать приглашение');
                      }
                    })
                    .catch(() => {
                      setError('Не удалось отозвать приглашение');
                    });
                }}
              >
                Отозвать
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
