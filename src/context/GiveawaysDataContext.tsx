import React, { createContext, useContext, ReactNode } from 'react';
import { useGiveaway } from '../hooks/web3/useGiveaway';

interface GiveawaysDataContextType {
  data: any[] | any;
  loading: boolean;
  error: { message: string };
  refetch: () => Promise<void>;
}

const GiveawaysDataContext = createContext<GiveawaysDataContextType | undefined>(undefined);

export const useGiveawaysData = () => {
  const context = useContext(GiveawaysDataContext);
  if (!context) {
    throw new Error('useGiveawaysData must be used within a GiveawaysDataProvider');
  }
  return context;
};

interface GiveawaysDataProviderProps {
  children: ReactNode;
}

export const GiveawaysDataProvider: React.FC<GiveawaysDataProviderProps> = ({ children }) => {
  // Single source of truth - fetch giveaways data once
  const { data, loading, error, refetch } = useGiveaway(null, { polling: false });

  return (
    <GiveawaysDataContext.Provider value={{ data, loading, error, refetch }}>
      {children}
    </GiveawaysDataContext.Provider>
  );
};
