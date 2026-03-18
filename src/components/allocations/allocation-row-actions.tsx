'use client';

import { useTransition } from 'react';
import {
  cancelAllocationAction,
  markAllocationSoldAction,
} from '@/actions/allocations';

type Props = {
  allocationId: number;
  status: string;
};

export default function AllocationRowActions({ allocationId, status }: Props) {
  const [isPending, startTransition] = useTransition();

  if (status !== 'ACTIVE') return null;

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <button
        className="button secondary"
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await markAllocationSoldAction(allocationId);
          });
        }}
      >
        Mark Sold
      </button>

      <button
        className="button secondary"
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await cancelAllocationAction(allocationId);
          });
        }}
      >
        Cancel
      </button>
    </div>
  );
}