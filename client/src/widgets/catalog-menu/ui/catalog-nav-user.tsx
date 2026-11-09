'use client';

import { useQuery } from '@apollo/client/react';
import { EllipsisVertical, LogOut, UserRound } from 'lucide-react';

import {
  type IProfile,
  PROFILE,
  USER_ROLE_LABELS,
} from '@/features/user-profile';
import { cn } from '@/shared/lib/utils/cn';
import { Avatar, AvatarFallback } from '@/shared/ui/shadcn/ui/avatar';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/ui/dropdown-menu';

type ProfileData = { profile: IProfile };

function UserIdentity({ profile }: { profile: IProfile | undefined }) {
  const name = profile?.username ?? '…';

  return (
    <>
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg text-xs">
          {name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="grid min-w-0 flex-1 text-left leading-tight">
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="text-muted-foreground truncate text-xs">
          {profile ? USER_ROLE_LABELS[profile.role] : ''}
        </span>
      </span>
    </>
  );
}

export function CatalogNavUser({
  active,
  loggingOut,
  onOpenProfile,
  onLogout,
}: {
  active: boolean;
  loggingOut: boolean;
  onOpenProfile: () => void;
  onLogout: () => void;
}) {
  const { data } = useQuery<ProfileData>(PROFILE);
  const profile = data?.profile;

  return (
    <div
      className={cn(
        'hover:bg-accent mt-auto flex items-center gap-1 rounded-md',
        active && 'bg-secondary'
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Профиль"
        aria-pressed={active}
        onClick={onOpenProfile}
      >
        <UserIdentity profile={profile} />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Меню профиля"
          >
            <EllipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="end"
          sideOffset={8}
          className="w-56 rounded-lg"
        >
          <DropdownMenuLabel className="flex items-center gap-2 font-normal">
            <UserIdentity profile={profile} />
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onOpenProfile}>
            <UserRound />
            Профиль
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={loggingOut} onSelect={onLogout}>
            <LogOut />
            {loggingOut ? 'Выходим…' : 'Выйти'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
