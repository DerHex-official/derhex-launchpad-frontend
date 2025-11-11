import { useState, useEffect } from 'react'
import { getAllPresaleData, getPresaleDataByAddress, getPresaleDataByProjectName } from '../../utils/web3/presale'
import { ensureRawGistURL } from '../../utils/tools';

interface UsePresaleReturn {
    loading: boolean;
    error: { message: string };
    data: any[] | any; // Can be array or single object depending on the query
    refetch: () => Promise<void>; // Add refetch function to return type
}

interface UsePresaleOptions {
    polling?: boolean;
    projectName?: string; // Add projectName option
}

/**
 * Custom hook for handling presale data
 * @param {`0x${string}` | null} id - Optional presale address to fetch specific data
 * @param {UsePresaleOptions} options - Options object with polling configuration
 * @returns {UsePresaleReturn} Object containing loading state, error, and data
 */
export function usePresale(projectName?: string | null, options?: UsePresaleOptions, id?: `0x${string}` | null): UsePresaleReturn {
    const { polling = true } = options || {};
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<{ message: string }>({ message: "" });
    const [data, setData] = useState<any[] | any>([]);

    const fetchData = async () => {
        try {
            let result;
            if (projectName) {
                // Fetch by project name if provided
                result = await getPresaleDataByProjectName(projectName);
            } else if (id) {
                // Fetch single presale data if ID is provided
                result = await getPresaleDataByAddress(id);
                if (result) {
                    try {
                        const response = await fetch(ensureRawGistURL(result.metadataURI as string));
                        if (response.ok) {
                            const data = await response.json();
                            result = {
                                ...result,
                                presaleInfo: data
                            };
                        } else {
                            console.error('Failed to fetch presale info:', response.statusText);
                        }
                    } catch (err) {
                        console.error('Error fetching metadata:', err);
                    }
                }
            } else {
                // Fetch all presale data if no ID is provided
                result = await getAllPresaleData();
                result = await Promise.all(result.map(async (presale, index) => {
                    // Add delay based on index (0.5 seconds between each request)
                    await new Promise(resolve => setTimeout(resolve, index * 500));

                    try {
                        const response = await fetch(ensureRawGistURL(presale.metadataURI as string));
                        if (response.ok) {
                            const data = await response.json();
                            return {
                                ...presale,
                                presaleInfo: data
                            };
                        } else {
                            console.error('Failed to fetch presale info:', response.statusText);
                            return presale;
                        }
                    } catch (err) {
                        console.error('Error fetching metadata:', err);
                        return presale;
                    }
                }));
            }
            setData(result);
        } catch (err: any) {
            setError({ message: err.message || "Failed to fetch presale data" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
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
    }, [id, polling]);

    return {
        loading,
        error,
        data,
        refetch: fetchData
    };
}