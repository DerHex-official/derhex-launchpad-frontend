import { useEffect, useState } from "react";
import { Preloader, Oval } from 'react-preloader-icon';
import { getStakingPoolDataByAddress } from "../../../utils/web3/actions";
import { createWalletClient, custom } from "viem";
import stakingPoolAbi from "../../../abis/StakingPool.json";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { getTokenBalance, getTokenAllowance } from "../../../utils/web3/actions";
import erc20Abi from "../../../abis/ERC20.json";
import { useChain, supportedChains } from '../../../context/ChainContext';

interface ManageStakingProps {
    stakingPoolAddress: `0x${string}`;
    onClose: () => void;
    userAddress: `0x${string}`;
    refetch: () => void;
}

const createViemWalletClient = (chainId?: string) => {
    if (!chainId) {
        console.error('No chainId provided to createViemWalletClient');
        return createWalletClient({
            transport: custom(window.ethereum as any)
        });
    }

    // Get the chain configuration from supportedChains
    const chainConfig = supportedChains[chainId as keyof typeof supportedChains];
    if (!chainConfig) {
        console.error(`Chain ID ${chainId} not supported`);
        return createWalletClient({
            transport: custom(window.ethereum as any)
        });
    }

    console.log(`Creating wallet client for chain ${chainConfig.name} (${chainId})`);
    return createWalletClient({
        chain: chainConfig.viemChain,
        transport: custom(window.ethereum as any)
    });
};

