'use client';

import { useTransition } from 'react';
import { runAllocationExpirySweepAction } from '@/actions/allocations';

export default function AllocationSweepButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="button secondary"
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await runAllocationExpirySweepAction();
        });
      }}
    >
      {isPending ? 'Running...' : 'Run Expiry Sweep'}
    </button>
  );
}