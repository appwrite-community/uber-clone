'use client';

interface OtpDisplayProps {
  otp: string;
}

export default function OtpDisplay({ otp }: OtpDisplayProps) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-400/70">
        Your ride OTP
      </p>
      <p className="mb-2 text-xs text-zinc-500">
        Share this code with your driver
      </p>
      <div className="flex justify-center gap-2">
        {otp.split('').map((digit, i) => (
          <div
            key={i}
            className="flex h-12 w-10 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-xl font-bold text-amber-400 tabular-nums"
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
}
