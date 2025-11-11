import stakingPoolActionsABI from "../../abis/StakingPoolActions.json"
import stakingPoolABI from "../../abis/StakingPool.json"
import votingSlotFactory from "../../abis/VotingSlotFactory.json";
import votingSlotABI from "../../abis/VotingSlot.json";
import ERC20ABI from "../../abis/ERC20.json";
import { getClient } from "./client";
import { ethers } from 'ethers';
import { createWalletClient, custom, WalletClient } from 'viem';
import { baseSepolia } from 'viem/chains';
import { getContractAddress } from '../source';

// Window.ethereum is now declared in src/types/ethereum.d.ts

export const createViemWalletClient = async (): Promise<WalletClient> => {
    if (!window.ethereum) {
        throw new Error('No ethereum provider found');
    }

    // Get the current chain from the public client
    const client = await getClient();

    const walletClient = createWalletClient({
        chain: client.chain,
        transport: custom(window.ethereum as any)
    });

    return walletClient;
};

export const isValidERC20 = async (tokenAddress: string): Promise<boolean> => {
    try {
        // Check if the address is valid
        if (!tokenAddress || tokenAddress.length !== 42 || !tokenAddress.startsWith('0x')) {
            return false;
        }

        const client = await getClient();

        // Try to read basic ERC20 functions
        await Promise.all([
            client.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20ABI,
                functionName: 'name'
            }),
            client.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20ABI,
                functionName: 'symbol'
            }),
            client.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20ABI,
                functionName: 'decimals'
            })
        ]);

        return true;
    } catch (error) {
        console.error('Invalid ERC20 token:', error);
        return false;
    }
};

export const getTokenSymbol = async (tokenAddress: `0x${string}`) => {
    try {
        const client = await getClient();
        const symbol = await client.readContract({
            address: tokenAddress,
            abi: ERC20ABI,
            functionName: "symbol"
        })

        return symbol;
    } catch (error: any) {
        console.error(error.message)
        throw new Error("Invalid ERC20 token");
    }
}

export const getTokenDecimals = async (tokenAddress: `0x${string}`) => {
    try {
        const client = await getClient();
        const decimals = await client.readContract({
            address: tokenAddress,
            abi: ERC20ABI,
            functionName: "decimals"
        })

        return decimals as number;
    } catch (error: any) {
        console.error(error.message)
        throw new Error("Invalid ERC20 token");
    }
}

export const getTokenBalance = async (
    tokenAddress: `0x${string}`,
    walletAddress: `0x${string}`
): Promise<string> => {
    try {
        const client = await getClient();
        const balance = await client.readContract({
            address: tokenAddress,
            abi: ERC20ABI,
            functionName: 'balanceOf',
            args: [walletAddress]
        });

        const decimals = await client.readContract({
            address: tokenAddress,
            abi: ERC20ABI,
            functionName: 'decimals'
        });

        return (Number(balance) / Math.pow(10, Number(decimals))).toString();
    } catch (error) {
        console.error('Error getting token balance:', error);
        throw new Error('Failed to get token balance');
    }
};

export const getTokenAllowance = async (tokenAddress: `0x${string}`, spenderAddress: `0x${string}`, userWallet: `0x${string}`) => {
    try {
        const client = await getClient();
        const allowance = await client.readContract({
            address: tokenAddress,
            abi: ERC20ABI,
            functionName: "allowance",
            args: [
                userWallet,
                spenderAddress
            ]
        })

        const decimals = await client.readContract({
            address: tokenAddress,
            abi: ERC20ABI,
            functionName: "decimals"
        })


        return ethers.formatUnits(allowance as string, decimals as number);
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retreive allowance")
    }
}

export const getTotalSupply = async (tokenAddress: `0x${string}`) => {
    try {
        const client = await getClient();
        const totalSupply = await client.readContract({
            address: tokenAddress,
            abi: ERC20ABI,
            functionName: "totalSupply"
        })

        const decimals = await client.readContract({
            address: tokenAddress,
            abi: ERC20ABI,
            functionName: "decimals"
        })

        return ethers.formatUnits(totalSupply as string, decimals as number);
    } catch (error) {
        console.error(error)
        throw new Error("Failed to retrieve total supply")
    }
}

