import { useState, useEffect } from "react";
import Layout from "../../../../../layout/Admin"
import { usePrivy } from "@privy-io/react-auth"
// We'll use publicClient from useChain instead of direct import
import { useBond } from "../../../../../hooks/web3/useBond";
import { createWalletClient, custom } from "viem";
import { useChain } from "../../../../../context/ChainContext";
import { useParams } from "react-router-dom";
import TxReceipt from "../../../../../components/Modal/TxReceipt";
import { IoWalletSharp } from "react-icons/io5";
import { Preloader, ThreeDots, Oval } from 'react-preloader-icon';
import { toast } from "react-hot-toast";
import { ethers } from "ethers";
import erc20Abi from "../../../../../abis/ERC20.json";
import BondABI from "../../../../../abis/Bond.json";
import { Link } from "react-router-dom";
import { getContractAddress } from "../../../../../utils/source";

// The createViemWalletClient function will be defined inside the component

export default function AdminBondManageID() {
    const { publicClient } = useChain();

    // Add this function to create wallet client
    const createViemWalletClient = () => {
        return createWalletClient({
            chain: publicClient.chain,
            transport: custom(window.ethereum as any)
        });
    };

    const { id } = useParams<{ id: string }>();
    const { data: bondData, error, loading, refetch } = useBond(null, { polling: false }, id as `0x${string}`);

    const [taxSetting, setTaxSetting] = useState<{
        taxCollector: `0x${string}`,
        taxPercent: number,
        loading: boolean
    }>({
        taxCollector: "0x",
        taxPercent: 0,
        loading: false
    });

    const [linearVestingSetting, setLinearVestingSetting] = useState<{
        endOfLinearVesting: string,
        loading: boolean
    }>({
        endOfLinearVesting: '',
        loading: false
    });

    const [stakingPool, setStakingPool] = useState<{
        address: `0x${string}`,
        loading: boolean
    }>({
        address: '0x',
        loading: false
    });

    const [trustedSigner, setTrustedSigner] = useState<{
        address: `0x${string}`,
        loading: boolean
    }>({
        address: '0x',
        loading: false
    });

    const [cliffForms, setCliffForms] = useState<Array<{
        date: string,
        time: string,
        percentage: number
    }>>([{
        date: '',
        time: '',
        percentage: 0
    }]);

    const handleAddNewForm = () => {
        setCliffForms(prev => [...prev, {
            date: '',
            time: '',
            percentage: 0
        }]);
    };

    const handleFormChange = (index: number, field: string, value: string | number) => {
        setCliffForms(prev => prev.map((form, i) =>
            i === index ? { ...form, [field]: value } : form
        ));
    };

    const handleRemoveForm = (index: number) => {
        setCliffForms(prev => prev.filter((_, i) => i !== index));
    };

    async function handleSetTaxCollector(address: `0x${string}`) {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setTaxSetting(prev => ({ ...prev, loading: true }));

        try {
            const { request } = await publicClient.simulateContract({
                address: id as `0x${string}`,
                abi: BondABI,
                functionName: "setTaxCollector",
                args: [address],
                account
            });

            const hash = await walletClient.writeContract(request);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt.status === "success") {
                toast.success("Tax collector updated successfully");
                await refetch();
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update tax collector");
        } finally {
            setTaxSetting(prev => ({ ...prev, loading: false }));
        }
    }

    async function handleSetTaxPercentage(percentage: number) {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setTaxSetting(prev => ({ ...prev, loading: true }));

        try {
            const { request } = await publicClient.simulateContract({
                address: id as `0x${string}`,
                abi: BondABI,
                functionName: "setTaxPercentage",
                args: [percentage],
                account
            });

            const hash = await walletClient.writeContract(request);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt.status === "success") {
                toast.success("Tax percentage updated successfully");
                await refetch();
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update tax percentage");
        } finally {
            setTaxSetting(prev => ({ ...prev, loading: false }));
        }
    }

    async function handleSetStakingPool(address: `0x${string}`) {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setStakingPool(prev => ({ ...prev, loading: true }));

        try {
            const { request } = await publicClient.simulateContract({
                address: id as `0x${string}`,
                abi: BondABI,
                functionName: "setStakingPool",
                args: [address],
                account
            });

            const hash = await walletClient.writeContract(request);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt.status === "success") {
                toast.success("Staking pool updated successfully");
                await refetch();
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update staking pool");
        } finally {
            setStakingPool(prev => ({ ...prev, loading: false }));
        }
    }

    async function handleSetTrustedSigner(address: `0x${string}`) {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setTrustedSigner(prev => ({ ...prev, loading: true }));

        try {
            const { request } = await publicClient.simulateContract({
                address: id as `0x${string}`,
                abi: BondABI,
                functionName: "setTrustedSigner",
                args: [address],
                account
            });

            const hash = await walletClient.writeContract(request);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt.status === "success") {
                toast.success("Trusted signer updated successfully");
                await refetch();
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update signer pool");
        } finally {
            setTrustedSigner(prev => ({ ...prev, loading: false }));
        }
    }

    async function handleSetLinearVesting() {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setLinearVestingSetting(prev => ({ ...prev, loading: true }));

        try {
            const endTime = Math.floor(new Date(linearVestingSetting.endOfLinearVesting).getTime() / 1000);

            const { request } = await publicClient.simulateContract({
                address: id as `0x${string}`,
                abi: BondABI,
                functionName: "setLinearVestingEndTime",
                args: [endTime],
                account
            });

            const hash = await walletClient.writeContract(request);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt.status === "success") {
                toast.success("Linear vesting end time updated successfully");
                await refetch();
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update linear vesting end time");
        } finally {
            setLinearVestingSetting(prev => ({ ...prev, loading: false }));
        }
    }

    async function handleSetCliffPeriod() {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();

        try {
            // Convert cliffForms to claimTimes and percentages
            const claimTimes = cliffForms.map(form => {
                const date = new Date(`${form.date}T${form.time}:00Z`);
                return Math.floor(date.getTime() / 1000);
            });

            const percentages = cliffForms.map(form => form.percentage);

            // Validate inputs
            if (claimTimes.length === 0) {
                toast.error("Input is empty");
                return;
            }

            if (claimTimes.length > 100) {
                toast.error("Input length cannot exceed 100");
                return;
            }

            const totalPercentage = percentages.reduce((sum, pct) => sum + pct, 0);
            if (totalPercentage !== 100) {
                toast.error("Total percentage must equal 100");
                return;
            }

            // Check if dates are in ascending order
            for (let i = 1; i < claimTimes.length; i++) {
                if (claimTimes[i - 1] >= claimTimes[i]) {
                    toast.error("Dates must be in ascending order");
                    return;
                }
            }

            const { request } = await publicClient.simulateContract({
                address: id as `0x${string}`,
                abi: BondABI,
                account,
                functionName: "setCliffPeriod",
                args: [claimTimes, percentages.map(p => Number(p))]
            });

            const hash = await walletClient.writeContract(request);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt.status === "success") {
                toast.success("Cliff period successfully set");
                await refetch();
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to set cliff period");
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-[200px]">
                    <Preloader
                        use={ThreeDots}
                        size={60}
                        strokeWidth={6}
                        strokeColor="#5325A9"
                        duration={2000}
                    />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-[40px_20px] lg:p-[100px_40px] font-space">
                <div className="flex flex-col gap-[20px] text-white">
                    <h1 className="text-[24px] lg:text-[36px] font-[500]">Manage Bond</h1>

                    {/* Tax Settings Section */}
                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Tax Settings</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-[#C4C4C4] text-sm">Tax Collector Address</p>
                                    <p className="text-[#C4C4C4] text-sm">Current: {bondData?.taxCollector || 'Not set'}</p>
                                </div>
                                <div className="flex gap-x-2">
                                    <input
                                        type="text"
                                        value={taxSetting.taxCollector}
                                        onChange={(e) => setTaxSetting(prev => ({ ...prev, taxCollector: e.target.value as `0x${string}` }))}
                                        className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="0x..."
                                    />
                                    <button
                                        onClick={() => handleSetTaxCollector(taxSetting.taxCollector)}
                                        className="bg-primary/90 hover:bg-primary px-4 rounded-[8px] text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                                    >
                                        Set
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-[#C4C4C4] text-sm">Tax Percentage</p>
                                    <p className="text-[#C4C4C4] text-sm">Current: {bondData?.taxPercentage || 0}%</p>
                                </div>
                                <div className="flex gap-x-2">
                                    <input
                                        type="number"
                                        value={taxSetting.taxPercent}
                                        onChange={(e) => setTaxSetting(prev => ({ ...prev, taxPercent: Number(e.target.value) }))}
                                        className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Enter percentage"
                                    />
                                    <button
                                        onClick={() => handleSetTaxPercentage(taxSetting.taxPercent)}
                                        className="bg-primary/90 hover:bg-primary px-4 rounded-[8px] text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                                    >
                                        Set
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Linear Vesting Settings */}
                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Linear Vesting Settings</h3>
                        <div className="flex flex-col space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-[#C4C4C4] text-sm">End Time</p>
                                <p className="text-[#C4C4C4] text-sm">
                                    Current: {bondData?.linearVestingEndTime ?
                                        new Date(Number(bondData.linearVestingEndTime) * 1000).toLocaleString() :
                                        'Not set'
                                    }
                                </p>
                            </div>
                            <div className="flex gap-x-2">
                                <input
                                    type="datetime-local"
                                    value={linearVestingSetting.endOfLinearVesting}
                                    onChange={(e) => setLinearVestingSetting(prev => ({
                                        ...prev,
                                        endOfLinearVesting: e.target.value
                                    }))}
                                    className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button
                                    onClick={handleSetLinearVesting}
                                    className="bg-primary/90 hover:bg-primary px-4 rounded-[8px] text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                                >
                                    Set
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Staking Pool Settings */}
                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Staking Pool Settings</h3>
                        <span>Current StakeLock : {getContractAddress("stakeLock")}</span>
                        <div className="flex flex-col space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-[#C4C4C4] text-sm">Staking Pool Address</p>
                                <p className="text-[#C4C4C4] text-sm">Current: {bondData?.stakingPool || 'Not set'}</p>
                            </div>
                            <div className="flex gap-x-2">
                                <input
                                    type="text"
                                    value={stakingPool.address}
                                    onChange={(e) => setStakingPool(prev => ({ ...prev, address: e.target.value as `0x${string}` }))}
                                    className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="0x..."
                                />
                                <button
                                    onClick={() => handleSetStakingPool(stakingPool.address)}
                                    className="bg-primary/90 hover:bg-primary px-4 rounded-[8px] text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                                >
                                    Set
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Trusted Signer Settings</h3>
                        <div className="flex flex-col space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-[#C4C4C4] text-sm">Trusted Signer Address</p>
                            </div>
                            <div className="flex gap-x-2">
                                <input
                                    type="text"
                                    value={trustedSigner.address}
                                    onChange={(e) => setTrustedSigner(prev => ({ ...prev, address: e.target.value as `0x${string}` }))}
                                    className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="0x..."
                                />
                                <button
                                    onClick={() => handleSetTrustedSigner(trustedSigner.address)}
                                    className="bg-primary/90 hover:bg-primary px-4 rounded-[8px] text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                                >
                                    Set
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cliff Period Settings */}
                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Cliff Period Settings</h3>
                        <div className="space-y-4">
                            {cliffForms.map((form, index) => (
                                <div key={index} className="space-y-3 bg-[#17043B]/50 p-4 rounded-lg">
                                    <div className="flex gap-x-3">
                                        <div className="w-full">
                                            <p className="text-[#C4C4C4] text-sm mb-1">Date</p>
                                            <input
                                                type="date"
                                                value={form.date}
                                                onChange={(e) => handleFormChange(index, 'date', e.target.value)}
                                                className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div className="w-full">
                                            <p className="text-[#C4C4C4] text-sm mb-1">Time</p>
                                            <input
                                                type="time"
                                                value={form.time}
                                                onChange={(e) => handleFormChange(index, 'time', e.target.value)}
                                                className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div className="w-full">
                                            <p className="text-[#C4C4C4] text-sm mb-1">Percentage</p>
                                            <input
                                                type="number"
                                                step={1}
                                                min={0}
                                                max={100}
                                                value={form.percentage}
                                                onChange={(e) => handleFormChange(index, 'percentage', Number(e.target.value))}
                                                className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="Percentage"
                                            />
                                        </div>
                                    </div>
                                    {index > 0 && (
                                        <button
                                            onClick={() => handleRemoveForm(index)}
                                            className="text-red-500 hover:text-red-400 text-sm"
                                        >
                                            Remove this period
                                        </button>
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-x-2">
                                <button
                                    onClick={handleAddNewForm}
                                    className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                                >
                                    Add New Cliff Period
                                </button>
                                <button
                                    onClick={handleSetCliffPeriod}
                                    className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                                >
                                    Save Cliff Periods
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
