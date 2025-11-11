import { useState, useEffect } from "react";
import Layout from "../../../../../layout/Admin"
import { usePrivy } from "@privy-io/react-auth"
import { usePresale } from "../../../../../hooks/web3/usePresale";
import { createWalletClient, custom } from "viem";
import { useChain } from '../../../../../context/ChainContext';
import { useParams } from "react-router-dom";
import TxReceipt from "../../../../../components/Modal/TxReceipt";
import { IoWalletSharp } from "react-icons/io5";
import { Preloader, ThreeDots } from 'react-preloader-icon';
import { toast } from "react-hot-toast";
import { ethers } from "ethers";
import erc20Abi from "../../../../../abis/ERC20.json";
import Presale from "../../../../../abis/Presale.json"
import { Link } from "react-router-dom";
import { FaCopy } from "react-icons/fa";
import { getContractAddress } from "../../../../../utils/source";

// The createViemWalletClient function will be defined inside the component


export default function AdminPresaleManageID() {
    const { authenticated, login, user } = usePrivy();
    const { id } = useParams<{ id: `0x${string}` }>();
    const { data, error, loading, refetch } = usePresale(id, { polling: false });
    const { publicClient, selectedChain } = useChain();
    const wallet = window.ethereum;

    // Define createViemWalletClient inside the component to access the chain context
    const createViemWalletClient = () => {
        return createWalletClient({
            chain: publicClient.chain, // Use the chain from the ChainContext
            transport: custom(window.ethereum as any)
        });
    };

    // Helper function to get the chain name
    const getChainName = () => {
        return selectedChain === "84532" ? "Base Sepolia" :
            selectedChain === "57054" ? "Sonic" : "Rise";
    };

    // Log when the selected chain changes
    useEffect(() => {
        console.log(`PresaleManager: Chain changed to ${getChainName()} (${selectedChain})`);
    }, [selectedChain]);


    const [taxSetting, setTaxSetting] = useState<{ taxCollector: `0x${string}`, taxPercent: number, loading: boolean }>({
        taxCollector: "0x",
        taxPercent: 0,
        loading: false
    })

    const [linearVestingSetting, setLinearVestingSetting] = useState<{ endOfLinearVesting: number, loading: boolean }>({
        endOfLinearVesting: 0,
        loading: false
    })

    const [stakingPool, setStakingPool] = useState<{ address: `0x${string}`, loading: boolean }>({
        address: '0x',
        loading: false
    })

    const [switchingSaleStatus, setSwitchingSaleStatus] = useState<boolean>(false);

    const [cliffPeriods, setCliffPeriods] = useState<{
        claimTimes: number[],
        percentages: number[],
        loading: boolean
    }>({
        claimTimes: [],
        percentages: [],
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[200px]">
                <Preloader
                    use={ThreeDots}
                    size={60}
                    strokeWidth={6}
                    strokeColor="#5325A9"
                    duration={2000}
                />
            </div>
        );
    }


    if (error.message) {
        return <div className="text-red-500 text-center">Error loading presale: {error.message}</div>;
    }

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

    async function handleSetCliffPeriod() {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setCliffPeriods((prevState) => ({ ...prevState, loading: true }));

        console.log(`Setting cliff period on chain ${getChainName()} (${selectedChain})`);

        // Make sure wallet is on the correct chain
        try {
            if (wallet && wallet.chainId !== selectedChain) {
                console.log(`Switching wallet to chain ${getChainName()} (${selectedChain})`);
                if (wallet.switchChain && typeof wallet.switchChain === 'function') {
                    await wallet.switchChain(parseInt(selectedChain));
                }
            }
        } catch (error) {
            console.error(`Error switching chain: ${error}`);
            toast.error(`Failed to switch to ${getChainName()} chain. Please switch manually.`);
            return;
        }

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

            console.log(claimTimes)

            // Make the contract call
            const { request } = await publicClient.simulateContract({
                address: data.id,
                abi: Presale,
                account,
                functionName: "setCliffPeriod",
                args: [claimTimes, percentages]
            });

            const hash = await walletClient.writeContract(request);
            toast.success("Cliff period successfully set");
            await new Promise(resolve => setTimeout(resolve, 3000));
            const receipt = await publicClient.getTransactionReceipt({
                hash
            });
            if (receipt.status === "success") {
                await refetch()
            }
        } catch (error: any) {
            console.error(error.message);
            if (error.message.includes("User rejected the request")) {
                toast.error("User Rejected the Request");
            } else if (error.message.includes("first claim time is before end time + withdraw delay")) {
                toast.error("First claim time must be after withdrawal period");
            } else if (error.message.includes("dates not in ascending order")) {
                toast.error("Dates must be in ascending order");
            } else if (error.message.includes("total input percentage doesn't equal to 100")) {
                toast.error("Total percentage must equal 100");
            } else if (error.message.includes("sale already started")) {
                toast.error("Sale has already started")
            } else {
                toast.error("Failed to set cliff period");
            }
        } finally {
            setCliffPeriods((prevState) => ({ ...prevState, loading: false }));
        }
    }

    async function handleSetLinearVesting() {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setLinearVestingSetting((prevState) => ({ ...prevState, loading: true }))

        if (linearVestingSetting.endOfLinearVesting === 0) {
            setLinearVestingSetting((prevState) => ({ ...prevState, loading: false }))
            toast("Set Valid Time for Withdrawal")
            return;
        }

        try {
            const { request } = await publicClient.simulateContract({
                address: data.id,
                abi: Presale,
                account,
                functionName: "setLinearVestingEndTime",
                args: [
                    linearVestingSetting.endOfLinearVesting
                ]
            })

            const hash = await walletClient.writeContract(request);
            toast("Successfully set Linear Vesting ")
            await new Promise(resolve => setTimeout(resolve, 3000));
            const receipt = await publicClient.getTransactionReceipt({
                hash
            });
            if (receipt.status === "success") {
                await refetch()
            }
        } catch (error: any) {
            console.error(error.message)
            if (error.message.includes("User rejected the request")) {
                toast("User Rejected the Request")
                return;
            }
            if (error.message.includes("vesting end time has to be after withdrawal start time")) {
                toast("Vesting Time has to be after withdrawal period")
                return;
            }
            if (error.message.includes("sale already started")) {
                toast("Sale has already started")
                return;
            }
            toast.error("Linear Vesting Setting Failed, Please Try Again later")
        } finally {
            setLinearVestingSetting((prevState) => ({ ...prevState, loading: false }))
        }
    }

    async function handleSetTaxCollector() {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setTaxSetting((prevState) => ({ ...prevState, loading: true }))

        if (taxSetting.taxCollector === "0x") {
            setStakingPool((prevState) => ({ ...prevState, loading: false }))
            toast("Invalid Tax Collector Address")
            return;
        }

        try {
            const { request } = await publicClient.simulateContract({
                address: data.id,
                abi: Presale,
                account,
                functionName: "setTaxCollector",
                args: [
                    taxSetting.taxCollector
                ]
            })

            const hash = await walletClient.writeContract(request);
            toast("Successfully set Tax Collector ")
            await new Promise(resolve => setTimeout(resolve, 3000));
            const receipt = await publicClient.getTransactionReceipt({
                hash
            });
            if (receipt.status === "success") {
                await refetch()
            }
        } catch (error: any) {
            console.error(error.message)
            if (error.message.includes("User rejected the request")) {
                toast("User Rejected the Request")
                return;
            }
            if (error.message.includes("must be tax setter")) {
                toast("User is not a Tax Setter!")
                return;
            }
            if (error.message.includes("0x0 taxCollector")) {
                toast("Invalid Tax Collector")
                return;
            }
            toast.error("Tax Collector Setting Failed, Please Try Again later")
        } finally {
            setTaxSetting((prevState) => ({ ...prevState, loading: false }))
        }
    }

    async function handleSetStakingPool() {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setStakingPool((prevState) => ({ ...prevState, loading: true }))

        if (stakingPool.address === "0x") {
            setStakingPool((prevState) => ({ ...prevState, loading: false }))
            toast("Invalid Lock & Stake Address")
            return;
        }

        try {
            const { request } = await publicClient.simulateContract({
                address: data.id,
                abi: Presale,
                account,
                functionName: "setStakingPool",
                args: [
                    stakingPool.address
                ]
            })

            const hash = await walletClient.writeContract(request);
            toast("Successfully set Lock & Stake ")
            await new Promise(resolve => setTimeout(resolve, 3000));
            const receipt = await publicClient.getTransactionReceipt({
                hash
            });
            if (receipt.status === "success") {
                await refetch()
            }
        } catch (error: any) {
            console.error(error.message)
            if (error.message.includes("User rejected the request")) {
                toast("User Rejected the Request")
                return;
            }
            if (error.message.includes("must be tax setter")) {
                toast("User is not a Tax Setter!")
                return;
            }
            if (error.message.includes("0x0 taxCollector")) {
                toast("Invalid Tax Collector")
                return;
            }
            toast.error("Lock & Stake Setting Failed, Please Try Again later")
        } finally {
            setStakingPool((prevState) => ({ ...prevState, loading: false }))
        }
    }

    async function handleSetTaxAmount() {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setTaxSetting((prevState) => ({ ...prevState, loading: true }))

        if (taxSetting.taxPercent > 100) {
            toast("Tax Percentage cant be greater than 100%")
            setTaxSetting((prevState) => ({ ...prevState, loading: false }))
            return;
        }

        try {
            const { request } = await publicClient.simulateContract({
                address: data.id,
                abi: Presale,
                account,
                functionName: "setTaxPercentage",
                args: [
                    taxSetting.taxPercent * 100
                ]
            })

            const hash = await walletClient.writeContract(request);
            toast("Successfully set tax amount ")
            await new Promise(resolve => setTimeout(resolve, 3000));
            const receipt = await publicClient.getTransactionReceipt({
                hash
            });
            if (receipt.status === "success") {
                await refetch()
            }
        } catch (error: any) {
            console.error(error.message)
            if (error.message.includes("User rejected the request")) {
                toast("User Rejected the Request")
                return;
            }
            if (error.message.includes("must be tax setter")) {
                toast("User is not a Tax Setter!")
                return;
            }
        } finally {
            setTaxSetting((prevState) => ({ ...prevState, loading: false }))
        }
    }

    async function handleChangeSaleStatus() {
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();
        setSwitchingSaleStatus(true);

        try {
            const { request } = await publicClient.simulateContract({
                address: data.id,
                abi: Presale,
                account,
                functionName: "toggleIsPrivateSale",
            })

            const hash = await walletClient.writeContract(request);

            toast(`Successfully set Sale Type to ${data.isPrivateSale ? "Public" : "Private"}`)
            await new Promise(resolve => setTimeout(resolve, 3000));
            const receipt = await publicClient.getTransactionReceipt({
                hash
            });
            if (receipt.status === "success") {
                await refetch()
            }

        } catch (error: any) {
            console.error(error.message)
            if (error.message.includes("User rejected the request")) {
                toast("User Rejected the Request")
                return;
            }
            if (error.message.includes("sale already started")) {
                toast("Sale already started")
                return;
            }
        } finally {
            setSwitchingSaleStatus(false);
        }
    }

    function DeadlineCounter({ deadline }: { deadline: number }) {
        const [timeLeft, setTimeLeft] = useState<number>(0);

        useEffect(() => {
            const interval = setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                const timeRemaining = deadline - now;
                setTimeLeft(timeRemaining > 0 ? timeRemaining : 0);
            }, 1000);

            return () => clearInterval(interval);
        }, [deadline]);

        const days = Math.floor(timeLeft / 86400);
        const hours = Math.floor((timeLeft % 86400) / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;

        if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
            return (
                <div className="text-red-500 font-medium">
                    Deadline Passed
                </div>
            );
        }

        return (
            <div className="flex items-center space-x-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <p className="text-primary text-sm">{days}d</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-lg">
                    <p className="text-primary text-sm">{hours}h</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-lg">
                    <p className="text-primary text-sm">{minutes}m</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-lg">
                    <p className="text-primary text-sm">{seconds}s</p>
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <section className="min-h-screen bg-black p-5 text-white font-space">
                <div className="flex flex-col items-center justify-center max-w-2xl mx-auto my-10 space-y-8">
                    <div className="w-full space-y-4">
                        <div className="flex flex-col items-center space-y-4">
                            <img
                                src={data?.presaleInfo?.images?.logo}
                                className="h-[80px] w-[80px] object-contain rounded-full border-2 border-primary/30"
                                alt=""
                            />
                            <div className="text-center">
                                <p className='text-primary text-[28px] lg:text-[36px] font-[700] uppercase tracking-[3px] mb-2'>
                                    Manage {data?.presaleInfo?.projectName}
                                </p>
                                <p className="py-3 flex gap-x-1 items-center justify-center space-x-2 cursor-pointer" onClick={() => {
                                    navigator.clipboard.writeText(data.id)
                                    toast.success("Copied to clipboard!")
                                }}>
                                    {data.id} <FaCopy />
                                </p>
                                <div className="inline-flex items-center gap-2 bg-[#291254] px-4 py-2 rounded-full">
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    <span className="text-sm font-medium">
                                        {getChainName()} Testnet
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <DeadlineCounter
                            deadline={Number(data.startTime)} />
                    </div>

                    {/* Staking Pool Section */}
                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Sale Configuration</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <label htmlFor="lockStakeAddress" className="text-[#C4C4C4] text-sm">
                                    Sale Type : {data.isPrivateSale ? "Private Sale" : "Public Sale"}
                                </label>
                                <button
                                    className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    onClick={handleChangeSaleStatus}
                                    disabled={switchingSaleStatus}
                                >
                                    {stakingPool.loading ? (
                                        <Preloader
                                            use={ThreeDots}
                                            size={60}
                                            strokeWidth={6}
                                            strokeColor="#FFF"
                                            duration={2000}
                                        />
                                    ) : (
                                        `Switch to ${data.isPrivateSale ? "Public Sale" : "Private Sale"}`
                                    )}
                                </button>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <Link
                                    target="_blank"
                                    to={`/admin/dashboard/presales/cash/${data.id}`}
                                    className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"

                                >
                                    Cash Sale
                                </Link>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <Link
                                    to={`/admin/dashboard/presales/fund/${data.id}`}
                                    target="_blank"
                                    className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"

                                >
                                    Fund Sale
                                </Link>
                            </div>
                        </div>
                    </div>


                    {/* Staking Pool Section */}
                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Lock & Stake</h3>
                        <span>Current StakeLock : {getContractAddress("stakeLock")}</span>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <label htmlFor="lockStakeAddress" className="text-[#C4C4C4] text-sm">
                                    Lock & Stake Address: {data.stakingPool === "0x0000000000000000000000000000000000000000" ? "Lock & Stake Not Set" : data.stakingPool}
                                </label>
                                <input
                                    id="lockStakeAddress"
                                    type="string"
                                    value={stakingPool.address}
                                    onChange={(e) => setStakingPool((prevState) => ({ ...prevState, address: e.target.value as `0x${string}` }))}
                                    className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button
                                    className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    onClick={handleSetStakingPool}
                                    disabled={!authenticated || stakingPool.loading}
                                >
                                    {stakingPool.loading ? (
                                        <Preloader
                                            use={ThreeDots}
                                            size={60}
                                            strokeWidth={6}
                                            strokeColor="#FFF"
                                            duration={2000}
                                        />
                                    ) : (
                                        'Set Lock & Stake'
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Tax Settings Section */}
                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Tax Settings</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <label htmlFor="Lock & Stake" className="text-[#C4C4C4] text-sm">
                                    Tax Collector Address: {data.taxCollector === "0x0000000000000000000000000000000000000000" ? "Tax Collector Not Set" : data.taxCollector}
                                </label>
                                <input
                                    id="taxCollector"
                                    type="string"
                                    value={taxSetting.taxCollector}
                                    onChange={(e) => setTaxSetting((prevState) => ({ ...prevState, taxCollector: e.target.value as `0x${string}` }))}
                                    className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button
                                    className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    onClick={handleSetTaxCollector}
                                    disabled={!authenticated || taxSetting.loading}
                                >
                                    {taxSetting.loading ? (
                                        <Preloader
                                            use={ThreeDots}
                                            size={60}
                                            strokeWidth={6}
                                            strokeColor="#FFF"
                                            duration={2000}
                                        />
                                    ) : (
                                        'Add Tax Collector'
                                    )}
                                </button>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label htmlFor="taxPercent" className="text-[#C4C4C4] text-sm">
                                    Tax Percentage : {data.taxPercentage}%
                                </label>
                                <input
                                    id="taxPercent"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={taxSetting.taxPercent}
                                    onChange={(e) => setTaxSetting((prevState) => ({ ...prevState, taxPercent: Number(e.target.value) }))}
                                    className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button
                                    onClick={handleSetTaxAmount}
                                    className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    disabled={!authenticated || taxSetting.loading}
                                >
                                    {taxSetting.loading ? (
                                        <Preloader
                                            use={ThreeDots}
                                            size={60}
                                            strokeWidth={6}
                                            strokeColor="#FFF"
                                            duration={2000}
                                        />
                                    ) : (
                                        'Set Tax Percent'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Vesting Settings Section */}
                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Vesting Settings</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <label htmlFor="linearVesting" className="text-[#C4C4C4] text-sm">
                                    Linear Vesting End Date
                                </label>
                                <div className="flex gap-x-3">
                                    <input
                                        id="linearVesting"
                                        value={linearVestingSetting.endOfLinearVesting ? new Date(linearVestingSetting.endOfLinearVesting * 1000).toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const dateValue = e.target.value;
                                            const currentDate = new Date(linearVestingSetting.endOfLinearVesting * 1000);
                                            const newDate = new Date(Date.UTC(
                                                new Date(dateValue).getUTCFullYear(),
                                                new Date(dateValue).getUTCMonth(),
                                                new Date(dateValue).getUTCDate(),
                                                currentDate.getUTCHours(),
                                                currentDate.getUTCMinutes()
                                            ));
                                            setLinearVestingSetting(prev => ({
                                                ...prev,
                                                endOfLinearVesting: Math.floor(newDate.getTime() / 1000)
                                            }));
                                        }}
                                        type="date"
                                        className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    <input
                                        value={linearVestingSetting.endOfLinearVesting ?
                                            new Date(linearVestingSetting.endOfLinearVesting * 1000)
                                                .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                                            : ''
                                        }
                                        onChange={(e) => {
                                            const timeValue = e.target.value;
                                            if (timeValue.length === 5) {
                                                const currentDate = new Date(linearVestingSetting.endOfLinearVesting * 1000);
                                                const [hours, minutes] = timeValue.split(':').map(Number);

                                                // Create new date with existing date values and new time values
                                                const newDate = new Date(Date.UTC(
                                                    currentDate.getUTCFullYear(),
                                                    currentDate.getUTCMonth(),
                                                    currentDate.getUTCDate(),
                                                    hours,
                                                    minutes,
                                                    currentDate.getUTCSeconds()
                                                ));

                                                // Only update if the new time is different
                                                if (newDate.getTime() !== currentDate.getTime()) {
                                                    setLinearVestingSetting(prev => ({
                                                        ...prev,
                                                        endOfLinearVesting: Math.floor(newDate.getTime() / 1000)
                                                    }));
                                                }
                                            }
                                        }}
                                        type="time"
                                        className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <button
                                    className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    disabled={!authenticated || linearVestingSetting.loading}
                                    onClick={handleSetLinearVesting}
                                >
                                    {linearVestingSetting.loading ? (
                                        <Preloader
                                            use={ThreeDots}
                                            size={60}
                                            strokeWidth={6}
                                            strokeColor="#FFF"
                                            duration={2000}
                                        />
                                    ) : (
                                        'Set Up Linear Vesting'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cliff Period Settings Section */}
                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Cliff Period Settings</h3>
                        <div className="space-y-4">
                            {cliffForms.map((form, index) => (
                                <div key={index} className="space-y-3">
                                    <div className="flex gap-x-3">
                                        <input
                                            type="date"
                                            value={form.date}
                                            onChange={(e) => handleFormChange(index, 'date', e.target.value)}
                                            className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                        <input
                                            type="time"
                                            value={form.time}
                                            onChange={(e) => handleFormChange(index, 'time', e.target.value)}
                                            className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        />
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
                                    {index > 0 && (
                                        <button
                                            onClick={() => handleRemoveForm(index)}
                                            className="text-red-500 hover:text-red-400 text-sm"
                                        >
                                            Remove this schedule
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                onClick={handleAddNewForm}
                                className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                            >
                                Add New Schedule Form
                            </button>
                        </div>

                        <button
                            onClick={handleSetCliffPeriod}
                            className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            disabled={!authenticated || cliffPeriods.loading || cliffForms.length === 0}
                        >
                            {cliffPeriods.loading ? (
                                <Preloader
                                    use={ThreeDots}
                                    size={60}
                                    strokeWidth={6}
                                    strokeColor="#FFF"
                                    duration={2000}
                                />
                            ) : (
                                'Set Cliff Period'
                            )}
                        </button>
                    </div>

                    {/* Wallet Connection Section */}
                    <div className="w-full bg-[#12092B]/50 p-6 rounded-xl border border-primary/20">
                        {authenticated ? (
                            <button
                                onClick={login}
                                className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                            >
                                <IoWalletSharp className="w-5 h-5" />
                                <span>Disconnect Wallet</span>
                            </button>
                        ) : (
                            <button
                                onClick={login}
                                className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                            >
                                <IoWalletSharp className="w-5 h-5" />
                                <span>Connect Wallet</span>
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </Layout >
    )
}