export const getStakingPoolFactoryFee = async () => {
    try {
        const client = await getClient();
        const fee = await client.readContract({
            address: getContractAddress("stakingPoolFactory"),
            abi: stakingPoolActionsABI,
            functionName: "fee"
        })

        return fee as string;
    } catch (error: any) {
        console.error(error.message)
        throw new Error("Invalid Staking Pool Factory ");
    }
}

export const getAmountStaked = async (CA: `0x${string}`, userAddress: `0x${string}`) => {
    try {
        // Get Stake Token
        const client = await getClient();
        const stakeTokenAddress = await client.readContract({
            address: CA,
            abi: stakingPoolABI,
            functionName: "token0"
        })

        if (!stakeTokenAddress) {
            throw new Error("failed to retrieve stake token address")
        }

        // Get Token Decimals
        const decimals = await client.readContract({
            address: stakeTokenAddress as `0x${string}`,
            abi: ERC20ABI,
            functionName: "decimals"
        })

        // Get Amount Staked
        const amountStaked = await client.readContract({
            address: CA,
            abi: stakingPoolABI,
            functionName: "staked",
            args: [userAddress]
        })

        return ethers.formatUnits(amountStaked as string, decimals as number);
    } catch (error: any) {
        console.error(error);
        throw new Error("failed to retrieve stake amount")
    }
}

export const calculateStakeRewards = async (CA: `0x${string}`, userAddress: `0x${string}`) => {
    try {
        const client = await getClient();
        // Get Reward Token
        const rewardTokenAddress = await client.readContract({
            address: CA,
            abi: stakingPoolABI,
            functionName: "token1"
        })

        if (!rewardTokenAddress) {
            throw new Error("failed to retrieve reward token address")
        }
        // Get Token Decimals
        const decimals = await client.readContract({
            address: rewardTokenAddress as `0x${string}`,
            abi: ERC20ABI,
            functionName: "decimals"
        })

        // Get Rewards
        const calculatedRewards = await client.readContract({
            address: CA,
            abi: stakingPoolABI,
            functionName: "calculateReward",
            args: [userAddress]
        })

        return ethers.formatUnits(calculatedRewards as string, decimals as number);
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve stake rewards")
    }
}

export const getStakingPoolRewardsAmount = async (stakingPoolAddress: `0x${string}`, userAddress: `0x${string}`) => {
    try {
        const client = await getClient();
        const rewards = await client.readContract({
            address: stakingPoolAddress,    
            abi: stakingPoolABI,
            functionName: "calculateReward",
            args: [userAddress]
        })

        const token1 = await client.readContract({
            address: stakingPoolAddress,
            abi: stakingPoolABI,
            functionName: "token1"
        })

        // Get Token Decimals
        const decimals = await client.readContract({
            address: token1 as `0x${string}`,
            abi: ERC20ABI,
            functionName: "decimals"
        })

        return ethers.formatUnits(rewards as string, decimals as number);
    } catch (error) {
        console.error(error);
        throw new Error("failed to retrieve rewards amount")
    }
}



export const getNextRewardWithdrawTime = async (stakingPoolAddress: `0x${string}`, userAddress: `0x${string}`) => {
    try {        
        const client = await getClient();
        const nextRewardTime = await client.readContract({
            address: stakingPoolAddress,
            abi: stakingPoolABI,
            functionName: "getNextWithdrawalTime",
            args: [userAddress]
        })

        return nextRewardTime as number
    } catch (error: any) {
        console.error(error);
        throw new Error("Failed to retrieve next reward time")
    }
}

export const getLastStakeTime = async (stakingPoolAddress: `0x${string}`, userAddress: `0x${string}`) => {
    try {
        const client = await getClient();
        const lastStakeTime = await client.readContract({
            address: stakingPoolAddress,
            abi: stakingPoolABI,
            functionName: "lastStakeTime",
            args: [userAddress]
        })

        return lastStakeTime as number
    } catch (error: any) {
        console.error(error);
        throw new Error("Failed to retrieve next reward time")
    }
}

export const getStakingPoolPauseStatus = async (CA: `0x${string}`) => {
    try { 
        const client = await getClient();
        const pauseStatus = await client.readContract({
            address: CA,
            abi: stakingPoolABI,
            functionName: "paused"
        })

        return pauseStatus as boolean;
    } catch (error: any) {
        console.error(error);
        throw new Error("Failed to get staking pool paused state")
    }
}

