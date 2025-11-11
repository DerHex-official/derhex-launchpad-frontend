import React, { createContext, useContext, ReactNode } from 'react';
import { usePresale } from '../hooks/web3/usePresale';

interface PresalesDataContextType {
  data: any[] | any;
  loading: boolean;
  error: { message: string };
  refetch: () => Promise<void>;
}

const PresalesDataContext = createContext<PresalesDataContextType | undefined>(undefined);

export const usePresalesData = () => {
  const context = useContext(PresalesDataContext);
  if (!context) {
    throw new Error('usePresalesData must be used within a PresalesDataProvider');
  }
  return context;
};

interface PresalesDataProviderProps {
  children: ReactNode;
}

export const PresalesDataProvider: React.FC<PresalesDataProviderProps> = ({ children }) => {
  // Single source of truth - fetch presales data once
  const { data, loading, error, refetch } = usePresale(null, { polling: false });

  return (
    <PresalesDataContext.Provider value={{ data, loading, error, refetch }}>
      {children}
    </PresalesDataContext.Provider>
  );
};
