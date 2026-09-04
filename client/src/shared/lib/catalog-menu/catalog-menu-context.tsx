'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type CatalogMenuSection =
  'list' | 'favorites' | 'demos' | 'stats' | 'generator' | 'history';

interface CatalogMenuContextValue {
  openRequest: CatalogMenuSection | null;
  closeSignal: number;
  openSection: (section: CatalogMenuSection) => void;
  consumeOpenRequest: () => void;
  requestClose: () => void;
}

const CatalogMenuContext = createContext<CatalogMenuContextValue | null>(null);

export function CatalogMenuProvider({ children }: { children: ReactNode }) {
  const [openRequest, setOpenRequest] = useState<CatalogMenuSection | null>(
    null
  );
  const [closeSignal, setCloseSignal] = useState(0);

  const openSection = useCallback((section: CatalogMenuSection) => {
    setOpenRequest(section);
  }, []);

  const consumeOpenRequest = useCallback(() => {
    setOpenRequest(null);
  }, []);

  const requestClose = useCallback(() => {
    setCloseSignal((current) => current + 1);
  }, []);

  const value = useMemo(
    () => ({
      openRequest,
      closeSignal,
      openSection,
      consumeOpenRequest,
      requestClose,
    }),
    [closeSignal, consumeOpenRequest, openRequest, openSection, requestClose]
  );

  return (
    <CatalogMenuContext.Provider value={value}>
      {children}
    </CatalogMenuContext.Provider>
  );
}

export function useCatalogMenu() {
  const value = useContext(CatalogMenuContext);

  if (!value) {
    throw new Error('useCatalogMenu вне CatalogMenuProvider');
  }

  return value;
}
