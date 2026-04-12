"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface BreadcrumbContextValue {
  override: string | null;
  setOverride: (label: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  override: null,
  setOverride: () => {},
});

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [override, setOverrideState] = useState<string | null>(null);
  const setOverride = useCallback((label: string | null) => {
    setOverrideState(label);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ override, setOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbOverride() {
  return useContext(BreadcrumbContext);
}
