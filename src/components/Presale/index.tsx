import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { usePresale } from '../../hooks/web3/usePresale';
import { Preloader, ThreeDots } from 'react-preloader-icon';
import { differenceInDays, differenceInMinutes, differenceInHours, isBefore, isAfter } from 'date-fns';
import { FaTwitter, FaTelegramPlane, FaDiscord, FaCopy } from "react-icons/fa";
import { PresaleCountdownTimer } from '../Countdown';
import { toast } from 'react-hot-toast';
import TxReceipt from '../Modal/TxReceipt';
import PresaleABI from "../../abis/Presale.json";
import { createWalletClient, custom } from "viem";
import { useChain } from "../../context/ChainContext";
import ConfirmPurchase from '../Modal/ConfirmPurchase';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';
import { getTokenAllowance } from '../../utils/web3/actions';
import { getClaimableTokensAmount, paymentMade } from '../../utils/web3/presale';
import erc20Abi from "../../abis/ERC20.json";
import { IoWalletSharp } from "react-icons/io5";
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useLockStake } from '../../hooks/web3/useLockStake';
import { getTokenBalance } from '../../utils/web3/actions';
import { usePageTitleIDO } from '../../hooks/utils';

// The createViemWalletClient function will be defined inside the component


export default function IDOComponent() {
    const { publicClient } = useChain();

    // Add this function to create wallet client
    const createViemWalletClient = () => {
        return createWalletClient({
            chain: publicClient.chain,
            transport: custom(window.ethereum as any)
        });
    };
    const { id } = useParams<{ id: string }>();
    const { data, error, loading, refetch } = usePresale(id, { polling: false })
    const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState<boolean>(false);
    const [purchasing, setPurchasing] = useState<boolean>(false)
    const [txHash, setTxHash] = useState<`0x${string}`>("0x")
    const [showTxModal, setShowTxModal] = useState<boolean>(false);
    const [txReceiptTitle, setTxReceiptTitle] = useState<string>("Purchase Successful");
    const [purchaseAmount, setPurchaseAmount] = useState<number>(0);
    const { user, login, authenticated } = usePrivy();
    const { data: lockStake, error: lockStakeError, loading: lockStakeLoading } = useLockStake({ polling: true, userAddress: user?.wallet?.address as `0x${string}` })
    const [refunding, setRefunding] = useState<boolean>(false);
    const [isSaleOver, setIsSaleOver] = useState<boolean>(false);
    const [isRefundPeriod, setIsRefundPeriod] = useState<boolean>(false);
    const [pastRefundPeriod, setPastRefundPeriod] = useState<boolean>(false);
    const [paymentMadeAmount, setPaymentMadeAmount] = useState<number>(0);
    const [claimableAmount, setClaimableAmount] = useState<number>(0);
    const [loadingInfo, setLoadingInfo] = useState<boolean>(true)
    const [markdownContent, setMarkdownContent] = useState(``);

    usePageTitleIDO(`Join ${data?.presaleInfo?.projectName} IDO` || "Presale")

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);
    }, []);

    async function getPaymentMade() {
        setLoadingInfo(true)
        if (!user?.wallet?.address) {
            // toast("Connect Wallet")
            // login();
            return;
        }
        try {
            const amount = await paymentMade(data.id as `0x${string}`, user?.wallet?.address as `0x${string}`)
            const claimAmount = await getClaimableTokensAmount(data.id as `0x${string}`, user.wallet.address as `0x${string}`)

            setPaymentMadeAmount(amount)
            setClaimableAmount(claimAmount)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingInfo(false);
        }
    }

    useEffect(() => {
        const startTimeUnix = data.startTime * 1000 || 0;
        const endTimeUnix = data.endTime * 1000 || 0;

        // Checks if Sale is Over
        if (isAfter(new Date(), new Date(endTimeUnix))) {
            setIsSaleOver(true)
        }

        const delayPeriod = (data.endTime + (Number(data?.withdrawDelay) || 0)) * 1000;

        // Past Refund Period is when current time is after endTime + withdrawDelay
        if (isAfter(new Date(), new Date(delayPeriod))) {
            setPastRefundPeriod(true)
            console.log("Hello!")
        }

        // Refund Period is when current time is after endTime but before endTime + withdrawDelay
        if (isAfter(new Date(), new Date(endTimeUnix)) && isBefore(new Date(), new Date(delayPeriod))) {
            setIsRefundPeriod(true);
        }

        getPaymentMade();


    }, [authenticated, data])

    useEffect(() => {
        if (data?.presaleInfo?.description_md) {
            const fetchMarkdown = async () => {
                try {
                    const response = await axios.get(data.presaleInfo.description_md);
                    setMarkdownContent(response.data);
                } catch (error) {
                    console.error('Error fetching markdown:', error);
                }
            };
            fetchMarkdown();
        }
    }, [data?.presaleInfo?.description_md]);

    function PresaleStatus({ startTime, endTime, delay }: { startTime: number, endTime: number, delay: number }) {
        const startTimeUnix = startTime * 1000
        const endTimeUnix = endTime * 1000
        const delayPeriod = (Number(endTime) + Number(delay)) * 1000


        if (isAfter(new Date(), new Date(endTimeUnix)) && isBefore(new Date(), new Date(delayPeriod))) {
            return (
                <div className="bg-yellow-700/80 p-[3px_8px] w-fit text-[12px]">
                    <p className='text-yellow-300'>Refund Period</p>
                </div>)
        }

        if (isAfter(new Date(), new Date(endTimeUnix))) {
            return (
                <div className="bg-red-700/80 p-[3px_8px] w-fit text-[12px]">
                    <p className='text-red-300'>Sale is Over</p>
                </div>)
        }

        if (isAfter(new Date(), new Date(startTimeUnix)) && isBefore(new Date(), new Date(endTimeUnix))) {
            return (
                <div className="bg-green-700/80 p-[3px_8px] w-fit text-[12px]">
                    <p className='text-green-300'>Sale in Progress</p>
                </div>)
        }

        if (isBefore(new Date(), new Date(startTimeUnix))) {
            return (
                <div className="bg-blue-700/80 p-[3px_8px] w-fit text-[12px]">
                    <p className='text-blue-300'>Upcoming Sale</p>
                </div>)
        }


        return null
    }

    function PresaleProgress({ totalPaymentReceived, softCap, hardCap }: { totalPaymentReceived: number, softCap: number, hardCap: number }) {
        const [progress, setProgress] = useState<number>(0);
        const [target, setTarget] = useState<"Soft Cap" | "Hard Cap">("Soft Cap")

        console.log(totalPaymentReceived)

        useEffect(() => {
            if (Number(totalPaymentReceived) < Number(softCap)) {
                setTarget("Soft Cap");
                const percentage = (Number(totalPaymentReceived) / Number(softCap)) * 100;
                setProgress(percentage);
            } else {
                setTarget("Hard Cap");
                const percentage = (Number(totalPaymentReceived) / Number(hardCap)) * 100;
                if (percentage > 100) {
                    setProgress(100)
                    return;
                }
                setProgress(percentage);
            }
        }, [data])

        return (
            <div className="mt-[15px] flex flex-col items-start space-y-3 w-full">
                <p className='w-full flex items-center justify-between'>Progress ({progress.toFixed(2)}%) <span>{"--------->"}</span> <span>{target}</span> </p>
                <div className="h-[10px] w-full bg-white border border-primary/20">
                    <div style={{ width: `${progress}%` }} className="h-full bg-primary"></div>
                </div>
                <div className='flex justify-between w-full'>
                    <p className='text-primary text-[12px] font-semibold'>{Number(softCap).toLocaleString()} {data.paymentToken.symbol} </p>
                    <p className='text-primary text-[12px] font-semibold'>{Number(hardCap).toLocaleString()} {data.paymentToken.symbol} </p>
                </div>
            </div>
        )
    }

    if (loading || lockStakeLoading) {
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

    if (error.message || lockStakeError.message) {
        return (
            <div className="flex items-center justify-center">
                <h3 className="text-red-600 text-xl">{error.message || lockStakeError.message}</h3>
            </div>
        )
    }

    console.log(data)

    function copyAddress(address: `0x${string}`) {
        navigator.clipboard.writeText(address)
            .then(() => {
                toast.success('Address copied to clipboard!');
            })
            .catch((err) => {
                toast.error('Failed to copy address');
                console.error('Failed to copy address:', err);
            });
    }

    async function handlePayment() {
        setPurchasing(true)
        try {
            // if (Number(data.hardCap) === data.totalPaymentReceived || data.totalPaymentReceived > data.hardCap) {
            //     toast("IDO has reached Hard Cap")
            //     setPurchasing(false)
            //     return;
            // }

            if (purchaseAmount < data.minTotalPayment) {
                toast(`Can't purchase less than minimum amount ${data.minTotalPayment}`)
                setPurchasing(false)
                return;
            }

            if (purchaseAmount > data.maxTotalPayment) {
                toast(`Can't purchase more than maximum amount ${data.maxTotalPayment}`)
                setPurchasing(false)
                return;
            }

            const walletClient = createViemWalletClient();
            const [account] = await walletClient.getAddresses();
            if (purchaseAmount === 0 && Number(data.salePrice) !== 0) {
                toast.error("Purchase Amount can't be zero")
                return;
            }

            const purchaseAmountArg = ethers.parseUnits(purchaseAmount.toString(), 18);
            const tokenBalance = await getTokenBalance(data.paymentToken.id as `0x${string}`, user?.wallet?.address as `0x${string}`);

            if (Number(purchaseAmount) > Number(tokenBalance)) {
                toast(`You don't have enough ${data.paymentToken.symbol}`)
                setPurchasing(false)
                return;
            }

            // Approve Token Spending
            async function approveTokenSpending() {
                if (user?.wallet?.address) {
                    let allowance = await getTokenAllowance(
                        data.paymentToken.id,
                        data.id,
                        user.wallet.address as `0x${string}`
                    )

                    // Check if allowance is less than stake amount
                    if (Number(allowance) < purchaseAmount) {
                        // Allow Contract to Spend
                        const { request } = await publicClient.simulateContract({
                            address: data.paymentToken.id,
                            account,
                            abi: erc20Abi,
                            functionName: "approve",
                            args: [data.id, purchaseAmountArg]  // Changed to approve presale contract
                        })

                        // Run Approval
                        const txHash = await walletClient.writeContract(request);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        const receipt = await publicClient.waitForTransactionReceipt({
                            hash: txHash
                        })
                        return receipt
                    }

                    return {
                        status: "success"
                    }
                }
            }

            const receipt = await approveTokenSpending();
            if (receipt && receipt.status === "success") {
                try {
                    // Purchase Transaction
                    const { request } = await publicClient.simulateContract({
                        address: data.id,
                        abi: PresaleABI,
                        account,
                        functionName: "purchase",
                        args: [
                            purchaseAmountArg
                        ]
                    })

                    const hash = await walletClient.writeContract(request)
                    toast("Successful Purchase");
                    setShowPaymentConfirmModal(false);

                    setTxHash(hash)
                    setTimeout(() => {
                        setShowTxModal(true)
                    }, 2000)

                    setTimeout(async () => {
                        await refetch();
                    }, 5000)
                } catch (error: any) {
                    console.error(error)
                    if (error.message.includes("User rejected the request")) {
                        toast("User Rejected the Request!")
                        return;
                    }
                    if (error.message.includes("sale over")) {
                        toast("Sale is Over!")
                        return
                    }
                    if (error.message.includes("sale has not begun")) {
                        toast('Sale has not started yet')
                        return
                    }
                    if (error.message.includes("must stake to participate in private sale")) {
                        toast("Must stake in Lock & Stake to Participate")
                        return;
                    }

                    toast.error("Purchase Failure, Please Try Again later")
                    setPurchasing(false)
                } finally {
                    setPurchasing(false)
                }

            }
        } catch (error) {
            console.error(error);
            toast.error("Purchase Failed! Please Try Again Later")
        } finally {
            setPurchasing(false)
        }
    }

    async function requestRefund() {
        setRefunding(true)
        try {
            const walletClient = createViemWalletClient();
            const [account] = await walletClient.getAddresses();
            const refundDeadline = (Number(data.endTime) + Number(data.withdrawDelay)) * 1000;

            if (isBefore(new Date(refundDeadline), new Date())) {
                toast("You have missed the refund period")
                console.log("you have missed the refund period")
                setRefunding(false)
                return
            }

            const { request } = await publicClient.simulateContract({
                address: data.id,
                abi: PresaleABI,
                account,
                functionName: "emergencyWithdraw"
            })

            const hash = await walletClient.writeContract(request)
            toast("Successful Refund");
            setShowPaymentConfirmModal(false);
            setTxReceiptTitle("Refund Successful")

            setTxHash(hash)
            setTimeout(() => {
                setShowTxModal(true)
            }, 2000)

            setTimeout(async () => {
                await refetch();
            }, 5000)
        } catch (error: any) {
            console.log(error.message)
            if (error.message.includes("you did not contribute to this sale")) {
                toast("You did not contribute to this sale")
                return;
            }
            if (error.message.includes("sale has been cashed already")) {
                toast("Sale has been cashed already")
                return;
            }
            if (error.message.includes("cannot use emergency withdrawal after regular withdrawal")) {
                toast("cannot use emergency withdrawal after regular withdrawal")
                return;
            }
            toast.error("Purchase Failed! Please Try Again Later")
        } finally {
            setRefunding(false)
        }
    }

    async function handleClaim() {
        setRefunding(true)
        try {
            const walletClient = createViemWalletClient();
            const [account] = await walletClient.getAddresses();

            if (!pastRefundPeriod) {
                toast("It is not yet claim period")
                setRefunding(false)
                return;
            }

            const { request } = await publicClient.simulateContract({
                address: data.id,
                abi: PresaleABI,
                account,
                functionName: "withdraw"
            })

            const hash = await walletClient.writeContract(request)
            toast("Successful Withdrawal");
            setShowPaymentConfirmModal(false);

            setTxHash(hash)
            setTxReceiptTitle("Successful Withdrawal")
            setTimeout(() => {
                setShowTxModal(true)
            }, 2000)

            setTimeout(async () => {
                await refetch();
            }, 5000)

        } catch (error: any) {
            console.log(error.message)
            if (error.message.includes("cannot withdraw yet")) {
                toast("Cannot withdraw yet")
                return;
            }
            if (error.message.includes("Already Cashed")) {
                toast("Already Cashed")
                return;
            }
            if (error.message.includes("can't withdraw before claim is started")) {
                toast("Can't withdraw before claim is started")
                return;
            }
            if (error.message.includes("no token to be withdrawn")) {
                toast("No Token to Claim")
                return;
            }
            toast('Withdrawal Failed, please try again later')
        } finally {
            setRefunding(false)
        }
    }

    function returnMultiplier(amount: number) {
        let multiplier = "1x";

        if (amount >= 50000) {
            multiplier = "3.5x";
        } else if (amount >= 15000) {
            multiplier = "3x";
        } else if (amount >= 10000) {
            multiplier = "2.5x";
        } else if (amount >= 5000) {
            multiplier = "2x";
        } else if (amount >= 1000) {
            multiplier = "1.5x";
        }

        return multiplier;
    }

    function getBadgeInfo(amount: number) {
        if (amount >= 50000) {
            return { name: "Obsidian Vanguard", image: "./obs.svg" };
        } else if (amount >= 15000) {
            return { name: "Titanium Pioneer", image: "./titan.svg" };
        } else if (amount >= 10000) {
            return { name: "Steel Forgemaster", image: "./steel.svg" };
        } else if (amount >= 5000) {
            return { name: "Iron Miner", image: "./iron.svg" };
        } else if (amount >= 1000) {
            return { name: "Copper Miner", image: "./pickaxe.svg" };
        }
        return { name: "No Badge", image: "" };
    }

    const badgeInfo = getBadgeInfo(lockStake?.userData?.amountStaked || 0);

    console.log(data)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 p-[40px_20px] lg:p-[40px] text-white">
            {/* Right Column - Moved to top on mobile */}
            <div className="relative p-8 overflow-hidden group h-fit order-1 lg:order-2">
                <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
                <span className="absolute inset-[2px] bg-[#000027] clip-path-polygon transition-all duration-300"></span>
                <div className="relative space-y-6">
                    {/* Presale Status */}
                    <div className="flex items-center justify-between">
                        <PresaleStatus
                            startTime={data.startTime}
                            endTime={data.endTime}
                            delay={Number(data.withdrawDelay)}
                        />
                    </div>

                    {/* Countdown Timer */}
                    <div className="flex justify-between items-center flex-wrap">
                        <div className="mt-[10px] items-start flex flex-col space-x-[5px]">
                            {isBefore(new Date(), new Date(data.startTime * 1000)) ? (
                                <>
                                    <p className='text-primary text-[12px]'>Sale starts in</p>
                                    <PresaleCountdownTimer time={data.startTime} />
                                </>
                            ) : isAfter(new Date(), new Date(data.endTime * 1000)) && isBefore(new Date(), new Date((Number(data.endTime) + Number(data.withdrawDelay)) * 1000)) ? (
                                <>
                                    <p className='text-primary text-[12px]'>Refund period ends in</p>
                                    <PresaleCountdownTimer time={Number(data.endTime) + Number(data.withdrawDelay)} />
                                </>
                            ) : (
                                <>
                                    <p className='text-primary text-[12px]'>Sale ends in</p>
                                    <PresaleCountdownTimer time={data.endTime} />
                                </>
                            )}
                        </div>

                        <div>
                            <img
                                src={data?.presaleInfo?.images?.logo}
                                className="h-[40px] w-full object-contain"
                                alt=""
                            />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <PresaleProgress
                        totalPaymentReceived={data.totalPaymentReceived}
                        hardCap={data.hardCap}
                        softCap={data.softCap}
                    />

                    {/* Stats */}
                    <div className="w-full">
                        <div className='flex items-center justify-between gap-x-3 w-full text-[14px]'>
                            <p>Participants</p>
                            <span className="bg-primary w-[20%] h-[2px]" />
                            <p>{data.purchaserCount ? data.purchaserCount : 0} Investors Participated.</p>
                        </div>
                        <div className='flex items-center justify-between gap-x-3 w-full text-[14px]'>
                            <p>Total Raised</p>
                            <div className="bg-primary w-[20%] h-[2px]" />
                            <span>{data.totalPaymentReceived ? Number(data.totalPaymentReceived).toLocaleString() : 0} {data.paymentToken.symbol} Raised</span>
                        </div>
                        <div className='flex items-center justify-between gap-x-3 w-full text-[14px]'>
                            <p>Badge</p>
                            <div className="bg-primary w-[20%] h-[2px]" />
                            <p>{badgeInfo.name}</p>
                        </div>
                        <div className='flex items-center justify-between gap-x-3 w-full text-[14px]'>
                            <p>Multiplier</p>
                            <div className="bg-primary w-[20%] h-[2px]" />
                            <p>{returnMultiplier(lockStake?.userData?.amountStaked)}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {authenticated ? (
                        <>
                            {pastRefundPeriod ? (
                                <button
                                    className="relative w-full py-3 mt-6 text-center overflow-hidden group-button"
                                    onClick={handleClaim}
                                    disabled={claimableAmount === 0}
                                >
                                    <span className="absolute inset-0 w-full h-fit bg-primary clip-path-polygon"></span>
                                    <span className="absolute inset-[2px] bg-primary transition-all duration-300 clip-path-polygon"></span>
                                    <span className="relative">
                                        {claimableAmount === 0
                                            ? "You have no tokens to claim"
                                            : `Claim Tokens ${Number(claimableAmount).toLocaleString()} ${data.saleToken.symbol}`
                                        }
                                    </span>
                                </button>
                            ) : (
                                <button
                                    className="relative w-full py-3 mt-6 text-center overflow-hidden group-button"
                                    onClick={() => {
                                        if (isBefore(new Date(), new Date(data.startTime * 1000))) {
                                            toast("Sale hasn't started yet");
                                            return;
                                        }
                                        setShowPaymentConfirmModal(true);
                                        setPurchaseAmount(Number(data.minTotalPayment));
                                    }}
                                >
                                    <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
                                    <span className="absolute inset-[2px] bg-primary transition-all duration-300 clip-path-polygon"></span>
                                    <span className="relative">
                                        {isRefundPeriod ? "Request Refund" : "Buy Tokens"}
                                    </span>
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            className="relative w-full py-3 mt-6 text-center overflow-hidden group-button"
                            onClick={login}
                        >
                            <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
                            <span className="absolute inset-[2px] bg-[#000027] transition-all duration-300 clip-path-polygon"></span>
                            <span className="relative flex items-center justify-center gap-2">
                                <IoWalletSharp className="w-5 h-5" />
                                <span>Connect Wallet</span>
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Left Column - Moved to bottom on mobile */}
            <div className="space-y-8 order-2 lg:order-1">
                {/* Project Details */}
                <div className="relative p-8 overflow-hidden group">
                    <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon opacity-100 transition-opacity duration-3"></span>
                    <span className="absolute inset-[2px] bg-[#000027] clip-path-polygon transition-all duration-300"></span>
                    <div className="relative space-y-6">
                        <div>
                            <p className='text-5xl lg:text-6xl uppercase font-bold tracking-tighter bg-gradient-to-r from-primary to-purple-300 bg-clip-text text-transparent'>
                                {data?.presaleInfo?.projectName}
                            </p>
                            <p className='text-primary text-lg uppercase font-medium tracking-[0.2em] mt-2'>
                                Participate in the Future
                            </p>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='bg-[#17043B]/50 p-6 border border-primary/20'>
                                <h3 className='text-xl font-semibold mb-4 text-primary'>Presale Details</h3>
                                <ul className='space-y-3'>
                                    <li className='flex justify-between'>
                                        <span className='text-gray-300'>IDO Type</span>
                                        <span className='font-medium'>Refundable sale</span>
                                    </li>
                                    <li className='flex justify-between'>
                                        <span className='font-medium text-gray-300'>Sale Access</span>
                                        <span className='text-primary underline'>{data.isPrivateSale ? "Private Sale" : "Public Sale"}</span>
                                    </li>
                                    <li className='flex justify-between'>
                                        <span className='text-gray-300'>Sale Period</span>
                                        <span className='font-medium'>
                                            {differenceInDays(new Date(data.endTime * 1000), new Date(data.startTime * 1000))}
                                            {differenceInDays(new Date(data.endTime * 1000), new Date(data.startTime * 1000)) === 1 ? " day" : " days"}
                                        </span>
                                    </li>
                                    <li className='flex justify-between'>
                                        <span className='text-gray-300'>Ticker</span>
                                        <span className='font-medium'>{data.saleToken.symbol}</span>
                                    </li>
                                    <li className='flex justify-between'>
                                        <span className='text-gray-300'>Token Price</span>
                                        {isAfter(new Date(), new Date(data.startTime * 1000)) ? (
                                            data.presaleInfo.hiddenData && data.presaleInfo.hiddenData.tokenPrice === "TBA" ? (
                                                <span className='font-medium'>${data.salePrice} {data.paymentToken.symbol}</span>
                                            ) : (
                                                <span className='font-medium'>${data.salePrice} {data.paymentToken.symbol}</span>
                                            )
                                        ) : (
                                            <span className='font-medium'>TBA</span>
                                        )}
                                    </li>

                                </ul>
                            </div>

                            <div className='bg-[#17043B]/50 p-6 border border-primary/20'>
                                <h3 className='text-xl font-semibold mb-4 text-primary'>Investment Details</h3>
                                <ul className='space-y-3'>
                                    <li className='flex justify-between'>
                                        <span className='text-gray-300'>Soft Cap</span>
                                        <span className='font-medium'>{Number(data.softCap).toLocaleString()} {data.paymentToken.symbol}</span>
                                    </li>
                                    <li className='flex justify-between'>
                                        <span className='text-gray-300'>Hard Cap</span>
                                        <span className='font-medium'>{Number(data.hardCap).toLocaleString()} {data.paymentToken.symbol}</span>
                                    </li>
                                    {data.presaleInfo.hiddenData && data.presaleInfo.hiddenData.totalIMC !== "TBA" && (
                                        <li className='flex justify-between'>
                                            <span className='text-gray-300'>Total IMC</span>
                                            <span className='font-medium'>{Number(data.presaleInfo.hiddenData.totalIMC).toLocaleString()} {data.saleToken.symbol}</span>
                                        </li>
                                    )}
                                    {isAfter(new Date(), new Date(data.startTime * 1000)) && (
                                        <li className='flex justify-between items-center'>
                                            <span className='text-gray-300'>Mainnet Contract</span>
                                            <span
                                                className='font-medium underline flex items-center gap-2 hover:text-primary cursor-pointer'
                                                onClick={() => copyAddress(data.saleToken.id)}
                                            >
                                                {data.saleToken.id.slice(0, 6)}...{data.saleToken.id.slice(-4)}
                                                <FaCopy size={15} />
                                            </span>
                                        </li>
                                    )}
                                    {data.linearVestingEndTime !== 0 && (
                                        <li className='flex justify-between'>
                                            <span className='text-gray-300'>Linear Vesting End</span>
                                            <span className='font-medium'>
                                                {data.linearVestingEndTime && data.linearVestingEndTime > 0 ? (
                                                    new Date(data.linearVestingEndTime * 1000).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                ) : (
                                                    <span className='text-gray-400'>TBA</span>
                                                )}
                                            </span>
                                        </li>)}
                                    {data.cliffPeriod && data.cliffPeriod.length > 0 && (
                                        <li className='flex flex-col'>
                                            <span className='text-gray-300 mb-2'>Cliff Vesting Periods</span>
                                            {data.cliffPeriod &&
                                                Array.isArray(data.cliffPeriod) &&
                                                data.cliffPeriod.length > 0 &&
                                                data.cliffPeriod[0].length > 0 ? (
                                                <div className='space-y-2'>
                                                    {data.cliffPeriod.map((period: any, index: number) => (
                                                        period.length > 0 && (
                                                            <div key={index} className='flex justify-between'>
                                                                <span className='text-gray-400'>
                                                                    {new Date(period.claimTime * 1000).toLocaleDateString('en-GB', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                                <span className='font-medium'>
                                                                    {period.pct}%
                                                                </span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className='text-gray-400'>TBA</span>
                                            )}
                                        </li>)
                                    }
                                    <li className='flex justify-between'>
                                        <span className='text-gray-300'>Refund Period</span>
                                        <span className='font-medium'>
                                            {Number(data.withdrawDelay) / 86400}
                                            {Number(data.withdrawDelay) / 86400 === 1 ? " Day" : " Days"}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="relative p-8 overflow-hidden group">
                    <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon opacity-100 transition-opacity duration-300"></span>
                    <span className="absolute inset-[2px] bg-[#000027] clip-path-polygon transition-all duration-300"></span>
                    <div className="relative">
                        <p className="text-primary text-[18px] uppercase font-normal tracking-[3px]">
                            About {data?.presaleInfo?.projectName}
                        </p>
                        <div className='text-[15px] lg:text-[18px] mt-[20px]'>
                            <p>{data?.presaleInfo?.description}</p>
                            {data?.presaleInfo?.description_md && markdownContent && (
                                <div className="markdown-content">
                                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        <div className='grid grid-cols-3 gap-x-5 my-10'>
                            <div>
                                <h3>Website</h3>
                                <a className='text-primary' href={data?.presaleInfo?.website}>{data?.presaleInfo?.website}</a>
                            </div>
                            <div>
                                <h3>Documents</h3>
                                <a href={data?.presaleInfo?.website} className='text-primary'>Whitepaper</a>
                            </div>
                            <div>
                                <img
                                    src={data?.presaleInfo?.images?.logo}
                                    className="h-[40px] w-full object-contain"
                                    alt=""
                                />
                            </div>
                        </div>

                        <div >
                            <h3>Social Media</h3>
                            <div className="flex space-x-4 mt-6">
                                {data?.presaleInfo?.socials?.twitter && (
                                    <a href={data.presaleInfo.socials.twitter} target="_blank" rel="noopener noreferrer">
                                        <FaTwitter className='hover:text-primary' size={20} />
                                    </a>
                                )}
                                {data?.presaleInfo?.socials?.telegram && (
                                    <a href={data.presaleInfo.socials.telegram} target="_blank" rel="noopener noreferrer">
                                        <FaTelegramPlane className='hover:text-primary' size={20} />
                                    </a>
                                )}
                                {data?.presaleInfo?.socials?.discord && (
                                    <a href={data.presaleInfo.socials.discord} target="_blank" rel="noopener noreferrer">
                                        <FaDiscord className='hover:text-primary' size={20} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {
                showPaymentConfirmModal && (
                    <ConfirmPurchase
                        onClose={() => setShowPaymentConfirmModal(false)}
                        onConfirm={handlePayment}
                        purchaseAmount={purchaseAmount}
                        loading={purchasing}
                        claimableAmount={claimableAmount}
                        handleClaim={handleClaim}
                        id={data.id as string}
                        maxAmount={data.maxTotalPayment}
                        minAmount={data.minTotalPayment}
                        requestRefund={requestRefund}
                        refunding={refunding}
                        isCashed={data.cashed}
                        isSaleOver={isSaleOver}
                        isRefundPeriod={isRefundPeriod}
                        isPastRefundPeriod={pastRefundPeriod}
                        setPurchaseAmount={setPurchaseAmount}
                        tokenSymbol={data.paymentToken.symbol}
                    />
                )
            }

            <TxReceipt
                visible={showTxModal}
                onClose={() => setShowTxModal(false)}
                title={txReceiptTitle}
                txHash={txHash}
            />
        </div>
    );
}