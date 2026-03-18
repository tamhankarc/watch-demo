'use client';

import { useTransition } from 'react';
import { toggleUserActiveAction } from '@/actions/users';

type Props = {
  userId: number;
  isActive: boolean;
};

export default function UserActiveToggle({ userId, isActive }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="button secondary"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await toggleUserActiveAction(userId);
        });
      }}
    >
      {isPending ? 'Updating...' : isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}
