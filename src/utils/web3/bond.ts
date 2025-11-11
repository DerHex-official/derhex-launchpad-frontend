import BondFactoryABI from "../../abis/BondFactory.json";
import ERC20ABI from "../../abis/ERC20.json";
import Bond from "../../abis/Bond.json";
import { getClient, applyRateLimit, recordError, recordSuccess } from "./client"
import { ethers } from 'ethers';
import { getContractAddress } from '../source';
import { ensureRawGistURL } from "../tools";
import { CHAIN_ID } from '../source';

// Helper function to add delay with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cache for bond data to reduce API calls
interface BondCache {
    timestamp: number;
    data: any;
    chainId: string;
}

const CACHE_TTL = 300000; // 5 minute cache TTL
const bondAddressCache: BondCache = { timestamp: 0, data: null, chainId: '' };
const bondDataCache: Record<string, BondCache> = {};

// Function to check if cache is valid
const isCacheValid = (cache: BondCache): boolean => {
    return (
        cache.timestamp > 0 &&
        Date.now() - cache.timestamp < CACHE_TTL &&
        cache.chainId === CHAIN_ID
    );
};

export const getAllBondAddress = async () => {
    // Check cache first
    if (isCacheValid(bondAddressCache)) {
        console.log('Using cached bond addresses');
        return bondAddressCache.data;
    }

    const bondFactoryAddress = getContractAddress("bondFactory")
    try {
        let addressList: `0x${string}`[] = []
        let index = 0
        let retryCount = 0;
        const maxRetries = 5; // Increased from 3 to 5
        const maxBonds = 50; // Reasonable limit to prevent infinite loops

        while (index < maxBonds) {
            try {
                // Add delay between requests to avoid rate limiting
                if (index > 0) {
                    // Exponential backoff: wait longer after each request
                    await delay(1000 * Math.pow(1.5, index - 1)); // Increased base delay from 500ms to 1000ms
                }

                await applyRateLimit();
                const client = getClient();
                const address: any = await client.readContract({
                    address: bondFactoryAddress,
                    abi: BondFactoryABI,
                    functionName: "allBonds",
                    args: [index]
                })

                // If we get a valid address, add it to the list
                if (address) {
                    addressList.push(address)
                    index++
                    retryCount = 0; // Reset retry count on success
                    recordSuccess(); // Record successful request
                } else {
                    // If we get a null/undefined address, stop
                    break
                }

            } catch (error: any) {
                console.warn(`Error fetching bond address ${index}:`, error.message);
                recordError(error); // Record the error for circuit breaker

                // If we get a rate limit error or network error, retry with exponential backoff
                const isRateLimitError = error.message.includes('429');
                const isNetworkError = error.message.includes('Failed to fetch') ||
                    error.message.includes('Network error') ||
                    error.message.includes('timeout');

                if ((isRateLimitError || isNetworkError) && retryCount < maxRetries) {
                    retryCount++;
                    const backoffTime = 2000 * Math.pow(2, retryCount); // Increased base delay
                    console.log(`Request failed. Retrying in ${backoffTime}ms (attempt ${retryCount}/${maxRetries})`);
                    await delay(backoffTime);
                    continue; // Try again without incrementing index
                }

                // For other errors or if we've exceeded max retries, break the loop
                break
            }
        }

        // Update cache with new data
        bondAddressCache.data = addressList;
        bondAddressCache.timestamp = Date.now();
        bondAddressCache.chainId = CHAIN_ID;

        return addressList
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve bond addresses")
    }
}

