import AirdropFactoryABI from "../../abis/AirdropFactory.json";
import ERC20ABI from "../../abis/ERC20.json";
import AirdropABI from "../../abis/Airdrop.json";
import { getClient } from "./client";
import { ethers } from 'ethers';
import { getContractAddress, CHAIN_ID } from '../source';
import { ensureRawGistURL } from '../tools';

export const getAllAirdropAddresses = async () => {
    try {
        const client = await getClient();
        const airdropFactoryAddress = getContractAddress('airdropFactory');
        let addressList: `0x${string}`[] = [];
        let index = 0;

        while (true) {
            try {
                const address: any = await client.readContract({
                    address: airdropFactoryAddress,
                    abi: AirdropFactoryABI,
                    functionName: "allAirdrops",
                    args: [index]
                });

                if (address) {
                    addressList.push(address);
                    index++;
                } else {
                    break;
                }
            } catch (error) {
                break;
            }
        }

        return addressList;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve created airdrops");
    }
};

export const getAllAirdropData = async () => {
    const client = await getClient();
    const allAirdrops = await getAllAirdropAddresses();

    const airdropData = await Promise.all(allAirdrops.map(async (airdrop: `0x${string}`) => {
        const airdropContract = {
            address: airdrop,
            abi: AirdropABI
        };

        const results = await client.multicall({
            contracts: [
                {
                    ...airdropContract,
                    functionName: "metadataURI"
                },
                {
                    ...airdropContract,
                    functionName: "airdropToken"
                },
                {
                    ...airdropContract,
                    functionName: "whitelistStartTime"
                },
                {
                    ...airdropContract,
                    functionName: "whitelistEndTime"
                },
                {
                    ...airdropContract,
                    functionName: "withdrawDelay"
                },
                {
                    ...airdropContract,
                    functionName: "linearVestingEndTime"
                },
                {
                    ...airdropContract,
                    functionName: "totalAvailableRewards"
                },
                {
                    ...airdropContract,
                    functionName: "totalClaimed"
                },
                {
                    ...airdropContract,
                    functionName: "tokenPerUser"
                },
                {
                    ...airdropContract,
                    functionName: "multiplier"
                },
                {
                    ...airdropContract,
                    functionName: "stakingPool"
                },
                {
                    ...airdropContract,
                    functionName: "isPrivateAirdrop"
                }
            ]
        });

        const [
            metadataURI,
            airdropToken,
            whitelistStartTime,
            whitelistEndTime,
            withdrawDelay,
            linearVestingEndTime,
            totalAvailableRewards,
            totalClaimed,
            tokenPerUser,
            multiplier,
            stakingPool,
            isPrivateAirdrop
        ] = results;

        if (!airdropToken.result) throw new Error('Invalid airdrop token address');

        const tokenData = await client.multicall({
            contracts: [
                {
                    address: airdropToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "name"
                },
                {
                    address: airdropToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "symbol"
                },
                {
                    address: airdropToken.result as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "decimals"
                }
            ]
        });

        const [tokenName, tokenSymbol, tokenDecimals] = tokenData;

        return {
            id: airdrop,
            metadataURI: metadataURI.result,
            airdropToken: {
                id: airdropToken.result,
                name: tokenName.result,
                symbol: tokenSymbol.result,
                decimals: tokenDecimals.result
            },
            whitelistStartTime: Number(whitelistStartTime.result),
            whitelistEndTime: Number(whitelistEndTime.result),
            withdrawDelay: Number(withdrawDelay.result),
            linearVestingEndTime: Number(linearVestingEndTime.result),
            totalAvailableRewards: ethers.formatUnits(totalAvailableRewards.result as string, tokenDecimals.result as number),
            totalClaimed: Number(totalClaimed.result),
            tokenPerUser: Number(tokenPerUser.result),
            multiplier: Number(multiplier.result),
            stakingPool: stakingPool.result,
            isPrivateAirdrop: isPrivateAirdrop.result,
            chainId: CHAIN_ID // Add the current chain ID
        };
    }));

    return airdropData;
};