export default function ManageStaking({ stakingPoolAddress, onClose, userAddress, refetch }: ManageStakingProps) {
    const [loading, setLoading] = useState(true);
    const [poolData, setPoolData] = useState<any>(null);
    const [rewardAmount, setRewardAmount] = useState<string>("0");
    const [newFeeReceiver, setNewFeeReceiver] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);

    // We don't need the user object from usePrivy() here
    const { publicClient, selectedChain } = useChain();

    // Helper function to get the chain name
    const getChainName = () => {
        return selectedChain === "84532" ? "Base Sepolia" :
            selectedChain === "57054" ? "Sonic" : "Rise";
    };

    // Log when the selected chain changes
    useEffect(() => {
        console.log(`ManageStaking: Chain changed to ${getChainName()} (${selectedChain})`);
    }, [selectedChain]);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getStakingPoolDataByAddress(stakingPoolAddress);
                setPoolData(data);
            } catch (error) {
                console.error("Failed to fetch staking pool data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [stakingPoolAddress]);


    const handleAddReward = async () => {
        setIsProcessing(true);
        console.log(`Adding rewards on chain ${getChainName()} (${selectedChain})`);

        try {
            const walletClient = createViemWalletClient(selectedChain);
            const [account] = await walletClient.getAddresses();

            // Make sure wallet is on the correct chain
            try {
                if (window.ethereum && window.ethereum.chainId !== selectedChain) {
                    console.log(`Switching wallet to chain ${getChainName()} (${selectedChain})`);
                    await (window.ethereum as any).request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${parseInt(selectedChain).toString(16)}` }],
                    });
                }
            } catch (error) {
                console.error(`Error switching chain: ${error}`);
                toast.error(`Failed to switch to ${getChainName()} chain. Please switch manually.`);
                setIsProcessing(false);
                return;
            }

            const tokenBalance = await getTokenBalance(poolData.stakingPool.rewardToken.id, userAddress);
            const amount = ethers.parseUnits(rewardAmount, poolData.stakingPool.rewardToken.decimals);

            if (Number(rewardAmount) > Number(tokenBalance)) {
                toast.error("Not enough balance");
                setIsProcessing(false);
                return;
            }

            // Check and approve allowance
            const allowance = await getTokenAllowance(
                poolData.stakingPool.rewardToken.id,
                stakingPoolAddress,
                userAddress
            );

            async function callAllowance() {
                if (Number(allowance) < Number(amount)) {
                    console.log(`Approving token spending on chain ${getChainName()}`);
                    // Approve token spending
                    const { request: approveRequest } = await publicClient.simulateContract({
                        address: poolData.stakingPool.rewardToken.id,
                        abi: erc20Abi,
                        account,
                        functionName: "approve",
                        args: [stakingPoolAddress, amount]
                    });

                    const approveHash = await walletClient.writeContract(approveRequest);
                    console.log(`Approval transaction submitted with hash: ${approveHash}`);
                    const receipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
                    console.log(`Approval confirmed on chain ${getChainName()}`);
                    return receipt;
                }
            }

            const receipt = await callAllowance();

            if (receipt.status === "success") {
                console.log(`Approval confirmed on chain ${getChainName()}`);

                console.log(`Adding reward on chain ${getChainName()}`);

                const { request } = await publicClient.simulateContract({
                    address: stakingPoolAddress,
                    abi: stakingPoolAbi,
                    account,
                    functionName: "addReward",
                    args: [amount]
                });

                const hash = await walletClient.writeContract(request);

                console.log(`Transaction submitted with hash: ${hash} on chain ${getChainName()}`);
                const rewardAddTxReceipt = await publicClient.waitForTransactionReceipt({ hash });
                if (rewardAddTxReceipt.status === "success") {
                    console.log(`Transaction confirmed on chain ${getChainName()}`);
                    toast.success("Rewards added successfully!");
                    refetch(); // Call refetch without await since it doesn't return a promise
                }
            }
        } catch (error: any) {
            console.error(`Error adding rewards on chain ${getChainName()}:`, error);
            if (error.message?.includes("User rejected the request")) {
                toast.error("User rejected the request");
            } else if (error.message?.includes("network disconnected") || error.message?.includes("network error")) {
                toast.error(`Network error on ${getChainName()} Testnet. Please try again later.`);
            } else if (error.message?.includes("contract not deployed")) {
                toast.error(`Contract not deployed on ${getChainName()} Testnet. Please switch to a supported chain.`);
            } else {
                toast.error("Failed to add rewards");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrainRewards = async () => {
        setIsProcessing(true);
        console.log(`Draining rewards on chain ${getChainName()} (${selectedChain})`);

        try {
            const walletClient = createViemWalletClient(selectedChain);
            const [account] = await walletClient.getAddresses();

            // Make sure wallet is on the correct chain
            try {
                if (window.ethereum && window.ethereum.chainId !== selectedChain) {
                    console.log(`Switching wallet to chain ${getChainName()} (${selectedChain})`);
                    await (window.ethereum as any).request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${parseInt(selectedChain).toString(16)}` }],
                    });
                }
            } catch (error) {
                console.error(`Error switching chain: ${error}`);
                toast.error(`Failed to switch to ${getChainName()} chain. Please switch manually.`);
                setIsProcessing(false);
                return;
            }

            const rewardTokenAmount = await getTokenBalance(poolData.stakingPool.rewardToken.id, poolData.stakingPool.id);
            const rewardTokenEther = ethers.parseUnits(rewardTokenAmount, poolData.stakingPool.rewardToken.decimals);

            console.log(`Draining ${rewardTokenAmount} ${poolData.stakingPool.rewardToken.symbol} on chain ${getChainName()}`);
            const { request } = await publicClient.simulateContract({
                address: stakingPoolAddress,
                abi: stakingPoolAbi,
                account,
                functionName: "drainReward",
                args: [rewardTokenEther, userAddress]
            });

            const hash = await walletClient.writeContract(request);
            console.log(`Transaction submitted with hash: ${hash} on chain ${getChainName()}`);
            await publicClient.waitForTransactionReceipt({ hash });
            console.log(`Transaction confirmed on chain ${getChainName()}`);
            toast.success("Rewards drained successfully!");
            refetch(); // Call refetch without await since it doesn't return a promise
        } catch (error: any) {
            console.error(`Error draining rewards on chain ${getChainName()}:`, error);
            if (error.message?.includes("User rejected the request")) {
                toast.error("User rejected the request");
            } else if (error.message?.includes("network disconnected") || error.message?.includes("network error")) {
                toast.error(`Network error on ${getChainName()} Testnet. Please try again later.`);
            } else if (error.message?.includes("contract not deployed")) {
                toast.error(`Contract not deployed on ${getChainName()} Testnet. Please switch to a supported chain.`);
            } else {
                toast.error("Failed to drain rewards");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateFeeReceiver = async () => {
        setIsProcessing(true);
        console.log(`Updating fee receiver on chain ${getChainName()} (${selectedChain})`);

        try {
            const walletClient = createViemWalletClient(selectedChain);
            const [account] = await walletClient.getAddresses();

            // Make sure wallet is on the correct chain
            try {
                if (window.ethereum && window.ethereum.chainId !== selectedChain) {
                    console.log(`Switching wallet to chain ${getChainName()} (${selectedChain})`);
                    await (window.ethereum as any).request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${parseInt(selectedChain).toString(16)}` }],
                    });
                }
            } catch (error) {
                console.error(`Error switching chain: ${error}`);
                toast.error(`Failed to switch to ${getChainName()} chain. Please switch manually.`);
                setIsProcessing(false);
                return;
            }

            if (!ethers.isAddress(newFeeReceiver)) {
                toast.error("Invalid address format");
                setIsProcessing(false);
                return;
            }

            console.log(`Setting fee receiver to ${newFeeReceiver} on chain ${getChainName()}`);
            const { request } = await publicClient.simulateContract({
                address: stakingPoolAddress,
                abi: stakingPoolAbi,
                account,
                functionName: "setTaxRecipient",
                args: [newFeeReceiver]
            });

            const hash = await walletClient.writeContract(request);
            console.log(`Transaction submitted with hash: ${hash} on chain ${getChainName()}`);
            await publicClient.waitForTransactionReceipt({ hash });
            console.log(`Transaction confirmed on chain ${getChainName()}`);
            toast.success("Fee receiver updated successfully!");
            refetch(); // Call refetch without await since it doesn't return a promise
        } catch (error: any) {
            console.error(`Error updating fee receiver on chain ${getChainName()}:`, error);
            if (error.message?.includes("User rejected the request")) {
                toast.error("User rejected the request");
            } else if (error.message?.includes("network disconnected") || error.message?.includes("network error")) {
                toast.error(`Network error on ${getChainName()} Testnet. Please try again later.`);
            } else if (error.message?.includes("contract not deployed")) {
                toast.error(`Contract not deployed on ${getChainName()} Testnet. Please switch to a supported chain.`);
            } else {
                toast.error("Failed to update fee receiver");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <Preloader
                    use={Oval}
                    size={60}
                    strokeWidth={8}
                    strokeColor="#FFF"
                    duration={800}
                />
            </div>
        );
    }

    if (!poolData) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-[#17043B] border border-primary/50 rounded-2xl w-full max-w-md p-6">
                    <h2 className="text-white text-2xl font-bold mb-6 text-center">Error Loading Data</h2>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 text-[#C4C4C4] hover:text-white rounded-lg hover:bg-white/5 transition-colors duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-[#17043B] border border-primary/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-white text-2xl font-bold mb-2">Staking Pool Management</h2>
                        <div className="inline-flex items-center gap-2 bg-[#291254] px-4 py-2 rounded-full">
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            <span className="text-sm font-medium">
                                {getChainName()} Testnet
                            </span>
                        </div>
                    </div>

                    {/* Pool Details Section */}
                    <div className="space-y-4 mb-8">
                        <div className="bg-[#291254]/80 p-4 rounded-xl border border-primary/20">
                            <p className="text-[#C4C4C4] text-sm mb-1">Staking Token:</p>
                            <p className="text-white text-xl font-bold">
                                {poolData.stakingPool.stakeToken.name} ({poolData.stakingPool.stakeToken.symbol})
                            </p>
                        </div>

                        <div className="bg-[#291254]/80 p-4 rounded-xl border border-primary/20">
                            <p className="text-[#C4C4C4] text-sm mb-1">Reward Token:</p>
                            <p className="text-white text-xl font-bold">
                                {poolData.stakingPool.rewardToken.name} ({poolData.stakingPool.rewardToken.symbol})
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-white bg-[#291254]/50 p-4 rounded-xl border border-primary/10">
                            <div>
                                <p className="text-[#C4C4C4] text-sm">APY Rate</p>
                                <p className="font-medium">{poolData.stakingPool.apyRate}%</p>
                            </div>
                            <div>
                                <p className="text-[#C4C4C4] text-sm">Total Staked</p>
                                <p className="font-medium">{poolData.stakingPool.totalStaked}</p>
                            </div>
                            <div>
                                <p className="text-[#C4C4C4] text-sm">Stake Fee</p>
                                <p className="font-medium">{poolData.stakingPool.stakeFeePercentage}%</p>
                            </div>
                            <div>
                                <p className="text-[#C4C4C4] text-sm">Withdrawal Fee</p>
                                <p className="font-medium">{poolData.stakingPool.withdrawalFeePercentage}%</p>
                            </div>
                            <div>
                                <p className="text-[#C4C4C4] text-sm">Fee Receiver</p>
                                <p className="font-medium truncate">{poolData.stakingPool.feeReceiver}</p>
                            </div>
                            <div>
                                <p className="text-[#C4C4C4] text-sm">Total Reward Tokens</p>
                                <p className="font-medium truncate">{poolData.stakingPool.totalRewardable}</p>
                            </div>
                        </div>
                    </div>

                    {/* Management Actions Section */}
                    <div className="space-y-6">
                        <div className="bg-[#291254]/50 p-4 rounded-xl border border-primary/10">
                            <label className="text-[#C4C4C4] text-sm mb-2 block">Add Rewards Amount</label>
                            <input
                                type="text"
                                value={rewardAmount}
                                onChange={(e) => setRewardAmount(e.target.value)}
                                className="bg-[#1A0835] text-white w-full p-3 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                placeholder="Enter reward amount"
                            />
                        </div>

                        <div className="bg-[#291254]/50 p-4 rounded-xl border border-primary/10">
                            <label className="text-[#C4C4C4] text-sm mb-2 block">New Fee Receiver Address</label>
                            <input
                                type="text"
                                value={newFeeReceiver}
                                onChange={(e) => setNewFeeReceiver(e.target.value)}
                                className="bg-[#1A0835] text-white w-full p-3 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                placeholder="Enter new fee receiver address"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={handleAddReward}
                                disabled={isProcessing}
                                className="bg-primary/90 hover:bg-primary w-full py-3 rounded-xl text-white font-medium flex items-center justify-center transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isProcessing ? (
                                    <Preloader
                                        use={Oval}
                                        size={24}
                                        strokeWidth={8}
                                        strokeColor="#FFF"
                                        duration={800}
                                    />
                                ) : (
                                    'Add Rewards'
                                )}
                            </button>

                            <button
                                onClick={handleDrainRewards}
                                disabled={isProcessing}
                                className="bg-primary/90 hover:bg-primary w-full py-3 rounded-xl text-white font-medium flex items-center justify-center transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isProcessing ? (
                                    <Preloader
                                        use={Oval}
                                        size={24}
                                        strokeWidth={8}
                                        strokeColor="#FFF"
                                        duration={800}
                                    />
                                ) : (
                                    'Drain Rewards'
                                )}
                            </button>
                        </div>

                        <button
                            onClick={handleUpdateFeeReceiver}
                            disabled={isProcessing}
                            className="bg-primary/90 hover:bg-primary w-full py-3 rounded-xl text-white font-medium flex items-center justify-center transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isProcessing ? (
                                <Preloader
                                    use={Oval}
                                    size={24}
                                    strokeWidth={8}
                                    strokeColor="#FFF"
                                    duration={800}
                                />
                            ) : (
                                'Update Fee Receiver'
                            )}
                        </button>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 text-[#C4C4C4] hover:text-white rounded-lg hover:bg-white/5 transition-colors duration-200 mt-6"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}