'use client';

import { useQuery } from '@apollo/client/react';

import { ErrorText } from '@/shared/ui/error-text';
import { Separator } from '@/shared/ui/shadcn/ui/separator';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { type IProfile, PROFILE, type UserRole } from '../api/queries';
import { ProfileIngest } from './profile-ingest';
import { ProfileInvites } from './profile-invites';

const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Владелец',
  ADMIN: 'Админ',
  USER: 'Пользователь',
};

type ProfileData = { profile: IProfile };

export function UserProfilePanel() {
  const { data, loading, error } = useQuery<ProfileData>(PROFILE);
  const profile = data?.profile;

  if (loading && !profile) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error || !profile) {
    return <ErrorText title="Ошибка" error={error} />;
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <section className="flex flex-col gap-1">
        <p className="text-base font-medium">{profile.username}</p>
        <p className="text-muted-foreground text-sm">
          {ROLE_LABELS[profile.role]}
        </p>
      </section>

      <Separator />
      <ProfileIngest />

      {profile.role !== 'USER' ? (
        <>
          <Separator />
          <ProfileInvites />
        </>
      ) : null}
    </div>
  );
}
