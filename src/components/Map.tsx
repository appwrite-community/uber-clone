'use client';

import dynamic from 'next/dynamic';
import type { MapMarker } from './MapInner';

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900/50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <span className="text-sm text-zinc-500">Loading map...</span>
      </div>
    </div>
  ),
});

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  onClick?: (latlng: [number, number]) => void;
  className?: string;
}

export default function Map({
  center,
  zoom,
  markers,
  onClick,
  className,
}: MapProps) {
  return (
    <MapInner
      center={center}
      zoom={zoom}
      markers={markers}
      onClick={onClick}
      className={className}
    />
  );
}
