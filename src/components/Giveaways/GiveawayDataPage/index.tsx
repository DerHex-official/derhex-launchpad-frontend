import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGiveaway } from '../../../hooks/web3/useGiveaway';
import { Preloader, ThreeDots } from 'react-preloader-icon';
import {
    isBefore,
    isAfter,
    format
} from 'date-fns';
import {
    FaTwitter,
    FaTelegramPlane,
    FaDiscord,
    FaCopy
} from 'react-icons/fa';
import { PresaleCountdownTimer } from '../../Countdown';
import { toast } from 'react-hot-toast';
import TxReceipt from '../../Modal/TxReceipt';
import AirdropABI from "../../../abis/Airdrop.json";
import { publicClient } from "../../../config";
import { createWalletClient, custom } from "viem";
import { useChain } from "../../../context/ChainContext";
// import ConfirmClaim from '../../Modal/ConfirmClaim';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';
import { getClaimableTokens } from '../../../utils/web3/giveaway';
import { IoWalletSharp } from "react-icons/io5";
import { useLockStake } from '../../../hooks/web3/useLockStake';
import { usePageTitleGiveaway } from '../../../hooks/utils';
import { isWhitelisted } from '../../../utils/web3/giveaway';
import { useGiveawayPeriods } from '../../../hooks/web3/useGiveawayPeriods';

// The createViemWalletClient function will be defined inside the component