export const getAllBondData = async () => {
    const allBonds = await getAllBondAddress();

    const bondData = await Promise.all(allBonds.map(async (bond: `0x${string}`) => {
        const bondContract = {
            address: bond,
            abi: Bond
        }
        await applyRateLimit();
        const client = getClient();
        const results = await client.multicall({
            contracts: [
                {
                    ...bondContract,
                    functionName: "metadataURI"
                },
                {
                    ...bondContract,
                    functionName: "paymentToken"
                },
                {
                    ...bondContract,
                    functionName: "saleToken"
                },
                {
                    ...bondContract,
                    functionName: "bondType"
                },
                {
                    ...bondContract,
                    functionName: "bondSize"
                },
                {
                    ...bondContract,
                    functionName: "totalSold"
                },
                {
                    ...bondContract,
                    functionName: "whitelistStartTime"
                },
                {
                    ...bondContract,
                    functionName: "saleStartTime"
                },
                {
                    ...bondContract,
                    functionName: "saleEndTime"
                },
                {
                    ...bondContract,
                    functionName: "withdrawTime"
                },
                {
                    ...bondContract,
                    functionName: "withdrawDelay"
                },
                {
                    ...bondContract,
                    functionName: "linearVestingEndTime"
                },
                {
                    ...bondContract,
                    functionName: "taxCollector"
                },
                {
                    ...bondContract,
                    functionName: "taxPercentage"
                },
                {
                    ...bondContract,
                    functionName: "isPrivateBond"
                },
                {
                    ...bondContract,
                    functionName: "stakingPool"
                },
                {
                    ...bondContract,
                    functionName: "fixedDiscountPercentage"
                },
                {
                    ...bondContract,
                    functionName: "getDiscount"
                },
                {
                    ...bondContract,
                    functionName: "initialDiscountPercentage"
                },
                {
                    ...bondContract,
                    functionName: "finalDiscountPercentage"
                },
                {
                    ...bondContract,
                    functionName: "whitelistCount"
                },
                {
                    ...bondContract,
                    functionName: "participants"
                },
                {
                    ...bondContract,
                    functionName: "bondAllocation"
                }
            ]
        });

        const [
            metadataURI,
            paymentToken,
            saleToken,
            bondType,
            bondSize,
            totalSold,
            whitelistStartTime,
            saleStartTime,
            saleEndTime,
            withdrawTime,
            withdrawDelay,
            linearVestingEndTime,
            taxCollector,
            taxPercentage,
            isPrivateBond,
            stakingPool,
            fixedDiscountPercentage,
            currentDiscount,
            initialDiscountPercentage,
            finalDiscountPercentage,
            whitelistCount,
            participants,
            bondAllocation
        ] = results;

        if (!paymentToken.result) throw new Error('Invalid payment token address');

        await applyRateLimit();
        const paymentTokenData = await getClient().multicall({
            contracts: [
                {
                    address: paymentToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "name"
                },
                {
                    address: paymentToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "symbol"
                },
                {
                    address: paymentToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "decimals"
                }
            ]
        })

        if (!paymentTokenData) throw new Error('Failed to retrieve payment token data');

        const [
            paymentTokenName,
            paymentTokenSymbol,
            paymentTokenDecimals
        ] = paymentTokenData;

        await applyRateLimit();
        const saleTokenData = await getClient().multicall({
            contracts: [
                {
                    address: saleToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "name"
                },
                {
                    address: saleToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "symbol"
                },
                {
                    address: saleToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "decimals"
                }
            ]
        });

        if (!saleTokenData) throw new Error('Failed to retrieve sale token data');

        const [
            saleTokenName,
            saleTokenSymbol,
            saleTokenDecimals
        ] = saleTokenData;

        interface CliffVesting {
            claimTime: number,
            percentage: number
        }

        // Helper function to add delay with exponential backoff
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        async function generateCliffPeriod() {
            let index = 0;
            let cliffPeriod: CliffVesting[] = [];
            let retryCount = 0;
            const maxRetries = 2;
            const maxPeriods = 5; // Limit to prevent excessive calls

            // Try to get cliff periods, but don't fail the entire bond data fetch if this fails
            try {
                while (index < maxPeriods) {
                    try {
                        // Add delay between requests
                        if (index > 0) {
                            await delay(500 * Math.pow(1.5, index - 1));
                        }

                        await applyRateLimit();
                        const currentPeriod: any = await getClient().readContract({
                            address: bond,
                            abi: Bond,
                            functionName: 'cliffPeriod',
                            args: [index]
                        });

                        if (currentPeriod) {
                            cliffPeriod.push({
                                claimTime: Number(currentPeriod.claimTime || currentPeriod["0"]),
                                percentage: Number(currentPeriod.percentage || currentPeriod["1"])
                            });
                            index++;
                            retryCount = 0; // Reset retry count on success
                            recordSuccess(); // Record successful request
                        } else {
                            break;
                        }
                    } catch (error: any) {
                        console.warn(`Error fetching cliff period ${index}:`, error.message);
                        recordError(error); // Record the error for circuit breaker

                        // If we get a contract revert error, it likely means the function doesn't exist
                        // or the index is out of bounds, so we should stop trying
                        if (error.message.includes('reverted') || error.message.includes('invalid') || error.message.includes('does not exist')) {
                            break;
                        }

                        // For rate limit errors, retry with backoff
                        if (error.message.includes('429') && retryCount < maxRetries) {
                            retryCount++;
                            const backoffTime = 1000 * Math.pow(2, retryCount);
                            console.log(`Rate limited. Retrying in ${backoffTime}ms (attempt ${retryCount}/${maxRetries})`);
                            await delay(backoffTime);
                            continue; // Try again without incrementing index
                        }

                        // For other errors or if we've exceeded max retries, break the loop
                        break;
                    }
                }
            } catch (error) {
                console.error('Failed to fetch cliff periods, continuing with empty array:', error);
                // Return empty array rather than failing the entire bond data fetch
            }

            return cliffPeriod;
        }

        const cliffPeriod = await generateCliffPeriod();

        return {
            id: bond,
            metadataURI: metadataURI.result,
            paymentToken: {
                id: paymentToken.result,
                name: paymentTokenName.result,
                symbol: paymentTokenSymbol.result,
                decimals: paymentTokenDecimals.result
            },
            saleToken: {
                id: saleToken.result,
                name: saleTokenName.result,
                symbol: saleTokenSymbol.result,
                decimals: saleTokenDecimals.result
            },
            bondType: Number(bondType.result),
            bondSize: ethers.formatUnits(bondSize.result as any, saleTokenDecimals.result as number),
            totalSold: ethers.formatUnits(totalSold.result as any, saleTokenDecimals.result as number),
            whitelistStartTime: Number(whitelistStartTime.result),
            saleStartTime: Number(saleStartTime.result),
            saleEndTime: Number(saleEndTime.result),
            withdrawTime: Number(withdrawTime.result),
            withdrawDelay: Number(withdrawDelay.result),
            linearVestingEndTime: Number(linearVestingEndTime.result),
            cliffPeriod: cliffPeriod,
            taxCollector: taxCollector.result,
            taxPercentage: Number(taxPercentage.result) / 100,
            isPrivateBond: isPrivateBond.result,
            stakingPool: stakingPool.result,
            fixedDiscountPercentage: Number(fixedDiscountPercentage.result) / 100,
            currentDiscount: Number(currentDiscount.result) / 100,
            initialDiscountPercentage: Number(initialDiscountPercentage.result) / 100,
            finalDiscountPercentage: Number(finalDiscountPercentage.result) / 100,
            whitelistCount: Number(whitelistCount.result),
            participants: Number(participants.result),
            bondAllocation: ethers.formatUnits(bondAllocation.result as any, saleTokenDecimals.result as number),
            chainId: CHAIN_ID // Add the current chain ID to the bond data
        };
    }));

    return bondData;
}

