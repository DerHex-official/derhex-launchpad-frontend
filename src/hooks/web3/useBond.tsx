import { useState, useEffect } from 'react'
import { getAllBondData, getBondDataByAddress, getBondDataByProjectName } from '../../utils/web3/bond'
import { ensureRawGistURL } from '../../utils/tools';
import { CHAIN_ID } from '../../utils/source';
import { useChain } from '../../context/ChainContext';

interface UseBondReturn {
    loading: boolean;
    error: { message: string };
    data: any[] | any; // Can be array or single object depending on the query
    refetch: () => Promise<void>; // Refetch function to return type
}

interface UseBondOptions {
    polling?: boolean;
    projectName?: string; // Project name option
}

/**
 * Custom hook for handling bond data
 * @param {string | null} projectName - Optional project name to fetch specific bond data
 * @param {UseBondOptions} options - Options object with polling configuration
 * @param {`0x${string}` | null} id - Optional bond address to fetch specific bond data
 * @returns {UseBondReturn} Object containing loading state, error, and data
 */
export function useBond(projectName?: string | null, options?: UseBondOptions, id?: `0x${string}` | null): UseBondReturn {
    const { polling = true } = options || {};
    const { selectedChain } = useChain();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<{ message: string }>({ message: "" });
    const [data, setData] = useState<any[] | any>([]);
    const [currentChainId, setCurrentChainId] = useState<string>(CHAIN_ID);

    const fetchData = async () => {
        try {
            let result;
            if (projectName) {
                // Fetch by project name if provided
                result = await getBondDataByProjectName(projectName);
                if (!result) {
                    console.warn(`No bond found for project name: ${projectName}`);
                    throw new Error(`Bond not found for project: ${projectName}`);
                }
            } else if (id) {
                // Fetch single bond data if ID is provided
                result = await getBondDataByAddress(id);
                if (result && result.metadataURI) {
                    try {
                        // Add timeout to fetch to prevent hanging
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                        const response = await fetch(ensureRawGistURL(result.metadataURI as string), {
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);

                        if (response.ok) {
                            const data = await response.json();
                            result = {
                                ...result,
                                bondInfo: data
                            };
                        } else {
                            console.error(`Failed to fetch bond info for ${id}:`, response.statusText);
                        }
                    } catch (err: any) {
                        console.error(`Error fetching metadata for bond ${id}:`,
                            err.name === 'AbortError' ? 'Request timed out' : err.message);
                    }
                } else if (!result) {
                    console.warn(`No bond data found for ID: ${id}`);
                    throw new Error(`Bond not found: ${id}`);
                }
            } else {
                // Fetch all bond data if no ID is provided
                result = await getAllBondData();

                // Validate bond data before proceeding
                if (!result || !Array.isArray(result)) {
                    console.warn('Invalid bond data received:', result);
                    result = [];
                    throw new Error('Invalid bond data received');
                }

                // Filter out any invalid bond entries
                const validBonds = result.filter(bond => {
                    return bond && typeof bond === 'object' && bond.id && bond.metadataURI;
                });

                if (validBonds.length === 0 && result.length > 0) {
                    console.warn('No valid bonds found in data');
                }

                result = await Promise.all(validBonds.map(async (bond, index) => {
                    // Add delay based on index (0.5 seconds between each request)
                    await new Promise(resolve => setTimeout(resolve, index * 500));

                    try {
                        // Add timeout to fetch to prevent hanging
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                        const response = await fetch(ensureRawGistURL(bond.metadataURI as string), {
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);

                        if (response.ok) {
                            const data = await response.json();
                            return {
                                ...bond,
                                bondInfo: data
                            };
                        } else {
                            console.error(`Failed to fetch bond info for ${bond.id}:`, response.statusText);
                            return bond;
                        }
                    } catch (err: any) {
                        console.error(`Error fetching metadata for bond ${bond.id}:`,
                            err.name === 'AbortError' ? 'Request timed out' : err.message);
                        return bond;
                    }
                }));
            }
            setData(result);
        } catch (err: any) {
            setError({ message: err.message || "Failed to fetch bond data" });
        } finally {
            setLoading(false);
        }
    };

    // Effect to track global CHAIN_ID changes
    useEffect(() => {
        // Check if the chain has changed
        if (currentChainId !== CHAIN_ID) {
            console.log(`useBond: Global CHAIN_ID changed from ${currentChainId} to ${CHAIN_ID}, refetching...`);
            setCurrentChainId(CHAIN_ID);
            setLoading(true);
            // Clear any cached data
            setData([]);
            // Fetch new data with a slight delay to ensure chain change is complete
            setTimeout(() => {
                fetchData();
            }, 100);
        }
    }, [CHAIN_ID, currentChainId]);

    // Effect to track selectedChain from context
    useEffect(() => {
        console.log(`useBond: selectedChain changed to ${selectedChain}, refetching...`);
        setLoading(true);
        fetchData();
    }, [selectedChain]);

    // Listen for the chainChanged custom event
    useEffect(() => {
        const handleChainChanged = (event: any) => {
            console.log(`useBond: Received chainChanged event with chainId ${event.detail.chainId}`);
            setLoading(true);
            setData([]);
            setTimeout(() => {
                fetchData();
            }, 100);
        };

        window.addEventListener('chainChanged', handleChainChanged);

        return () => {
            window.removeEventListener('chainChanged', handleChainChanged);
        };
    }, []);

    useEffect(() => {
        // Initial fetch
        console.log(`useBond: Initial fetch with chain ${CHAIN_ID}`);
        fetchData();

        // Set up polling every 10 seconds if enabled
        let interval: NodeJS.Timeout;
        if (polling) {
            interval = setInterval(fetchData, 10000);
        }

        // Cleanup interval on unmount
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [id, projectName, polling]);

    return {
        loading,
        error,
        data,
        refetch: fetchData
    };
}