import { useState } from 'react';
import Layout from "../../../../layout/Admin";
import { usePrivy } from "@privy-io/react-auth";
import { useChain } from "../../../../context/ChainContext";
import { publicClient } from "../../../../config";
import { createWalletClient, custom } from "viem";
import { toast } from "react-hot-toast";
import VotingSlotFactory from "../../../../abis/VotingSlotFactory.json";
import { Preloader, ThreeDots } from 'react-preloader-icon';
import { IoWalletSharp } from "react-icons/io5";

// The createViemWalletClient function will be defined inside the component

export default function CreateVotingSlot() {
    const { publicClient } = useChain();

    // Add this function to create wallet client
    const createViemWalletClient = () => {
        return createWalletClient({
            chain: publicClient.chain,
            transport: custom(window.ethereum as any)
        });
    };

    const { authenticated, login } = usePrivy();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        stakingPool: '',
        maxFreeVotesPerDay: 0,
        voteStartDate: '',
        voteStartTime: '',
        voteEndDate: '',
        voteEndTime: '',
        maxVoteWeightPerUser: 0
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authenticated) {
            toast.error("Please connect your wallet");
            return;
        }

        // Validate form data
        if (!formData.name || !formData.description || !formData.image || !formData.stakingPool) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!formData.voteStartDate || !formData.voteStartTime || !formData.voteEndDate || !formData.voteEndTime) {
            toast.error("Please set voting period dates and times");
            return;
        }

        setLoading(true);
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();

        try {
            const startDate = new Date(`${formData.voteStartDate}T${formData.voteStartTime}:00Z`);
            const endDate = new Date(`${formData.voteEndDate}T${formData.voteEndTime}:00Z`);

            if (startDate >= endDate) {
                toast.error("End date must be after start date");
                return;
            }

            const { request } = await publicClient.simulateContract({
                address: "0xDEb50f80349B5159D058e666134E611C99006b3a",
                abi: VotingSlotFactory,
                account,
                functionName: "createVotingSlot",
                args: [
                    formData.name,
                    formData.description,
                    formData.image,
                    account,
                    formData.stakingPool as `0x${string}`,
                    formData.maxFreeVotesPerDay,
                    Math.floor(startDate.getTime() / 1000),
                    Math.floor(endDate.getTime() / 1000),
                    formData.maxVoteWeightPerUser
                ]
            });

            const hash = await walletClient.writeContract(request);
            toast.success("Voting slot created successfully!");

            // Reset form after successful creation
            setFormData({
                name: '',
                description: '',
                image: '',
                stakingPool: '',
                maxFreeVotesPerDay: 0,
                voteStartDate: '',
                voteStartTime: '',
                voteEndDate: '',
                voteEndTime: '',
                maxVoteWeightPerUser: 0
            });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to create voting slot");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Layout>
            <section className="p-8 text-white">
                <div className="max-w-2xl mx-auto">
                    <img src="/der-mob.svg" alt="" className="mb-6" />
                    <h1 className="font-space text-xl font-semibold text-primary mb-8">Create New Voting Slot</h1>

                    {!authenticated ? (
                        <button
                            onClick={login}
                            className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                        >
                            <IoWalletSharp className="w-5 h-5" />
                            <span>Connect Wallet</span>
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Enter voting slot name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full h-[100px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Enter voting slot description"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Image URL</label>
                                    <input
                                        type="text"
                                        name="image"
                                        value={formData.image}
                                        onChange={handleChange}
                                        className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Enter image URL"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Staking Pool Address</label>
                                    <input
                                        type="text"
                                        name="stakingPool"
                                        value={formData.stakingPool}
                                        onChange={handleChange}
                                        className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Enter staking pool address"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Vote Start Date</label>
                                        <input
                                            type="date"
                                            name="voteStartDate"
                                            value={formData.voteStartDate}
                                            onChange={handleChange}
                                            className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Vote Start Time</label>
                                        <input
                                            type="time"
                                            name="voteStartTime"
                                            value={formData.voteStartTime}
                                            onChange={handleChange}
                                            className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Vote End Date</label>
                                        <input
                                            type="date"
                                            name="voteEndDate"
                                            value={formData.voteEndDate}
                                            onChange={handleChange}
                                            className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Vote End Time</label>
                                        <input
                                            type="time"
                                            name="voteEndTime"
                                            value={formData.voteEndTime}
                                            onChange={handleChange}
                                            className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Max Free Votes Per Day</label>
                                    <input
                                        type="number"
                                        name="maxFreeVotesPerDay"
                                        value={formData.maxFreeVotesPerDay}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Max Vote Weight Per User</label>
                                    <input
                                        type="number"
                                        name="maxVoteWeightPerUser"
                                        value={formData.maxVoteWeightPerUser}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full h-[50px] bg-[#291254]/50 border border-primary/20 rounded-[8px] px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {loading ? (
                                    <Preloader
                                        use={ThreeDots}
                                        size={60}
                                        strokeWidth={6}
                                        strokeColor="#FFF"
                                        duration={2000}
                                    />
                                ) : (
                                    'Create Voting Slot'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </Layout>
    );
}