export const getBondDataByAddress = async (bond: `0x${string}`) => {
    // Check cache first
    if (bondDataCache[bond] && isCacheValid(bondDataCache[bond])) {
        console.log(`Using cached bond data for ${bond}`);
        return bondDataCache[bond].data;
    }

    const bondContract = {
        address: bond,
        abi: Bond
    }

    try {
        await applyRateLimit();
        const client = getClient();
        const results = await client.multicall({
            contracts: [
                {
                    ...bondContract,
                    functionName: "metadataURI"
                },
                {
                    ...bondContract,
                    functionName: "paymentToken"
                },
                {
                    ...bondContract,
                    functionName: "saleToken"
                },
                {
                    ...bondContract,
                    functionName: "bondType"
                },
                {
                    ...bondContract,
                    functionName: "bondSize"
                },
                {
                    ...bondContract,
                    functionName: "totalSold"
                },
                {
                    ...bondContract,
                    functionName: "whitelistStartTime"
                },
                {
                    ...bondContract,
                    functionName: "saleStartTime"
                },
                {
                    ...bondContract,
                    functionName: "saleEndTime"
                },
                {
                    ...bondContract,
                    functionName: "withdrawTime"
                },
                {
                    ...bondContract,
                    functionName: "withdrawDelay"
                },
                {
                    ...bondContract,
                    functionName: "linearVestingEndTime"
                },
                {
                    ...bondContract,
                    functionName: "taxCollector"
                },
                {
                    ...bondContract,
                    functionName: "taxPercentage"
                },
                {
                    ...bondContract,
                    functionName: "isPrivateBond"
                },
                {
                    ...bondContract,
                    functionName: "stakingPool"
                },
                {
                    ...bondContract,
                    functionName: "fixedDiscountPercentage"
                },
                {
                    ...bondContract,
                    functionName: "getDiscount"
                },
                {
                    ...bondContract,
                    functionName: "initialDiscountPercentage"
                },
                {
                    ...bondContract,
                    functionName: "finalDiscountPercentage"
                },
                {
                    ...bondContract,
                    functionName: "whitelistCount"
                },
                {
                    ...bondContract,
                    functionName: "participants"
                },
                {
                    ...bondContract,
                    functionName: "bondAllocation"
                }
            ]
        });

        const [
            metadataURI,
            paymentToken,
            saleToken,
            bondType,
            bondSize,
            totalSold,
            whitelistStartTime,
            saleStartTime,
            saleEndTime,
            withdrawTime,
            withdrawDelay,
            linearVestingEndTime,
            taxCollector,
            taxPercentage,
            isPrivateBond,
            stakingPool,
            fixedDiscountPercentage,
            currentDiscount,
            initialDiscountPercentage,
            finalDiscountPercentage,
            whitelistCount,
            participants,
            bondAllocation
        ] = results;

        if (!paymentToken.result) throw new Error('Invalid payment token address');

        const paymentTokenData = await getClient().multicall({
            contracts: [
                {
                    address: paymentToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "name"
                },
                {
                    address: paymentToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "symbol"
                },
                {
                    address: paymentToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "decimals"
                }
            ]
        });

        if (!paymentTokenData) throw new Error('Failed to retrieve payment token data');

        const [
            paymentTokenName,
            paymentTokenSymbol,
            paymentTokenDecimals
        ] = paymentTokenData;

        const saleTokenData = await getClient().multicall({
            contracts: [
                {
                    address: saleToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "name"
                },
                {
                    address: saleToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "symbol"
                },
                {
                    address: saleToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "decimals"
                }
            ]
        });

        if (!saleTokenData) throw new Error('Failed to retrieve sale token data');

        const [
            saleTokenName,
            saleTokenSymbol,
            saleTokenDecimals
        ] = saleTokenData;

        interface CliffVesting {
            claimTime: number;
            percentage: number;
        }

        async function generateCliffPeriod() {
            let index = 0;
            let cliffPeriod: CliffVesting[] = [];
            let retryCount = 0;
            const maxRetries = 2;
            const maxPeriods = 5; // Limit to prevent excessive calls

            // Try to get cliff periods, but don't fail the entire bond data fetch if this fails
            try {
                while (index < maxPeriods) {
                    try {
                        // Add delay between requests
                        if (index > 0) {
                            await delay(500 * Math.pow(1.5, index - 1));
                        }

                        await applyRateLimit();
                        const currentPeriod: any = await client.readContract({
                            address: bond,
                            abi: Bond,
                            functionName: 'cliffPeriod',
                            args: [index]
                        });

                        if (currentPeriod) {
                            cliffPeriod.push({
                                claimTime: Number(currentPeriod.claimTime || currentPeriod["0"]),
                                percentage: Number(currentPeriod.percentage || currentPeriod["1"])
                            });
                            index++;
                            retryCount = 0; // Reset retry count on success
                            recordSuccess(); // Record successful request
                        } else {
                            break;
                        }
                    } catch (error: any) {
                        console.warn(`Error fetching cliff period ${index}:`, error.message);
                        recordError(error); // Record the error for circuit breaker

                        // If we get a contract revert error, it likely means the function doesn't exist
                        // or the index is out of bounds, so we should stop trying
                        if (error.message.includes('reverted') || error.message.includes('invalid') || error.message.includes('does not exist')) {
                            break;
                        }

                        // For rate limit errors, retry with backoff
                        if (error.message.includes('429') && retryCount < maxRetries) {
                            retryCount++;
                            const backoffTime = 1000 * Math.pow(2, retryCount);
                            console.log(`Rate limited. Retrying in ${backoffTime}ms (attempt ${retryCount}/${maxRetries})`);
                            await delay(backoffTime);
                            continue; // Try again without incrementing index
                        }

                        // For other errors or if we've exceeded max retries, break the loop
                        break;
                    }
                }
            } catch (error) {
                console.error('Failed to fetch cliff periods, continuing with empty array:', error);
                // Return empty array rather than failing the entire bond data fetch
            }

            return cliffPeriod;
        }

        const cliffPeriod = await generateCliffPeriod();

        interface StakingTier {
            threshold: string;
            multiplier: number;
        }

        async function getStakingTiers() {
            let index = 0;
            let stakingTiers: StakingTier[] = [];
            let retryCount = 0;
            const maxRetries = 3;
            const maxTiers = 10; // Reasonable limit to prevent infinite loops

            while (index < maxTiers) {
                try {
                    // Add delay between requests to avoid rate limiting
                    if (index > 0) {
                        // Exponential backoff: wait longer after each request
                        await delay(500 * Math.pow(1.5, index - 1));
                    }

                    await applyRateLimit();
                    const tier: any = await client.readContract({
                        address: bond,
                        abi: Bond,
                        functionName: 'stakingTiers',
                        args: [index]
                    });

                    if (tier) {
                        stakingTiers.push({
                            threshold: ethers.formatUnits(tier.threshold || tier["0"], 18),
                            multiplier: Number(tier.multiplier || tier["1"]) / 10000 // Convert basis points to multiplier
                        });
                        index++;
                        retryCount = 0; // Reset retry count on success
                    } else {
                        break;
                    }
                } catch (error: any) {
                    console.warn(`Error fetching staking tier ${index}:`, error.message);

                    // If we get a rate limit error, retry with exponential backoff
                    if (error.message.includes('429') && retryCount < maxRetries) {
                        retryCount++;
                        const backoffTime = 1000 * Math.pow(2, retryCount);
                        console.log(`Rate limited. Retrying in ${backoffTime}ms (attempt ${retryCount}/${maxRetries})`);
                        await delay(backoffTime);
                        continue; // Try again without incrementing index
                    }

                    // For other errors or if we've exceeded max retries, break the loop
                    break;
                }
            }

            return stakingTiers;
        }

        const stakingTiers = await getStakingTiers();

        const bondData = {
            id: bond,
            metadataURI: metadataURI.result,
            paymentToken: {
                id: paymentToken.result,
                name: paymentTokenName.result,
                symbol: paymentTokenSymbol.result,
                decimals: paymentTokenDecimals.result
            },
            saleToken: {
                id: saleToken.result,
                name: saleTokenName.result,
                symbol: saleTokenSymbol.result,
                decimals: saleTokenDecimals.result
            },
            bondType: Number(bondType.result),
            bondSize: ethers.formatUnits(bondSize.result as any, saleTokenDecimals.result as number),
            totalSold: ethers.formatUnits(totalSold.result as any, saleTokenDecimals.result as number),
            whitelistStartTime: Number(whitelistStartTime.result),
            saleStartTime: Number(saleStartTime.result),
            saleEndTime: Number(saleEndTime.result),
            withdrawTime: Number(withdrawTime.result),
            withdrawDelay: Number(withdrawDelay.result),
            linearVestingEndTime: Number(linearVestingEndTime.result),
            cliffPeriod: cliffPeriod,
            stakingTiers: stakingTiers,
            taxCollector: taxCollector.result,
            taxPercentage: Number(taxPercentage.result) / 100,
            isPrivateBond: isPrivateBond.result,
            stakingPool: stakingPool.result,
            fixedDiscountPercentage: Number(fixedDiscountPercentage.result) / 100,
            currentDiscount: Number(currentDiscount.result) / 100,
            initialDiscountPercentage: Number(initialDiscountPercentage.result) / 100,
            finalDiscountPercentage: Number(finalDiscountPercentage.result) / 100,
            whitelistCount: Number(whitelistCount.result),
            participants: Number(participants.result),
            bondAllocation: ethers.formatUnits(bondAllocation.result as any, saleTokenDecimals.result as number),
            chainId: CHAIN_ID // Add the current chain ID to the bond data
        };

        // Update cache with new data
        bondDataCache[bond] = {
            data: bondData,
            timestamp: Date.now(),
            chainId: CHAIN_ID
        };

        return bondData;
    } catch (error) {
        console.error('Error fetching bond data:', error);
        throw new Error('Failed to retrieve bond data');
    }
}