export default function GiveawaySelected() {
    const { publicClient } = useChain();

    // Add this function to create wallet client
    const createViemWalletClient = () => {
        return createWalletClient({
            chain: publicClient.chain,
            transport: custom(window.ethereum as any)
        });
    };

    const { id } = useParams<{ id: string }>();
    const { data, error, loading, refetch } = useGiveaway(id)
    const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState<boolean>(true);
    const [purchasing, setPurchasing] = useState<boolean>(false)
    const [txHash, setTxHash] = useState<`0x${string}`>("0x")
    const [showTxModal, setShowTxModal] = useState<boolean>(false);
    const [txReceiptTitle, setTxReceiptTitle] = useState<string>("Purchase Successful");
    const [purchaseAmount, setPurchaseAmount] = useState<number>(0);
    const { user, login, authenticated } = usePrivy();
    const { data: lockStake, error: lockStakeError, loading: lockStakeLoading } = useLockStake({ polling: true, userAddress: user?.wallet?.address as `0x${string}` })

    const [refunding, setProcessing] = useState<boolean>(false)
    const {
        isBeforeWhitelist,
        isWhitelistPeriod,
        isWithdrawDelayPeriod,
        isClaimPeriod
    } = useGiveawayPeriods(data);

    const [isUserWhitelisted, setIsUserWhitelisted] = useState<boolean>(false);

    // const [paymentMadeAmount, setPaymentMadeAmount] = useState<number>(0);
    const [claimableAmount, setClaimableAmount] = useState<number>(0);
    const [loadingInfo, setLoadingInfo] = useState<boolean>(true)



    usePageTitleGiveaway(`${data?.giveawayInfo?.projectName} Airdrop` || "Airdrop")

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);
    }, []);

    async function getInitData() {
        setLoadingInfo(true)
        if (!user?.wallet?.address) {
            // toast("Connect Wallet")
            login();
            return;
        }
        try {
            console.debug(data.id, user.wallet.address)
            const claimAmount = await getClaimableTokens(data.id as `0x${string}`, user.wallet.address as `0x${string}`)
            const isWhitelistedAddress = await isWhitelisted(data.id as `0x${string}`, user?.wallet?.address as `0x${string}`)

            setIsUserWhitelisted(isWhitelistedAddress);
            setClaimableAmount(claimAmount)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingInfo(false);
        }
    }

    useEffect(() => {
        if (!data) {
            console.log("No Data")
            return
        };

        console.log(data)

        getInitData();

    }, [authenticated, data]);


    function GiveawayStatus({ whitelistStartTime, whitelistEndTime, delay }: { whitelistStartTime: number, whitelistEndTime: number, delay: number }) {
        const whitelistStartTimeUnix = whitelistStartTime * 1000
        const whitelistEndTimeUnix = whitelistEndTime * 1000
        const delayPeriod = (Number(whitelistEndTime) + Number(delay)) * 1000


        if (isAfter(new Date(), new Date(whitelistEndTimeUnix)) && isBefore(new Date(), new Date(delayPeriod))) {
            return (
                <div className="bg-yellow-700/80 p-[3px_8px] w-fit text-[12px]">
                    <p className='text-yellow-300'>Claim Period</p>
                </div>)
        }

        if (isAfter(new Date(), new Date(whitelistEndTimeUnix))) {
            return (
                <div className="bg-green-700/80 p-[3px_8px] w-fit text-[12px]">
                    <p className='text-green-300'>Claim Period Started</p>
                </div>)
        }

        if (isAfter(new Date(), new Date(whitelistStartTimeUnix)) && isBefore(new Date(), new Date(whitelistEndTimeUnix))) {
            return (
                <div className="bg-green-700/80 p-[3px_8px] w-fit text-[12px]">
                    <p className='text-green-300'>Whitelist in Progress</p>
                </div>)
        }

        if (isBefore(new Date(), new Date(whitelistStartTimeUnix))) {
            return (
                <div className="bg-blue-700/80 p-[3px_8px] w-fit text-[12px]">
                    <p className='text-blue-300'>Upcoming Giveaway</p>
                </div>)
        }


        return null
    }

    // function PresaleProgress({ totalPaymentReceived, softCap, hardCap }: { totalPaymentReceived: number, softCap: number, hardCap: number }) {
    //     const [progress, setProgress] = useState<number>(0);
    //     const [target, setTarget] = useState<"Soft Cap" | "Hard Cap">("Soft Cap")

    //     console.log(totalPaymentReceived)

    //     useEffect(() => {
    //         if (Number(totalPaymentReceived) < Number(softCap)) {
    //             setTarget("Soft Cap");
    //             const percentage = (Number(totalPaymentReceived) / Number(softCap)) * 100;
    //             setProgress(percentage);
    //         } else {
    //             setTarget("Hard Cap");
    //             const percentage = (Number(totalPaymentReceived) / Number(hardCap)) * 100;
    //             if (percentage > 100) {
    //                 setProgress(100)
    //                 return;
    //             }
    //             setProgress(percentage);
    //         }
    //     }, [data])

    //     return (
    //         <div className="mt-[15px] flex flex-col items-start space-y-3 w-full">
    //             <p className='w-full flex items-center justify-between'>Progress ({progress.toFixed(2)}%) <span>{"--------->"}</span> <span>{target}</span> </p>
    //             <div className="h-[10px] w-full bg-white border border-primary/20">
    //                 <div style={{ width: `${progress}%` }} className="h-full bg-primary"></div>
    //             </div>
    //             <div className='flex justify-between w-full'>
    //                 <p className='text-primary text-[12px] font-semibold'>{Number(softCap).toLocaleString()} {data.paymentToken.symbol} </p>
    //                 <p className='text-primary text-[12px] font-semibold'>{Number(hardCap).toLocaleString()} {data.paymentToken.symbol} </p>
    //             </div>
    //         </div>
    //     )
    // }

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

    // console.log(data)

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

    async function handleWhitelist() {
        setProcessing(true)
        try {
            const walletClient = createViemWalletClient();
            const [account] = await walletClient.getAddresses();
            const { request } = await publicClient.simulateContract({
                address: data.id,
                abi: AirdropABI,
                account,
                functionName: "whitelist"
            })

            if (!isWhitelistPeriod) {
                toast("It is not yet whitelist period")
                setProcessing(false)
                return;
            }

            const hash = await walletClient.writeContract(request)
            toast("Successful Whitelist");
            setShowPaymentConfirmModal(false);

            setTxHash(hash)
            setTxReceiptTitle("Successful Whitelist")
            setTimeout(() => {
                setShowTxModal(true)
            }, 2000)

            setTimeout(async () => {
                await refetch();
            }, 5000)

        } catch (error: any) {
            console.error(error);
            if (error.message.includes("whitelist has not begun")) {
                toast("Whitelist has not begun")
                return;
            }
            if (error.message.includes("not staked")) {
                toast("Must stake in Lock & Stake to Participate")
                return;
            }
            toast.error("Whitelist Failed! Please Try Again Later")
        } finally {
            setProcessing(false)
        }
    }


    async function handleClaim() {
        setProcessing(true)
        try {
            const walletClient = createViemWalletClient();
            const [account] = await walletClient.getAddresses();

            if (!isClaimPeriod) {
                toast("It is not yet claim period")
                setProcessing(false)
                return;
            }

            const { request } = await publicClient.simulateContract({
                address: data.id,
                abi: AirdropABI,
                account,
                functionName: "claim"
            })

            const hash = await walletClient.writeContract(request)
            toast("Successful Claim");
            setShowPaymentConfirmModal(false);

            setTxHash(hash)
            setTxReceiptTitle("Successful Claim")
            setTimeout(() => {
                setShowTxModal(true)
            }, 2000)

            setTimeout(async () => {
                await refetch();
            }, 5000)

        } catch (error: any) {
            console.log(error.message)
            if (error.message.includes("no claimable tokens")) {
                toast("No Claimable Tokens")
                return;
            }
            if (error.message.includes("already withdrawn")) {
                toast("Already Withdrawn")
                return;
            }
            if (error.message.includes("not whitelisted")) {
                toast("Not Whitelisted")
                return;
            }
            if (error.message.includes("no tokens available to claim")) {
                toast("No Tokens Available to Claim")
                return;
            }
            toast('Claim Failed, please try again later')
        } finally {
            setProcessing(false)
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 p-[40px_20px] lg:p-[40px] text-white mobile-order">
            {/* Right Column - will appear first on mobile */}
            <div className="relative p-8 overflow-hidden group h-fit order-first lg:order-last">
                <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
                <span className="absolute inset-[2px] bg-[#000027] clip-path-polygon transition-all duration-300"></span>
                <div className="relative space-y-6">
                    {/* Presale Status */}
                    <div className="flex items-center justify-between">
                        <GiveawayStatus
                            whitelistStartTime={data.whitelistStartTime}
                            whitelistEndTime={data.whitelistEndTime}
                            delay={Number(data.withdrawDelay)}
                        />
                    </div>

                    {/* Countdown Timer */}
                    <div className="flex justify-between items-center flex-wrap">
                        <div className="mt-[10px] items-start flex flex-col space-x-[5px]">
                            {isBeforeWhitelist ? (
                                <>
                                    <p className='text-primary text-[12px]'>Whitelist starts in</p>
                                    <PresaleCountdownTimer time={data.whitelistStartTime} />
                                </>
                            ) : isClaimPeriod ? (
                                <>
                                    <p className='text-primary text-[12px]'>Claim Period Starts</p>
                                    <PresaleCountdownTimer time={Number(data.whitelistEndTime) + Number(data.withdrawDelay)} />
                                </>
                            ) : (
                                <>
                                    <p className='text-primary text-[12px]'>Whitelist ends in</p>
                                    <PresaleCountdownTimer time={data.whitelistEndTime} />
                                </>
                            )}
                        </div>

                        <div>
                            <img
                                src={data?.giveawayInfo?.images?.logo}
                                className="h-[30px] w-full object-contain"
                                alt=""
                            />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {/* <PresaleProgress
                        totalPaymentReceived={data.totalPaymentReceived}
                        hardCap={data.hardCap}
                        softCap={data.softCap}
                    /> */}

                    {/* Stats */}
                    <div className="w-full">
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
                        <div className='flex items-center justify-between gap-x-3 w-full text-[14px]'>
                            <p>Claimable</p>
                            <div className="bg-primary w-[20%] h-[2px]" />
                            <p>{claimableAmount} {data.airdropToken.symbol}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {authenticated ? (
                        <>
                            {isClaimPeriod && (
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
                                            : `Claim Tokens ${Number(claimableAmount).toLocaleString()} ${data.airdropToken.symbol}`
                                        }
                                    </span>
                                </button>
                            )}

                            {
                                isWhitelistPeriod && !isUserWhitelisted && (
                                    <button
                                        className="relative w-full py-3 mt-6 text-center overflow-hidden group-button"
                                        onClick={handleWhitelist}
                                    >
                                        <span className="absolute inset-0 w-full h-fit bg-primary clip-path-polygon"></span>
                                        <span className="absolute inset-[2px] bg-primary transition-all duration-300 clip-path-polygon"></span>
                                        <span className="relative">
                                            Whitelist
                                        </span>
                                    </button>
                                ) ||
                                isWhitelistPeriod && isUserWhitelisted && (
                                    <button
                                        className="relative w-full py-3 mt-6 text-center overflow-hidden group-button"
                                    >
                                        <span className="absolute inset-0 w-full h-fit bg-primary clip-path-polygon"></span>
                                        <span className="absolute inset-[2px] bg-primary transition-all duration-300 clip-path-polygon"></span>
                                        <span className="relative">
                                            Whitelisted
                                        </span>
                                    </button>
                                )
                            }
                            {
                                isBeforeWhitelist && (
                                    <button
                                        className="relative w-full py-3 mt-6 text-center overflow-hidden group-button"
                                        onClick={() => toast("Whitelist is upcoming")}
                                    >
                                        <span className="absolute inset-0 w-full h-fit bg-primary clip-path-polygon"></span>
                                        <span className="absolute inset-[2px] bg-primary transition-all duration-300 clip-path-polygon"></span>
                                        <span className="relative">
                                            Whitelist Upcoming
                                        </span>
                                    </button>
                                )
                            }
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

            {/* Left Column - will appear second on mobile */}
            <div className="space-y-8 order-last lg:order-first">
                {/* Project Details */}
                <div className="relative p-8 overflow-hidden group">
                    <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon opacity-100 transition-opacity duration-3"></span>
                    <span className="absolute inset-[2px] bg-[#000027] clip-path-polygon transition-all duration-300"></span>
                    <div className="relative space-y-6">
                        <div>
                            <p className='text-5xl lg:text-6xl uppercase font-bold tracking-tighter bg-gradient-to-r from-primary to-purple-300 bg-clip-text text-transparent'>
                                {data?.giveawayInfo?.projectName}
                            </p>
                            <p className='text-primary text-lg uppercase font-medium tracking-[0.2em] mt-2'>
                                Participate in the Future
                            </p>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='bg-[#17043B]/50 p-6 border border-primary/20'>
                                <h3 className='text-xl font-semibold mb-4 text-primary'>Airdrop Details</h3>
                                <ul className='space-y-3'>
                                    <li className='flex justify-between'>
                                        <span className='text-gray-300'>Whitelist Start Date</span>
                                        <span className='font-medium'>{format(new Date(data.whitelistStartTime * 1000), 'dd MMM yyyy HH:mm')}</span>
                                    </li>
                                    <li className='flex justify-between'>
                                        <span className='text-gray-300'>Whitelist End Date</span>
                                        <span className='font-medium'>{format(new Date(data.whitelistEndTime * 1000), 'dd MMM yyyy HH:mm')}</span>
                                    </li>
                                    <li className='flex justify-between'>
                                        <span className='text-gray-300'>Total Reward</span>
                                        <span className='font-medium'>{data.giveawayInfo?.totalReward.toLocaleString()} {data.airdropToken.symbol}</span>
                                    </li>
                                    <li className='flex justify-between items-center'>
                                        <span className='text-gray-300'>Giveaway Access</span>
                                        <span
                                            className='font-medium flex items-center gap-2 hover:text-primary cursor-pointer'
                                        >
                                            {data.isPrivateAirdrop ? "Private" : "Public"}
                                        </span>
                                    </li>
                                    <li className='flex justify-between items-center'>
                                        <span className='text-gray-300 text-nowrap'>Mainnet Contract</span>
                                        <span
                                            className='font-medium underline flex items-center gap-2 hover:text-primary cursor-pointer'
                                            onClick={() => copyAddress(data.airdropToken.id)}
                                        >
                                            {`${data.airdropToken.id.slice(0, 5)}...${data.airdropToken.id.slice(-6)}`}
                                            <FaCopy />
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
                    <div className="relative space-y-3">
                        <p className="text-primary text-[18px] uppercase font-normal tracking-[3px]">
                            About {data?.giveawayInfo?.projectName}
                        </p>
                        <div className='text-[15px] lg:text-[18px] mt-[20px]'>
                            <p>{data?.giveawayInfo?.description}</p>

                        </div>

                        <p className="text-primary text-[14px] uppercase font-normal tracking-[3px]">
                            Terms & Conditions
                        </p>
                        <p>Airdrop tokens are subject to project's determined allocation's vesting schedule also specified in the Airdrop page of the project.</p>

                        {data.isPrivateAirdrop ? (
                            <p>This is a private airdrop. Only whitelisted addresses can participate.</p>
                        ) : (
                            <p>
                                This is a public airdrop. All addresses can participate.
                            </p>
                        )}

                        <div className='grid grid-cols-3 gap-x-5 my-10'>
                            <div>
                                <h3>Website</h3>
                                <a className='text-primary' href={data?.giveawayInfo?.website}>{data?.giveawayInfo?.website}</a>
                            </div>
                            <div>
                                <h3>Documents</h3>
                                <a href={data?.giveawayInfo?.website} className='text-primary'>Whitepaper</a>
                            </div>
                            <div>
                                <img
                                    src={data?.giveawayInfo?.images?.logo}
                                    className="h-[40px] w-full object-contain"
                                    alt=""
                                />
                            </div>
                        </div>

                        <div >
                            <h3>Social Media</h3>
                            <div className="flex space-x-4 mt-6">
                                {data?.giveawayInfo?.socials?.twitter && (
                                    <a href={data.giveawayInfo.socials.twitter} target="_blank" rel="noopener noreferrer">
                                        <FaTwitter className='hover:text-primary' size={20} />
                                    </a>
                                )}
                                {data?.giveawayInfo?.socials?.telegram && (
                                    <a href={data.giveawayInfo.socials.telegram} target="_blank" rel="noopener noreferrer">
                                        <FaTelegramPlane className='hover:text-primary' size={20} />
                                    </a>
                                )}
                                {data?.giveawayInfo?.socials?.discord && (
                                    <a href={data.giveawayInfo.socials.discord} target="_blank" rel="noopener noreferrer">
                                        <FaDiscord className='hover:text-primary' size={20} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TxReceipt
                visible={showTxModal}
                onClose={() => setShowTxModal(false)}
                title={txReceiptTitle}
                txHash={txHash}
            />
        </div>
    );
}
