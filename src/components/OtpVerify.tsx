'use client';

import { useState } from 'react';

interface OtpVerifyProps {
  onVerify: (otp: string) => Promise<boolean>;
}

export default function OtpVerify({ onVerify }: OtpVerifyProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      setError('Enter a 6-digit OTP');
      return;
    }
    setError('');
    setVerifying(true);
    const success = await onVerify(otp);
    setVerifying(false);
    if (!success) {
      setError('Invalid OTP. Try again.');
      setOtp('');
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
      <p className="mb-1 text-sm font-medium text-zinc-200">
        Verify Rider OTP
      </p>
      <p className="mb-4 text-xs text-zinc-500">
        Ask the rider for their 6-digit code
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError('');
          }}
          placeholder="000000"
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-center text-lg font-bold tracking-[0.3em] text-zinc-100 placeholder-zinc-600 tabular-nums focus:border-amber-500 focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={verifying || otp.length < 6}
          className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-zinc-900 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {verifying ? '...' : 'Verify'}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