export const getStakingPoolOwner = async (CA: `0x${string}`) => {
    try {
        const client = await getClient();
        const owner = await client.readContract({
            address: CA,
            abi: stakingPoolABI,
            functionName: "owner"
        })

        return owner as string;
    } catch (error: any) {
        console.error(error);
        throw new Error("Failed to get staking pool paused state")
    }
}

export const getStakingPower = async (pools: any[], userAddress: `0x${string}`) => {
    try {
        let totalAmountStaked = 0;

        for (var i = 0; i < pools.length; i++) {
            const staked = await getAmountStaked(pools[i].id, userAddress);
            totalAmountStaked += Number(staked);
        }

        return totalAmountStaked;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to calculate total staking power")
    }
}

export const getTotalRewards = async (pools: any[], userAddress: `0x${string}`) => {
    try {
        let totalRewards = 0;

        for (var i = 0; i < pools.length; i++) {
            const reward = await calculateStakeRewards(pools[i].id, userAddress);
            totalRewards += Number(reward);
        }

        return totalRewards;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to calculate total rewards")
    }
}

export const getParticipatedStakingPool = async (pools: any[], userAddress: `0x${string}`) => {
    try {
        let stakedPools: any = [];

        for (var i = 0; i < pools.length; i++) {
            const staked = await getAmountStaked(pools[i].id, userAddress);
            if (Number(staked) > 0) {
                stakedPools.push(pools[i]);
            }
        }


        return stakedPools;
    } catch (error) {
        console.error(error);

        throw new Error("get participated pools")
    }
}


// Get Voting Pool Addresses
export const getAllVotingPoolAddresses = async () => {
    // Testnet Voting Factory
    const votingPoolFactory = '0xDEb50f80349B5159D058e666134E611C99006b3a'
    try {
        const client = await getClient();
        let addressList: `0x${string}`[] = []
        let index = 0

        while (true) {
            try {
                const address: any = await client.readContract({
                    address: votingPoolFactory,
                    abi: votingSlotFactory,
                    functionName: "allSlots",
                    args: [index]
                })

                // If we get a valid address, add it to the list
                if (address) {
                    addressList.push(address)
                    index++
                } else {
                    // If we get a null/undefined address, stop
                    break
                }
            } catch (error) {
                // If we get an error, stop the loop
                break
            }
        }

        return addressList
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve created voting pools")
    }
}


export const getVotingSlotData = async () => {
    const allSlots = await getAllVotingPoolAddresses();
    const client = await getClient();

    const votingSlotData = await Promise.all(allSlots.map(async (slot) => {
        const slotContract = {
            address: slot,
            abi: votingSlotABI
        };

        const results = await client.multicall({
            contracts: [
                { ...slotContract, functionName: "name" },
                { ...slotContract, functionName: "image" },
                { ...slotContract, functionName: "description" },
                { ...slotContract, functionName: "voteStartDate" },
                { ...slotContract, functionName: "voteEndDate" },
                { ...slotContract, functionName: "negativeVoteWeight" },
                { ...slotContract, functionName: "positiveVoteWeight" }
            ]
        });

        const [
            name,
            image,
            description,
            voteStartDate,
            voteEndDate,
            negativeVoteWeight,
            positiveVoteWeight
        ] = results;

        return {
            id: slot,
            contractAddress: slot,
            name: name.result,
            image: image.result,
            description: description.result,
            voteStartDate: Number(voteStartDate.result?.toString() || '0'),
            voteEndDate: Number(voteEndDate.result?.toString() || '0'),
            negativeVoteWeight: Number(negativeVoteWeight.result?.toString() || '0'),
            positiveVoteWeight: Number(positiveVoteWeight.result?.toString() || '0')
        };
    }));

    return votingSlotData;
};

