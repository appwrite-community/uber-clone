'use client';

import { useState, useCallback } from 'react';
import Map from './Map';
import { reverseGeocode } from '@/lib/geo';

interface RideRequestFormProps {
  userLocation: [number, number]; // Leaflet [lat, lng]
  onSubmit: (data: {
    pickupLatLng: [number, number];
    dropLatLng: [number, number];
    pickupAddress: string;
    dropAddress: string;
  }) => void;
  onCancel: () => void;
}

export default function RideRequestForm({
  userLocation,
  onSubmit,
  onCancel,
}: RideRequestFormProps) {
  const [step, setStep] = useState<'pickup' | 'drop'>('pickup');
  const [pickupLatLng, setPickupLatLng] = useState<[number, number] | null>(
    null
  );
  const [dropLatLng, setDropLatLng] = useState<[number, number] | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMapClick = useCallback(
    async (latlng: [number, number]) => {
      const address = await reverseGeocode(latlng[0], latlng[1]);
      if (step === 'pickup') {
        setPickupLatLng(latlng);
        setPickupAddress(address);
      } else {
        setDropLatLng(latlng);
        setDropAddress(address);
      }
    },
    [step]
  );

  const handleSubmit = async () => {
    if (!pickupLatLng || !dropLatLng) return;
    setLoading(true);
    onSubmit({
      pickupLatLng,
      dropLatLng,
      pickupAddress,
      dropAddress,
    });
  };

  const markers = [];
  if (pickupLatLng) {
    markers.push({
      position: pickupLatLng,
      label: 'Pickup',
      type: 'pickup' as const,
    });
  }
  if (dropLatLng) {
    markers.push({
      position: dropLatLng,
      label: 'Drop-off',
      type: 'drop' as const,
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Step indicator */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step === 'pickup'
                ? 'bg-amber-500 text-zinc-900'
                : pickupLatLng
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {pickupLatLng && step !== 'pickup' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
            ) : (
              '1'
            )}
          </div>
          <span
            className={`text-sm ${step === 'pickup' ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}
          >
            Pickup
          </span>
        </div>
        <div className="h-px flex-1 bg-zinc-800" />
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step === 'drop'
                ? 'bg-amber-500 text-zinc-900'
                : dropLatLng
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {dropLatLng && step !== 'drop' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
            ) : (
              '2'
            )}
          </div>
          <span
            className={`text-sm ${step === 'drop' ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}
          >
            Drop-off
          </span>
        </div>
      </div>

      {/* Instruction */}
      <div className="px-5 py-3 bg-zinc-800/30">
        <p className="text-sm text-zinc-400">
          {step === 'pickup'
            ? 'Tap on the map to set your pickup point'
            : 'Tap on the map to set your drop-off point'}
        </p>
        {step === 'pickup' && pickupAddress && (
          <p className="mt-1 text-xs text-amber-400 truncate">
            {pickupAddress}
          </p>
        )}
        {step === 'drop' && dropAddress && (
          <p className="mt-1 text-xs text-amber-400 truncate">
            {dropAddress}
          </p>
        )}
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-[300px]">
        <Map
          center={
            step === 'drop' && pickupLatLng ? pickupLatLng : userLocation
          }
          zoom={15}
          markers={markers}
          onClick={handleMapClick}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 p-5 border-t border-zinc-800/60">
        {step === 'pickup' && (
          <>
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => pickupLatLng && setStep('drop')}
              disabled={!pickupLatLng}
              className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-zinc-900 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </>
        )}
        {step === 'drop' && (
          <>
            <button
              onClick={() => setStep('pickup')}
              className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!dropLatLng || loading}
              className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-zinc-900 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Requesting...' : 'Request Ride'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
