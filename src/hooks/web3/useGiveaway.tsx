import { useState, useEffect } from 'react';
import { getAllAirdropData, getAirdropDataByAddress, getGiveawayByProjectName } from '../../utils/web3/giveaway';
import { ensureRawGistURL } from '../../utils/tools';

interface UseGiveawayReturn {
    loading: boolean;
    error: { message: string };
    data: any[] | any;
    refetch: () => Promise<void>;
}

interface UseGiveawayOptions {
    polling?: boolean;
    projectName?: string;
}

/**
 * Custom hook for handling giveaway data
 * @param {`0x${string}` | null} id - Optional giveaway address to fetch specific data
 * @param {UseGiveawayOptions} options - Options object with polling configuration
 * @returns {UseGiveawayReturn} Object containing loading state, error, and data
 */
export function useGiveaway(projectName?: string | null, options?: UseGiveawayOptions, id?: `0x${string}` | null): UseGiveawayReturn {
    const { polling = true } = options || {};
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<{ message: string }>({ message: "" });
    const [data, setData] = useState<any[] | any>([]);

    const fetchData = async () => {
        try {
            let result;
            if (projectName) {
                // Fetch Project Name
                result = await getGiveawayByProjectName(projectName);
            }
            else if (id) {
                // Fetch single giveaway data if ID is provided
                try {
                    result = await getAirdropDataByAddress(id);
                    if (result) {
                        try {
                            const response = await fetch(ensureRawGistURL(result.metadataURI as string));
                            if (response.ok) {
                                const data = await response.json();
                                result = {
                                    ...result,
                                    giveawayInfo: data
                                };
                            } else {
                                console.error('Failed to fetch giveaway info:', {
                                    status: response.status,
                                    statusText: response.statusText,
                                    url: result.metadataURI
                                });
                            }
                        } catch (err) {
                            console.error('Error fetching metadata:', {
                                error: err,
                                metadataURI: result.metadataURI
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error fetching airdrop data by address:', {
                        error: err,
                        address: id
                    });
                    throw err;
                }
            } else {
                // Fetch all giveaway data if no ID is provided
                try {
                    result = await getAllAirdropData();
                    result = await Promise.all(result.map(async (giveaway, index) => {
                        // Add delay based on index (0.5 seconds between each request)
                        await new Promise(resolve => setTimeout(resolve, index * 500));

                        try {
                            const response = await fetch(ensureRawGistURL(giveaway.metadataURI as string));
                            if (response.ok) {
                                const data = await response.json();
                                return {
                                    ...giveaway,
                                    giveawayInfo: data
                                };
                            } else {
                                console.error('Failed to fetch giveaway info:', {
                                    status: response.status,
                                    statusText: response.statusText,
                                    url: giveaway.metadataURI,
                                    index
                                });
                                return giveaway;
                            }
                        } catch (err) {
                            console.error('Error fetching metadata:', {
                                error: err,
                                metadataURI: giveaway.metadataURI,
                                index
                            });
                            return giveaway;
                        }
                    }));
                } catch (err) {
                    console.error('Error fetching all airdrop data:', {
                        error: err
                    });
                    throw err;
                }
            }

            // Remove error state setting for empty data
            if (result) {
                setData(result);
            } else {
                setData([]);
            }
        } catch (err: any) {
            console.error('Error in fetchData:', {
                timestamp: new Date().toISOString(),
                error: {
                    message: err.message,
                    stack: err.stack,
                    name: err.name
                },
                context: {
                    id,
                    polling
                }
            });
            setError({
                message: err.message || "Failed to fetch giveaway data"
            });
            setData([]); // Ensure data is cleared on error
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
