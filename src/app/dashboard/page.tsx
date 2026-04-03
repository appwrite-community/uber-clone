'use client';

import { useAuth } from '@/components/AuthProvider';
import RiderDashboard from '@/components/RiderDashboard';
import DriverDashboard from '@/components/DriverDashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-950">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-zinc-800/60 bg-zinc-950/90 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-amber-400"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {profile.name}
            </p>
            <p className="text-xs capitalize text-zinc-500">{profile.role}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await logout();
            router.push('/login');
          }}
          className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          Log out
        </button>
      </header>

      {/* Dashboard content */}
      {profile.role === 'rider' ? <RiderDashboard /> : <DriverDashboard />}
    </div>
  );
}
