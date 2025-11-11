import React, { createContext, useContext, ReactNode } from 'react';
import { useBond } from '../hooks/web3/useBond';

interface BondsDataContextType {
  data: any[] | any;
  loading: boolean;
  error: { message: string };
  refetch: () => Promise<void>;
}

const BondsDataContext = createContext<BondsDataContextType | undefined>(undefined);

export const useBondsData = () => {
  const context = useContext(BondsDataContext);
  if (!context) {
    throw new Error('useBondsData must be used within a BondsDataProvider');
  }
  return context;
};

interface BondsDataProviderProps {
  children: ReactNode;
}

export const BondsDataProvider: React.FC<BondsDataProviderProps> = ({ children }) => {
  // Single source of truth - fetch bonds data once
  const { data, loading, error, refetch } = useBond(null, { polling: false });

  return (
    <BondsDataContext.Provider value={{ data, loading, error, refetch }}>
      {children}
    </BondsDataContext.Provider>
  );
};