export const getAirdropDataByAddress = async (airdrop: `0x${string}`) => {
    const client = await getClient();
    const airdropContract = {
        address: airdrop,
        abi: AirdropABI
    };

    const results = await client.multicall({
        contracts: [
            {
                ...airdropContract,
                functionName: "metadataURI"
            },
            {
                ...airdropContract,
                functionName: "airdropToken"
            },
            {
                ...airdropContract,
                functionName: "whitelistStartTime"
            },
            {
                ...airdropContract,
                functionName: "whitelistEndTime"
            },
            {
                ...airdropContract,
                functionName: "withdrawDelay"
            },
            {
                ...airdropContract,
                functionName: "linearVestingEndTime"
            },
            {
                ...airdropContract,
                functionName: "totalAvailableRewards"
            },
            {
                ...airdropContract,
                functionName: "totalClaimed"
            },
            {
                ...airdropContract,
                functionName: "tokenPerUser"
            },
            {
                ...airdropContract,
                functionName: "multiplier"
            },
            {
                ...airdropContract,
                functionName: "stakingPool"
            },
            {
                ...airdropContract,
                functionName: "isPrivateAirdrop"
            }
        ]
    });

    const [
        metadataURI,
        airdropToken,
        whitelistStartTime,
        whitelistEndTime,
        withdrawDelay,
        linearVestingEndTime,
        totalAvailableRewards,
        totalClaimed,
        tokenPerUser,
        multiplier,
        stakingPool,
        isPrivateAirdrop
    ] = results;

    if (!airdropToken.result) throw new Error('Invalid airdrop token address');

    const tokenData = await client.multicall({
        contracts: [
            {
                address: airdropToken.result as `0x${string}`,
                abi: ERC20ABI,
                functionName: "name"
            },
            {
                address: airdropToken.result as `0x${string}`,
                abi: ERC20ABI,
                functionName: "symbol"
            },
            {
                address: airdropToken.result as `0x${string}`,
                abi: ERC20ABI,
                functionName: "decimals"
            }
        ]
    })

    const [
        tokenName,
        tokenSymbol,
        tokenDecimals
    ] = tokenData;

    interface Period {
        claimTime: number;
        percentage: number;
    }

    async function generateCliffPeriod() {
        let index = 0;
        let cliffPeriod: Period[] = [];
        while (true) {
            try {
                const currentPeriod: any = await client.readContract({
                    address: airdrop,
                    abi: AirdropABI,
                    functionName: 'cliffPeriod',
                    args: [index]
                });

                if (currentPeriod) {
                    cliffPeriod.push({
                        claimTime: Number(currentPeriod.claimTime),
                        percentage: Number(currentPeriod.percentage)
                    });
                    index++;
                } else {
                    break;
                }
            } catch (error) {
                break;
            }
        }
        return cliffPeriod;
    }

    const cliffPeriod = await generateCliffPeriod();

    return {
        id: airdrop,
        metadataURI: metadataURI.result,
        airdropToken: {
            id: airdropToken.result,
            name: tokenName,
            symbol: tokenSymbol,
            decimals: tokenDecimals
        },
        whitelistStartTime: Number(whitelistStartTime.result),
        whitelistEndTime: Number(whitelistEndTime.result),
        withdrawDelay: Number(withdrawDelay.result),
        linearVestingEndTime: Number(linearVestingEndTime.result),
        totalAvailableRewards: ethers.formatUnits(totalAvailableRewards.result as string, tokenDecimals.result as number),
        totalClaimed: Number(totalClaimed.result),
        tokenPerUser: Number(tokenPerUser.result),
        multiplier: Number(multiplier.result),
        stakingPool: stakingPool.result,
        isPrivateAirdrop: isPrivateAirdrop.result,
        cliffPeriod,
        chainId: CHAIN_ID // Add the current chain ID
    };
};

export const getClaimableTokens = async (airdrop: `0x${string}`, walletAddress: `0x${string}`) => {
    try {
        const client = await getClient();
        const claimableAmount = await client.readContract({
            address: airdrop,
            abi: AirdropABI,
            functionName: "getCurrentClaimableToken",
            args: [walletAddress]
        });

        return Number(claimableAmount);
    } catch (error: any) {
        console.error(error.message);
        throw new Error("Failed to retrieve claimable amount");
    }
};

export const getGiveawayByProjectName = async (projectName: string) => {
    const allGiveaways = await getAllAirdropData();
    const matchingGiveaway = await Promise.all(allGiveaways.map(async (giveaway) => {
        if (!giveaway.metadataURI) return null;
        try {
            const response = await fetch(ensureRawGistURL(giveaway.metadataURI.toString()));
            if (!response.ok) return null;
            const metadata = await response.json() as { projectName?: string };
            if (metadata.projectName?.toLowerCase() === projectName.toLowerCase()) {
                return {
                    ...giveaway,
                    giveawayInfo: metadata
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching metadata:', error);
            return null;
        }
    }));

    // Filter out null values and return the first match
    const result = matchingGiveaway.filter(g => g !== null);
    return result.length > 0 ? result[0] : null;
}


export const isWhitelisted = async (airdrop: `0x${string}`, walletAddress: `0x${string}`) => {
    try {
        const client = await getClient();
        const isWhitelisted = await client.readContract({
            address: airdrop,
            abi: AirdropABI,
            functionName: "isWhitelisted",
            args: [
                walletAddress
            ]
        })

        return isWhitelisted as boolean
    } catch (error: any) {
        console.error("Error checking whitelist status:", error.message);
        return false
    }
}