export const getAmountPaid = async (bond: `0x${string}`, walletAddress: `0x${string}`) => {
    try {
        await applyRateLimit();
        const client = getClient();
        const amountPaid = await client.readContract({
            address: bond,
            abi: Bond,
            functionName: "amountPaid",
            args: [
                walletAddress
            ]
        })

        const paymentToken = await client.readContract({
            address: bond,
            abi: Bond,
            functionName: "paymentToken"
        });

        const decimals = await client.readContract({
            address: paymentToken as `0x${string}`,
            abi: ERC20ABI,
            functionName: "decimals"
        });

        return Number(ethers.formatUnits(amountPaid as string, decimals as number));
    } catch (error: any) {
        console.error(error.message);
        throw new Error("Failed to retrieve amount paid");
    }
}

export const amountPaid = async (bond: `0x${string}`, walletAddress: `0x${string}`) => {
    try {
        const client = getClient();
        const amountPaid = await client.readContract({
            address: bond,
            abi: Bond,
            functionName: "amountPaid",
            args: [
                walletAddress
            ]
        })

        return Number(ethers.formatUnits(amountPaid as string, 18))
    } catch (error: any) {
        console.error(error.message)
        throw new Error("Failed to retrieve amount paid")
    }
}

export const getClaimableTokensAmount = async (bond: `0x${string}`, walletAddress: `0x${string}`) => {
    try {
        const client = getClient();
        const claimableTokens = await client.readContract({
            address: bond,
            abi: Bond,
            functionName: "getCurrentClaimableToken",
            args: [
                walletAddress
            ]
        });
        return Number(ethers.formatUnits(claimableTokens as string, 18));
    } catch (error: any) {
        console.error(error.message);
        throw new Error("Failed to retrieve unlocked token");
    }
}

