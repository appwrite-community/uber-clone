'use client';

import { useState } from 'react';
import { useDevMode } from './DevModeProvider';

const PRESET_LOCATIONS: { name: string; coords: [number, number] }[] = [
  { name: 'Times Square', coords: [40.758, -73.9855] },
  { name: 'Central Park', coords: [40.7829, -73.9654] },
  { name: 'Brooklyn Bridge', coords: [40.7061, -73.9969] },
  { name: 'Empire State', coords: [40.7484, -73.9857] },
  { name: 'JFK Airport', coords: [40.6413, -73.7781] },
  { name: 'Grand Central', coords: [40.7527, -73.9772] },
];

export default function DevModeModal() {
  const { devMode, toggleDevMode, mockLocation, setMockLocation } =
    useDevMode();
  const [open, setOpen] = useState(false);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-[9999] flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
          devMode
            ? 'bg-amber-500 text-zinc-900 shadow-amber-500/30'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
        }`}
        title="Dev Mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M12 20h9" />
          <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">
                Dev Mode
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Toggle */}
            <div className="mb-5 flex items-center justify-between rounded-xl bg-zinc-800/60 p-4">
              <span className="text-sm text-zinc-300">
                Override Geolocation
              </span>
              <button
                onClick={toggleDevMode}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  devMode ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    devMode ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {devMode && (
              <>
                {/* Current mock location */}
                {mockLocation && (
                  <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                    <p className="text-xs text-amber-400">
                      Mock location: {mockLocation[0].toFixed(4)},{' '}
                      {mockLocation[1].toFixed(4)}
                    </p>
                  </div>
                )}

                {/* Preset locations */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Preset Locations
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_LOCATIONS.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => {
                          setMockLocation(loc.coords);
                        }}
                        className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          mockLocation &&
                          mockLocation[0] === loc.coords[0] &&
                          mockLocation[1] === loc.coords[1]
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-200 border border-transparent'
                        }`}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom coordinates */}
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Custom Coordinates
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const lat = parseFloat(customLat);
                        const lng = parseFloat(customLng);
                        if (!isNaN(lat) && !isNaN(lng)) {
                          setMockLocation([lat, lng]);
                        }
                      }}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-amber-400 transition-colors"
                    >
                      Set
                    </button>
                  </div>
                </div>

                {/* Clear */}
                {mockLocation && (
                  <button
                    onClick={() => setMockLocation(null)}
                    className="mt-4 w-full rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                  >
                    Clear Mock Location
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