export const getVotingSlotByID = async (votingSlotAddress: `0x${string}`) => {
    const client = await getClient();
    const slotContract = {
        address: votingSlotAddress,
        abi: votingSlotABI
    };

    const results = await client.multicall({
        contracts: [
            { ...slotContract, functionName: "name" },
            { ...slotContract, functionName: "image" },
            { ...slotContract, functionName: "description" },
            { ...slotContract, functionName: "voteStartDate" },
            { ...slotContract, functionName: "voteEndDate" },
            { ...slotContract, functionName: "negativeVoteWeight" },
            { ...slotContract, functionName: "positiveVoteWeight" }
        ]
    });

    const [
        name,
        image,
        description,
        voteStartDate,
        voteEndDate,
        negativeVoteWeight,
        positiveVoteWeight
    ] = results;

    return {
        id: votingSlotAddress,
        contractAddress: votingSlotAddress,
        name: name.result,
        image: image.result,
        description: description.result,
        voteStartDate: Number(voteStartDate.result?.toString() || '0'),
        voteEndDate: Number(voteEndDate.result?.toString() || '0'),
        negativeVoteWeight: Number(negativeVoteWeight.result?.toString() || '0'),
        positiveVoteWeight: Number(positiveVoteWeight.result?.toString() || '0')
    };
};

export const getAllStakingPoolAddress = async () => {
    const stakingPoolFactory = getContractAddress("stakingPoolFactory");
    const client = await getClient();

    try {
        let addressList: `0x${string}`[] = []
        let index = 0

        while (true) {
            try {
                const address: any = await client.readContract({
                    address: stakingPoolFactory,
                    abi: stakingPoolActionsABI,
                    functionName: "allPools",
                    args: [index]
                })

                // If we get a valid address, add it to the list
                if (address) {
                    addressList.push(address)
                    index++
                } else {
                    // If we get a null/undefined address, stop
                    break
                }
            } catch (error) {
                // If we get an error, stop the loop
                break
            }
        }

        return addressList
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve created staking pools")
    }
}


export const getAllStakingPoolData = async () => {
    try {
        const allPools = await getAllStakingPoolAddress();
        const client = await getClient();

        const stakingPoolData = await Promise.all(allPools.map(async (pool: `0x${string}`) => {
            const poolContract = {
                address: pool,
                abi: stakingPoolABI
            };

            const results = await client.multicall({
                contracts: [
                    { ...poolContract, functionName: "apyRate" },
                    { ...poolContract, functionName: "withdrawalIntervals" },
                    { ...poolContract, functionName: "stakeFeePercentage" },
                    { ...poolContract, functionName: "withdrawalFeePercentage" },
                    { ...poolContract, functionName: "token0" },
                    { ...poolContract, functionName: "token1" },
                    { ...poolContract, functionName: "totalStaked" },
                    { ...poolContract, functionName: "totalRewardable" },
                    { ...poolContract, functionName: "feeReceiver" }
                ]
            });

            const [
                apyRate,
                withdrawalIntervals,
                stakeFeePercentage,
                withdrawalFeePercentage,
                stakeToken,
                rewardToken,
                totalStaked,
                totalRewardable,
                feeReceiver
            ] = results;

            if (!stakeToken.result || !rewardToken.result) {
                throw new Error('Invalid token addresses');
            }

            const tokenResults = await client.multicall({
                contracts: [
                    {
                        address: stakeToken.result as `0x${string}`,
                        abi: ERC20ABI,
                        functionName: "name"
                    },
                    {
                        address: stakeToken.result as `0x${string}`,
                        abi: ERC20ABI,
                        functionName: "symbol"
                    },
                    {
                        address: stakeToken.result as `0x${string}`,
                        abi: ERC20ABI,
                        functionName: "decimals"
                    },
                    {
                        address: rewardToken.result as `0x${string}`,
                        abi: ERC20ABI,
                        functionName: "name"
                    },
                    {
                        address: rewardToken.result as `0x${string}`,
                        abi: ERC20ABI,
                        functionName: "symbol"
                    },
                    {
                        address: rewardToken.result as `0x${string}`,
                        abi: ERC20ABI,
                        functionName: "decimals"
                    }
                ]
            });

            const [
                stakeTokenName,
                stakeTokenSymbol,
                stakeTokenDecimals,
                rewardTokenName,
                rewardTokenSymbol,
                rewardTokenDecimals
            ] = tokenResults;

            return {
                id: pool,
                apyRate: Number(apyRate.result) / 1e4,
                withdrawalIntervals: Number(withdrawalIntervals.result),
                stakeFeePercentage: Number(stakeFeePercentage.result) * 100 / 1e4,
                withdrawalFeePercentage: Number(withdrawalFeePercentage.result) * 100 / 1e4,
                stakeToken: {
                    id: stakeToken.result,
                    name: stakeTokenName.result,
                    symbol: stakeTokenSymbol.result,
                    decimals: stakeTokenDecimals.result
                },
                rewardToken: {
                    id: rewardToken.result,
                    name: rewardTokenName.result,
                    symbol: rewardTokenSymbol.result,
                    decimals: rewardTokenDecimals.result
                },
                totalStaked: ethers.formatUnits(totalStaked.result as string, stakeTokenDecimals.result as number),
                totalRewardable: ethers.formatUnits(totalRewardable.result as string, rewardTokenDecimals.result as number),
                feeReceiver: feeReceiver.result
            };
        }));

        return stakingPoolData;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve staking pool data");
    }
}

