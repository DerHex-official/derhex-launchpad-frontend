import { useParams } from "react-router-dom"
import { useState, useEffect } from "react";
import { baseSepolia } from "viem/chains";
import { publicClient } from "../../../config";
import { usePresale } from "../../../hooks/web3/usePresale";
import { createWalletClient, custom } from "viem";
import { Oval, Preloader, ThreeDots } from 'react-preloader-icon';
import TxReceipt from "../../../components/Modal/TxReceipt";
import Presale from '../../../abis/Presale.json';
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "react-hot-toast";
import { IoWalletSharp } from "react-icons/io5";

const createViemWalletClient = () => {
    return createWalletClient({
        chain: baseSepolia,
        transport: custom(window.ethereum as any)
    });
};

export default function Cash() {
    const { id } = useParams<{ id: `0x${string}` }>();
    const { data, error, loading } = usePresale(id as `0x${string}`, { polling: false });
    const [funding, setFunding] = useState<boolean>(false);
    const { user, authenticated, login } = usePrivy();
    const [showTxModal, setShowTxModal] = useState<boolean>(false);
    const [txReceiptTitle, setTxReceiptTitle] = useState<string>("Successfully Cashed Presale");
    const [txHash, setTxHash] = useState<string>("");

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

    async function cashPresale() {
        setFunding(true);
        const walletClient = createViemWalletClient();
        const [account] = await walletClient.getAddresses();


        try {
            try {
                const { request } = await publicClient.simulateContract({
                    address: data.id,
                    abi: Presale,
                    account,
                    functionName: "cash"
                })

                const hash = await walletClient.writeContract(request)
                toast("Successfully Cashed Presale")

                setTxHash(hash)
                setTimeout(() => {
                    setShowTxModal(true)
                }, 2000)
            } catch (error: any) {
                console.error(error.message)
                if (error.message.includes("User rejected the request")) {
                    toast("User Rejected the Request")
                    return;
                }
                if (error.message.includes("cannot withdraw yet")) {
                    toast.error("Cannot Withdraw Yet!")
                    return;
                }
                if (error.message.includes("already cashed")) {
                    toast("Presale Already Cashed")
                    return;
                }
                toast.error("Presale Cash Failure, Please Try Again later")
                setFunding(false)
            } finally {
                setFunding(false)
            }
        } finally {
            setFunding(false)
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
                <div className="text-green-500 font-medium">
                    Withdrawal Ready ✅
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
        <section className="min-h-screen bg-black p-5 text-white font-space">
            <TxReceipt
                onClose={() => setShowTxModal(false)}
                title={txReceiptTitle}
                txHash={txHash}
                visible={showTxModal}
            />
            <div className="flex flex-col items-center justify-center max-w-2xl mx-auto border border-primary/20 rounded-[12px] p-[40px_20px] lg:p-[40px] my-10 space-y-6">
                <img
                    src={data?.presaleInfo?.images?.logo}
                    className="h-[60px] w-[60px] object-contain rounded-full border border-primary/20"
                    alt=""
                />
                <p className='text-primary text-center text-[24px] lg:text-[32px] font-[700] uppercase tracking-[3px]'>
                    Cash {data?.presaleInfo?.projectName}
                </p>
                <div>
                    <DeadlineCounter deadline={Number(data.endTime) + Number(data.withdrawDelay)} />
                </div>
                <div className="w-full space-y-3">
                    {!authenticated ? (
                        <button
                            onClick={login}
                            className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                        >
                            <IoWalletSharp className="w-5 h-5" />
                            <span>Connect Wallet</span>
                        </button>
                    ) : (
                        <button
                            className="bg-primary/90 hover:bg-primary w-full py-3 rounded-[8px] text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                            onClick={cashPresale}
                            disabled={funding}
                        >
                            {funding ?
                                <Preloader
                                    use={Oval}
                                    size={24}
                                    strokeWidth={8}
                                    strokeColor="#FFF"
                                    duration={800}
                                /> :
                                "Cash Presale"
                            }
                        </button>
                    )}
                </div>
            </div>
        </section>
    )
}