'use client';

import type { Ride } from '@/lib/types';

interface RideSummaryProps {
  ride: Ride;
  onDone: () => void;
}

export default function RideSummary({ ride, onDone }: RideSummaryProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center backdrop-blur-sm">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-emerald-400"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <h3 className="mb-1 text-xl font-bold text-zinc-100">
          {ride.status === 'completed' ? 'Ride Completed' : 'Ride Cancelled'}
        </h3>
        <p className="mb-6 text-sm text-zinc-500">
          {ride.status === 'completed'
            ? 'You have reached your destination.'
            : 'This ride was cancelled.'}
        </p>

        <div className="mb-6 space-y-3 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Pickup</p>
              <p className="text-sm text-zinc-300">{ride.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20">
              <div className="h-2 w-2 rounded-full bg-red-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Drop-off</p>
              <p className="text-sm text-zinc-300">{ride.dropAddress}</p>
            </div>
          </div>
        </div>

        <button
          onClick={onDone}
          className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-zinc-900 hover:bg-amber-400 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
