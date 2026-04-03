'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useDevMode } from './DevModeProvider';
import Map from './Map';
import RideRequestForm from './RideRequestForm';
import OtpDisplay from './OtpDisplay';
import RideSummary from './RideSummary';
import { getActiveRideForRider } from '@/lib/rides';
import { createRideAction, cancelRideAction, updateRideLocationAction } from '@/app/actions/rides';
import { toAppwrite, toLeaflet, isWithinRadius } from '@/lib/geo';
import { realtime, Channel } from '@/lib/appwrite';
import { DATABASE_ID, RIDES_TABLE_ID } from '@/lib/config';
import type { Ride, RideStatus } from '@/lib/types';
import type { MapMarker } from './MapInner';

type RiderState = 'idle' | 'requesting' | 'pending' | 'accepted' | 'riding' | 'completed' | 'cancelled';

function useLocation(devMode: boolean, mockLocation: [number, number] | null) {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const lastCoordsRef = useRef<string>('');

  useEffect(() => {
    if (devMode && mockLocation) {
      const key = `${mockLocation[0]},${mockLocation[1]}`;
      if (lastCoordsRef.current !== key) {
        lastCoordsRef.current = key;
        setLocation(mockLocation);
      }
      return;
    }

    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const key = `${pos.coords.latitude},${pos.coords.longitude}`;
        if (lastCoordsRef.current !== key) {
          lastCoordsRef.current = key;
          setLocation([pos.coords.latitude, pos.coords.longitude]);
        }
      },
      () => {
        setLocation([40.758, -73.9855]);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [devMode, mockLocation]);

  return location;
}

export default function RiderDashboard() {
  const { user } = useAuth();
  const { devMode, mockLocation } = useDevMode();
  const location = useLocation(devMode, mockLocation);

  const [state, setState] = useState<RiderState>('idle');
  const [ride, setRide] = useState<Ride | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const subscriptionRef = useRef<{ close: () => Promise<void> } | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationRef = useRef(location);
  locationRef.current = location;

  // Subscribe to ride updates via realtime
  const subscribeToRide = useCallback(
    async (rideId: string) => {
      // Clean up previous subscription
      await subscriptionRef.current?.close();

      const unsub = await realtime.subscribe(
        Channel.tablesdb(DATABASE_ID).table(RIDES_TABLE_ID).row(rideId),
        (response) => {
          const payload = response.payload as unknown as Ride;
          setRide(payload);
          const newStatus = payload.status as RideStatus;

          if (newStatus === 'accepted') {
            setState('accepted');
          } else if (newStatus === 'riding') {
            setState('riding');
          } else if (newStatus === 'completed') {
            setState('completed');
            stopTracking();
          } else if (newStatus === 'cancelled') {
            setState('cancelled');
            stopTracking();
          }

          // Check if driver is within 200m of pickup to show OTP
          if (
            (newStatus === 'accepted') &&
            payload.driverLocation &&
            payload.pickupLocation
          ) {
            const driverNearPickup = isWithinRadius(
              payload.driverLocation,
              payload.pickupLocation,
              300
            );
            setShowOtp(driverNearPickup);
          }
        }
      );
      subscriptionRef.current = unsub;
    },
    []
  );

  // Check for active ride on mount
  useEffect(() => {
    if (!user) return;
    getActiveRideForRider(user.$id).then((activeRide) => {
      if (activeRide) {
        setRide(activeRide);
        setState(activeRide.status as RiderState);
        subscribeToRide(activeRide.$id);
      }
    });
  }, [user, subscribeToRide]);

  // Location tracking during active ride
  const startTracking = useCallback(
    (rideId: string) => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }

      const sendLocation = () => {
        const loc = locationRef.current;
        if (loc) {
          updateRideLocationAction(rideId, 'riderLocation', toAppwrite(loc)).catch(() => {});
        }
      };

      sendLocation();
      locationIntervalRef.current = setInterval(sendLocation, 5000);
    },
    []
  );

  const stopTracking = useCallback(async () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    await subscriptionRef.current?.close();
    subscriptionRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Start tracking when ride becomes active (only on state change, not ride updates)
  const rideIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (ride && (state === 'accepted' || state === 'riding')) {
      if (rideIdRef.current !== ride.$id) {
        rideIdRef.current = ride.$id;
        startTracking(ride.$id);
      }
    } else {
      rideIdRef.current = null;
    }
  }, [state, ride?.$id, startTracking]);

  const handleRequestRide = async (data: {
    pickupLatLng: [number, number];
    dropLatLng: [number, number];
    pickupAddress: string;
    dropAddress: string;
  }) => {
    if (!user) return;

    const newRide = await createRideAction(
      user.$id,
      toAppwrite(data.pickupLatLng),
      toAppwrite(data.dropLatLng),
      data.pickupAddress,
      data.dropAddress
    );

    setRide(newRide);
    setState('pending');
    subscribeToRide(newRide.$id);
  };

  const handleCancel = async () => {
    if (!ride) return;
    await cancelRideAction(ride.$id);
    setState('cancelled');
    stopTracking();
  };

  const handleDone = () => {
    setRide(null);
    setState('idle');
    setShowOtp(false);
  };

  if (!location) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Getting your location...</p>
        </div>
      </div>
    );
  }

  // Completed or cancelled
  if (state === 'completed' || state === 'cancelled') {
    return ride ? (
      <RideSummary ride={ride} onDone={handleDone} />
    ) : null;
  }

  // Requesting ride (pickup/drop selection form)
  if (state === 'requesting') {
    return (
      <RideRequestForm
        userLocation={location}
        onSubmit={handleRequestRide}
        onCancel={() => setState('idle')}
      />
    );
  }

  // Build markers
  const markers: MapMarker[] = [
    { position: location, label: 'You', type: 'default' },
  ];
  if (ride?.pickupLocation) {
    markers.push({
      position: toLeaflet(ride.pickupLocation),
      label: 'Pickup',
      type: 'pickup',
    });
  }
  if (ride?.dropLocation) {
    markers.push({
      position: toLeaflet(ride.dropLocation),
      label: 'Drop-off',
      type: 'drop',
    });
  }
  if (ride?.driverLocation) {
    markers.push({
      position: toLeaflet(ride.driverLocation),
      label: 'Driver',
      type: 'driver',
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Map */}
      <div className="relative flex-1 min-h-[300px]">
        <Map center={location} zoom={15} markers={markers} />
      </div>

      {/* Bottom panel */}
      <div className="border-t border-zinc-800/60 bg-zinc-950/90 backdrop-blur-sm">
        {state === 'idle' && (
          <div className="p-5">
            <p className="mb-4 text-sm text-zinc-400">
              Where would you like to go?
            </p>
            <button
              onClick={() => setState('requesting')}
              className="w-full rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-zinc-900 hover:bg-amber-400 transition-colors"
            >
              Request a Ride
            </button>
          </div>
        )}

        {state === 'pending' && ride && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Looking for a driver...
                </p>
                <p className="text-xs text-zinc-500">
                  Nearby drivers will see your request
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-800/40 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-400" />
                <p className="text-xs text-zinc-400 truncate">{ride.pickupAddress}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-red-400" />
                <p className="text-xs text-zinc-400 truncate">{ride.dropAddress}</p>
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              Cancel Request
            </button>
          </div>
        )}

        {state === 'accepted' && ride && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-amber-400">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Driver is on the way
                </p>
                <p className="text-xs text-zinc-500">
                  Heading to your pickup point
                </p>
              </div>
            </div>

            {showOtp && <OtpDisplay otp={ride.otp} />}

            <button
              onClick={handleCancel}
              className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              Cancel Ride
            </button>
          </div>
        )}

        {state === 'riding' && ride && (
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Ride in progress
                </p>
                <p className="text-xs text-zinc-500">
                  Heading to your destination
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-800/40 p-4">
              <div className="flex items-start gap-2">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-red-400" />
                <p className="text-xs text-zinc-400 truncate">{ride.dropAddress}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
