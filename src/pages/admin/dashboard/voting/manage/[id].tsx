import { useState, useEffect } from "react";
import Layout from "../../../../../layout/Admin";
import { usePrivy } from "@privy-io/react-auth";
import { useChain } from "../../../../../context/ChainContext";
import { publicClient } from "../../../../../config";
import { useVoting } from "../../../../../hooks/web3/useVoting";
import { createWalletClient, custom } from "viem";
import { useParams } from "react-router-dom";
import { Preloader, ThreeDots } from 'react-preloader-icon';
import { toast } from "react-hot-toast";
import { IoWalletSharp } from "react-icons/io5";
import VotingSlot from "../../../../../abis/VotingSlot.json";

// The createViemWalletClient function will be defined inside the component

export default function ManageVotingSlot() {
    const { publicClient } = useChain();

    // Add this function to create wallet client
    const createViemWalletClient = () => {
        return createWalletClient({
            chain: publicClient.chain,
            transport: custom(window.ethereum as any)
        });
    };

    const { authenticated, login } = usePrivy();
    const { id } = useParams<{ id: `0x${string}` }>();
    const { data, error, loading, refetch } = useVoting(id, { polling: false });
    const [changingPauseState, setChangingPauseState] = useState(false);

    const handleTogglePause = async () => {
        if (!authenticated) {
            toast.error("Please connect your wallet");
            return;
        }

        setChangingPauseState(true);
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();

        try {
            const { request } = await publicClient.simulateContract({
                address: id as `0x${string}`,
                abi: VotingSlot,
                account,
                functionName: "changePauseState",
            });

            const hash = await walletClient.writeContract(request);
            toast.success(`Successfully ${data.paused ? 'unpaused' : 'paused'} voting slot`);
            await refetch();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to toggle pause state");
        } finally {
            setChangingPauseState(false);
        }
    };

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

    return (
        <Layout>
            <section className="p-8 text-white">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="flex flex-col items-center space-y-4">
                        <img
                            src={data.image}
                            className="h-[80px] w-[80px] object-contain rounded-full border-2 border-primary/30"
                            alt=""
                        />
                        <h1 className="text-primary text-center text-[28px] lg:text-[36px] font-[700] uppercase tracking-[3px]">
                            Manage {data.name}
                        </h1>
                    </div>

                    {/* Voting Status Section */}
                    <div className="bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Voting Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span>Current Status:</span>
                                <span className={data.paused ? "text-red-500" : "text-green-500"}>
                                    {data.paused ? "Paused" : "Active"}
                                </span>
                            </div>
                            <button
                                onClick={handleTogglePause}
                                disabled={changingPauseState || !authenticated}
                                className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {changingPauseState ? (
                                    <Preloader
                                        use={ThreeDots}
                                        size={60}
                                        strokeWidth={6}
                                        strokeColor="#FFF"
                                        duration={2000}
                                    />
                                ) : (
                                    `${data.paused ? 'Unpause' : 'Pause'} Voting`
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Voting Details Section */}
                    <div className="bg-[#12092B]/50 p-6 rounded-xl border border-primary/20 space-y-6">
                        <h3 className="text-xl font-semibold text-primary">Voting Details</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span>Start Date:</span>
                                <span>{new Date(data.voteStartDate * 1000).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>End Date:</span>
                                <span>{new Date(data.voteEndDate * 1000).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Max Free Votes Per Day:</span>
                                <span>{data.maxFreeVotesPerDay}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Positive Vote Weight:</span>
                                <span>{data.positiveVoteWeight}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Negative Vote Weight:</span>
                                <span>{data.negativeVoteWeight}</span>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Connection Section */}
                    {!authenticated && (
                        <div className="bg-[#12092B]/50 p-6 rounded-xl border border-primary/20">
                            <button
                                onClick={login}
                                className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                            >
                                <IoWalletSharp className="w-5 h-5" />
                                <span>Connect Wallet</span>
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </Layout>
    );
}