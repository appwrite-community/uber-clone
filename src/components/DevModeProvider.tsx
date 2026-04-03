'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface DevModeContextValue {
  devMode: boolean;
  toggleDevMode: () => void;
  mockLocation: [number, number] | null; // Leaflet [lat, lng]
  setMockLocation: (loc: [number, number] | null) => void;
}

const DevModeContext = createContext<DevModeContextValue>({
  devMode: false,
  toggleDevMode: () => {},
  mockLocation: null,
  setMockLocation: () => {},
});

export function useDevMode() {
  return useContext(DevModeContext);
}

export default function DevModeProvider({ children }: { children: ReactNode }) {
  const [devMode, setDevMode] = useState(false);
  const [mockLocation, setMockLocation] = useState<[number, number] | null>(
    null
  );

  const toggleDevMode = useCallback(() => {
    setDevMode((prev) => !prev);
  }, []);

  return (
    <DevModeContext.Provider
      value={{ devMode, toggleDevMode, mockLocation, setMockLocation }}
    >
      {children}
    </DevModeContext.Provider>
  );
}