export const getStakingPoolDataByAddress = async (stakingPool: `0x${string}`) => {
    const poolContract = {
        address: stakingPool,
        abi: stakingPoolABI
    };
    const client = await getClient();

    const results = await client.multicall({
        contracts: [
            { ...poolContract, functionName: "apyRate" },
            { ...poolContract, functionName: "withdrawalIntervals" },
            { ...poolContract, functionName: "stakeFeePercentage" },
            { ...poolContract, functionName: "withdrawalFeePercentage" },
            { ...poolContract, functionName: "token0" },
            { ...poolContract, functionName: "token1" },
            { ...poolContract, functionName: "totalStaked" },
            { ...poolContract, functionName: "totalRewardable" },
            { ...poolContract, functionName: "feeReceiver" }
        ]
    });

    const [
        apyRate,
        withdrawalIntervals,
        stakeFeePercentage,
        withdrawalFeePercentage,
        stakeToken,
        rewardToken,
        totalStaked,
        totalRewardable,
        feeReceiver
    ] = results;

    if (!stakeToken.result || !rewardToken.result) {
        throw new Error('Invalid token addresses');
    }

    const tokenResults = await client.multicall({
        contracts: [
            {
                address: stakeToken.result as `0x${string}`,
                abi: ERC20ABI,
                functionName: "name"
            },
            {
                address: stakeToken.result as `0x${string}`,
                abi: ERC20ABI,
                functionName: "symbol"
            },
            {
                address: stakeToken.result as `0x${string}`,
                abi: ERC20ABI,
                functionName: "decimals"
            },
            {
                address: rewardToken.result as `0x${string}`,
                abi: ERC20ABI,
                functionName: "name"
            },
            {
                address: rewardToken.result as `0x${string}`,
                abi: ERC20ABI,
                functionName: "symbol"
            },
            {
                address: rewardToken.result as `0x${string}`,
                abi: ERC20ABI,
                functionName: "decimals"
            }
        ]
    });

    const [
        stakeTokenName,
        stakeTokenSymbol,
        stakeTokenDecimals,
        rewardTokenName,
        rewardTokenSymbol,
        rewardTokenDecimals
    ] = tokenResults;

    return {
        stakingPool: {
            id: stakingPool,
            apyRate: Number(apyRate.result) / 1e4,
            withdrawalIntervals: Number(withdrawalIntervals.result),
            stakeFeePercentage: Number(stakeFeePercentage.result) * 100 / 1e4,
            withdrawalFeePercentage: Number(withdrawalFeePercentage.result) * 100 / 1e4,
            stakeToken: {
                id: stakeToken.result,
                name: stakeTokenName.result,
                symbol: stakeTokenSymbol.result,
                decimals: stakeTokenDecimals.result
            },
            rewardToken: {
                id: rewardToken.result,
                name: rewardTokenName.result,
                symbol: rewardTokenSymbol.result,
                decimals: rewardTokenDecimals.result
            },
            totalStaked: ethers.formatUnits(totalStaked.result as string, stakeTokenDecimals.result as number),
            totalRewardable: ethers.formatUnits(totalRewardable.result as string, rewardTokenDecimals.result as number),
            feeReceiver: feeReceiver.result
        }
    };
};