export const getPurchasedTokensAmount = async (bond: `0x${string}`, walletAddress: `0x${string}`) => {
    try {
        await applyRateLimit();
        const client = getClient();
        const purchasedTokens = await client.readContract({
            address: bond,
            abi: Bond,
            functionName: "claimable",
            args: [
                walletAddress
            ]
        });
        return Number(ethers.formatUnits(purchasedTokens as string, 18));
    } catch (error: any) {
        console.error(error.message);
        throw new Error("Failed to retrieve purchased tokens");
    }
}

export const isUserWhitelisted = async (bond: `0x${string}`, walletAddress: `0x${string}`) => {
    try {
        await applyRateLimit();
        const client = getClient();
        const isWhitelisted = await client.readContract({
            address: bond,
            abi: Bond,
            functionName: "isWhitelisted",
            args: [
                walletAddress
            ]
        });

        return Boolean(isWhitelisted);
    } catch (error: any) {
        console.error(error.message);
        throw new Error("Failed to check whitelist status");
    }
}

export const getBondDataByProjectName = async (projectName: string) => {
    const allBonds = await getAllBondData();

    // Find the bond where the project name matches (case insensitive)
    const matchingBond = await Promise.all(allBonds.map(async (bond) => {
        if (!bond.metadataURI) return null;
        try {
            const response = await fetch(ensureRawGistURL(bond.metadataURI.toString()));
            if (!response.ok) return null;

            const metadata = await response.json() as { projectName?: string };
            if (metadata.projectName?.toLowerCase() === projectName.toLowerCase()) {
                return {
                    ...bond,
                    bondInfo: metadata
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching metadata:', error);
            return null;
        }
    }));

    // Filter out null values and return the first match
    const result = matchingBond.filter(p => p !== null);
    return result.length > 0 ? result[0] : null;
}
