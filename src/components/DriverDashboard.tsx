'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useDevMode } from './DevModeProvider';
import Map from './Map';
import RideCard from './RideCard';
import OtpVerify from './OtpVerify';
import RideSummary from './RideSummary';
import {
  getNearbyPendingRides,
  getActiveRideForDriver,
} from '@/lib/rides';
import {
  acceptRideAction,
  verifyOtpAction,
  endRideAction,
  updateRideLocationAction,
} from '@/app/actions/rides';
import {
  updateDriverLocationAction,
  setDriverAvailabilityAction,
} from '@/app/actions/driver-locations';
import { toAppwrite, toLeaflet, isWithinRadius } from '@/lib/geo';
import { realtime, Channel } from '@/lib/appwrite';
import { DATABASE_ID, RIDES_TABLE_ID } from '@/lib/config';
import type { Ride, RideStatus } from '@/lib/types';
import type { MapMarker } from './MapInner';

type DriverState =
  | 'offline'
  | 'available'
  | 'accepted'
  | 'otp'
  | 'riding'
  | 'completed'
  | 'cancelled';

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

export default function DriverDashboard() {
  const { user } = useAuth();
  const { devMode, mockLocation } = useDevMode();
  const location = useLocation(devMode, mockLocation);

  const [state, setState] = useState<DriverState>('offline');
  const [ride, setRide] = useState<Ride | null>(null);
  const [nearbyRides, setNearbyRides] = useState<Ride[]>([]);
  const [accepting, setAccepting] = useState(false);
  const [canEndRide, setCanEndRide] = useState(false);

  const subscriptionRef = useRef<{ close: () => Promise<void> } | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationRef = useRef(location);
  locationRef.current = location;

  // Poll for nearby rides when available
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    const poll = async () => {
      const loc = locationRef.current;
      if (!loc) return;
      try {
        const rides = await getNearbyPendingRides(toAppwrite(loc), 5000);
        setNearbyRides(rides);
      } catch {
        // Silently fail
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 5000);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Subscribe to ride updates
  const subscribeToRide = useCallback(async (rideId: string) => {
    await subscriptionRef.current?.close();

    const unsub = await realtime.subscribe(
      Channel.tablesdb(DATABASE_ID).table(RIDES_TABLE_ID).row(rideId),
      (response) => {
        const payload = response.payload as unknown as Ride;
        setRide(payload);
        const newStatus = payload.status as RideStatus;

        if (newStatus === 'riding') {
          setState('riding');
        } else if (newStatus === 'completed') {
          setState('completed');
          stopLocationTracking();
        } else if (newStatus === 'cancelled') {
          setState('cancelled');
          stopLocationTracking();
        }
      }
    );
    subscriptionRef.current = unsub;
  }, []);

  // Check for active ride on mount
  useEffect(() => {
    if (!user) return;
    getActiveRideForDriver(user.$id).then((activeRide) => {
      if (activeRide) {
        setRide(activeRide);
        if (activeRide.status === 'accepted') {
          setState('accepted');
          subscribeToRide(activeRide.$id);
        } else if (activeRide.status === 'riding') {
          setState('riding');
          subscribeToRide(activeRide.$id);
        }
      }
    });
  }, [user, subscribeToRide]);

  // Location tracking during active ride
  const startLocationTracking = useCallback(
    (rideId: string) => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }

      const sendLocation = () => {
        const loc = locationRef.current;
        if (loc) {
          updateRideLocationAction(rideId, 'driverLocation', toAppwrite(loc)).catch(() => {});
        }
      };

      sendLocation();
      locationIntervalRef.current = setInterval(sendLocation, 5000);
    },
    []
  );

  const stopLocationTracking = useCallback(async () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    await subscriptionRef.current?.close();
    subscriptionRef.current = null;
  }, []);

  // Update driver location in DB when online (every 5s, not on every geo change)
  const driverLocIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!user || state === 'offline') {
      if (driverLocIntervalRef.current) {
        clearInterval(driverLocIntervalRef.current);
        driverLocIntervalRef.current = null;
      }
      return;
    }

    const update = () => {
      const loc = locationRef.current;
      if (!loc) return;
      const isAvailable = state === 'available';
      updateDriverLocationAction(user.$id, toAppwrite(loc), isAvailable).catch(() => {});
    };

    update();
    driverLocIntervalRef.current = setInterval(update, 5000);

    return () => {
      if (driverLocIntervalRef.current) {
        clearInterval(driverLocIntervalRef.current);
        driverLocIntervalRef.current = null;
      }
    };
  }, [user, state]);

  // Start/stop polling based on state
  useEffect(() => {
    if (state === 'available') {
      startPolling();
    } else {
      stopPolling();
      setNearbyRides([]);
    }
  }, [state, startPolling, stopPolling]);

  // Track location during active ride (only on state change, not ride updates)
  const trackingRideIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (ride && (state === 'accepted' || state === 'otp' || state === 'riding')) {
      if (trackingRideIdRef.current !== ride.$id) {
        trackingRideIdRef.current = ride.$id;
        startLocationTracking(ride.$id);
      }
    } else {
      trackingRideIdRef.current = null;
    }
  }, [state, ride?.$id, startLocationTracking]);

  // Check if within 200m of pickup/drop
  useEffect(() => {
    if (!ride || !location) return;
    const loc = devMode && mockLocation ? mockLocation : location;
    if (!loc) return;
    const appwriteLoc = toAppwrite(loc);

    if (state === 'accepted' && ride.pickupLocation) {
      const nearPickup = isWithinRadius(appwriteLoc, ride.pickupLocation, 300);
      if (nearPickup) {
        setState('otp');
      }
    }

    if (state === 'riding' && ride.dropLocation) {
      const nearDrop = isWithinRadius(appwriteLoc, ride.dropLocation, 300);
      setCanEndRide(nearDrop);
    }
  }, [location, ride, state, devMode, mockLocation]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopPolling();
      stopLocationTracking();
    };
  }, [stopPolling, stopLocationTracking]);

  const handleGoOnline = () => {
    setState('available');
  };

  const handleGoOffline = async () => {
    if (user) {
      await setDriverAvailabilityAction(user.$id, false);
    }
    setState('offline');
    stopPolling();
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!user) return;
    setAccepting(true);
    try {
      const accepted = await acceptRideAction(rideId, user.$id);
      setRide(accepted);
      setState('accepted');
      stopPolling();
      subscribeToRide(rideId);
    } catch {
      // Ride was already taken
    } finally {
      setAccepting(false);
    }
  };

  const handleVerifyOtp = async (otp: string): Promise<boolean> => {
    if (!ride) return false;
    return verifyOtpAction(ride.$id, otp);
  };

  const handleEndRide = async () => {
    if (!ride) return;
    await endRideAction(ride.$id);
    setState('completed');
    stopLocationTracking();
  };

  const handleDone = () => {
    setRide(null);
    setState('available');
    setCanEndRide(false);
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

  if (state === 'completed' || state === 'cancelled') {
    return ride ? <RideSummary ride={ride} onDone={handleDone} /> : null;
  }

  // Build markers
  const markers: MapMarker[] = [
    { position: location, label: 'You', type: 'driver' },
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
  if (ride?.riderLocation) {
    markers.push({
      position: toLeaflet(ride.riderLocation),
      label: 'Rider',
      type: 'default',
    });
  }
  // Add nearby ride pickups
  if (state === 'available') {
    nearbyRides.forEach((r) => {
      markers.push({
        position: toLeaflet(r.pickupLocation),
        label: r.pickupAddress,
        type: 'pickup',
      });
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
        {state === 'offline' && (
          <div className="p-5 text-center">
            <p className="mb-4 text-sm text-zinc-400">
              You are currently offline
            </p>
            <button
              onClick={handleGoOnline}
              className="w-full rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-zinc-900 hover:bg-amber-400 transition-colors"
            >
              Go Online
            </button>
          </div>
        )}

        {state === 'available' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-zinc-200">Online</span>
              </div>
              <button
                onClick={handleGoOffline}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                Go Offline
              </button>
            </div>

            {nearbyRides.length === 0 ? (
              <div className="rounded-xl bg-zinc-800/40 p-6 text-center">
                <p className="text-sm text-zinc-500">
                  No ride requests nearby
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Scanning every 5 seconds...
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {nearbyRides.map((r) => (
                  <RideCard
                    key={r.$id}
                    ride={r}
                    onAccept={handleAcceptRide}
                    accepting={accepting}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {state === 'accepted' && ride && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-amber-400">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Head to pickup
                </p>
                <p className="text-xs text-zinc-500 truncate max-w-[250px]">
                  {ride.pickupAddress}
                </p>
              </div>
            </div>
          </div>
        )}

        {state === 'otp' && ride && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Arrived at pickup
                </p>
                <p className="text-xs text-zinc-500">
                  Verify the rider&apos;s OTP to start the trip
                </p>
              </div>
            </div>
            <OtpVerify onVerify={handleVerifyOtp} />
          </div>
        )}

        {state === 'riding' && ride && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Trip in progress
                </p>
                <p className="text-xs text-zinc-500 truncate max-w-[250px]">
                  Heading to {ride.dropAddress}
                </p>
              </div>
            </div>

            <button
              onClick={handleEndRide}
              disabled={!canEndRide}
              className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                canEndRide
                  ? 'bg-emerald-500 text-zinc-900 hover:bg-emerald-400'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {canEndRide ? 'End Ride' : 'Get closer to drop-off to end ride'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
