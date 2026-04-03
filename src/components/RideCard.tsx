'use client';

import type { Ride } from '@/lib/types';

interface RideCardProps {
  ride: Ride;
  onAccept: (rideId: string) => void;
  accepting: boolean;
}

export default function RideCard({ ride, onAccept, accepting }: RideCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between">
        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400">
          New ride request
        </span>
      </div>

      <div className="mb-4 space-y-3">
        {/* Pickup */}
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Pickup
            </p>
            <p className="mt-0.5 truncate text-sm text-zinc-200">
              {ride.pickupAddress}
            </p>
          </div>
        </div>

        {/* Connector */}
        <div className="ml-2.5 h-4 border-l border-dashed border-zinc-700" />

        {/* Drop-off */}
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20">
            <div className="h-2 w-2 rounded-full bg-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Drop-off
            </p>
            <p className="mt-0.5 truncate text-sm text-zinc-200">
              {ride.dropAddress}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => onAccept(ride.$id)}
        disabled={accepting}
        className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-zinc-900 hover:bg-amber-400 disabled:opacity-50 transition-colors"
      >
        {accepting ? 'Accepting...' : 'Accept Ride'}
      </button>
    </div>
  );
}
