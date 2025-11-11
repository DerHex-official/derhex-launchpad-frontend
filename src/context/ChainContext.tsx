import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { sonic_testnet, rise_testnet } from '../config/chain';
import { getChainName, setCurrentChainId, CHAIN_ID } from '../utils/source';

// Define the supported chains
export const supportedChains = {
  "84532": {
    id: 84532,
    name: "Base Sepolia Testnet",
    viemChain: baseSepolia,
  },
  "57054": {
    id: 57054,
    name: "Sonic Testnet",
    viemChain: sonic_testnet,
  },
  "11155931": {
    id: 11155931,
    name: "Rise Testnet",
    viemChain: rise_testnet,
  }
};

type SupportedChainId = keyof typeof supportedChains;

interface ChainContextType {
  selectedChain: SupportedChainId;
  setSelectedChain: (chainId: SupportedChainId) => void;
  chainName: string;
  publicClient: any; // Using any to avoid TypeScript issues with viem
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export const useChain = () => {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
};

interface ChainProviderProps {
  children: ReactNode;
}

export const ChainProvider: React.FC<ChainProviderProps> = ({ children }) => {
  const { wallets } = useWallets();

  // Check if there's a saved chain in localStorage
  const savedChain = localStorage.getItem('selected_chain_id');
  const initialChain = (savedChain && savedChain in supportedChains) ?
    savedChain as SupportedChainId :
    "11155931"; // Default to Rise Testnet

  console.log(`ChainContext: Using initial chain: ${initialChain}`);

  const [selectedChain, setSelectedChainState] = useState<SupportedChainId>(initialChain);

  // Wrapper for setSelectedChain that also updates localStorage
  const setSelectedChain = (chainId: SupportedChainId) => {
    console.log(`ChainContext: Setting selectedChain to ${chainId}`);
    // Save to localStorage for persistence
    localStorage.setItem('selected_chain_id', chainId);
    // Update state
    setSelectedChainState(chainId);
  };
  const [publicClient, setPublicClient] = useState(() =>
    createPublicClient({
      chain: supportedChains[selectedChain].viemChain,
      transport: http()
    })
  );

  // Log the initial chain on mount and ensure global CHAIN_ID is set
  useEffect(() => {
    console.log(`ChainContext: Initialized with chain ${selectedChain}`);

    // Set the global CHAIN_ID on initialization
    setCurrentChainId(selectedChain);
    console.log(`ChainContext: Initial global CHAIN_ID set to ${CHAIN_ID}`);

    // Force a refresh of all data by dispatching a custom event
    const event = new CustomEvent('chainChanged', { detail: { chainId: selectedChain } });
    window.dispatchEvent(event);
  }, []);

  // Update the public client when the selected chain changes
  useEffect(() => {
    console.log(`ChainContext: Updating public client for chain ${selectedChain}`);

    // Update the global CHAIN_ID directly
    setCurrentChainId(selectedChain);
    console.log(`ChainContext: Global CHAIN_ID updated to ${CHAIN_ID}`);

    // Set a flag in localStorage to indicate a chain change
    window.localStorage.setItem('last_chain_change', selectedChain);
    window.localStorage.setItem('force_chain_refresh', Date.now().toString());

    // Create a new public client with the selected chain
    const newClient = createPublicClient({
      chain: supportedChains[selectedChain].viemChain,
      transport: http()
    });

    // Update the public client
    setPublicClient(newClient);

    // Force a refresh of all data by dispatching a custom event
    const event = new CustomEvent('chainChanged', { detail: { chainId: selectedChain } });
    window.dispatchEvent(event);

    console.log(`ChainContext: Public client updated for chain ${selectedChain}`);
  }, [selectedChain]);

  // Try to detect the wallet's chain when available
  useEffect(() => {
    if (wallets && wallets.length > 0) {
      const activeWallet = wallets[0];
      const chainInfo = activeWallet.chainId;
      const chainId = chainInfo.split(':')[1];

      console.log(`ChainContext: Detected wallet chain: ${chainId}`);

      // Only update if it's a supported chain and different from current
      if (chainId in supportedChains && chainId !== selectedChain) {
        console.log(`ChainContext: Switching to wallet chain: ${chainId}`);

        // Update the global CHAIN_ID directly
        setCurrentChainId(chainId as SupportedChainId);
        console.log(`ChainContext: Global CHAIN_ID updated to ${CHAIN_ID} from wallet detection`);

        // Then update the context state
        setSelectedChain(chainId as SupportedChainId);

        // Dispatch a custom event to notify components of the chain change
        const event = new CustomEvent('chainChanged', { detail: { chainId } });
        window.dispatchEvent(event);
      } else if (!(chainId in supportedChains)) {
        console.log(`ChainContext: Wallet chain ${chainId} not supported, staying on ${selectedChain}`);
      }
    }
  }, [wallets, selectedChain]);

  // Removed 2-second polling - rely on wallet events and manual chain switching instead

  const chainName = getChainName(selectedChain);

  return (
    <ChainContext.Provider value={{
      selectedChain,
      setSelectedChain,
      chainName,
      publicClient
    }}>
      {children}
    </ChainContext.Provider>
  );
};
