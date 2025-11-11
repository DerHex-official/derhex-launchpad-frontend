import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { useBond, useBondUser, useBondStakingTiers } from '../../../hooks/web3';
import { isAfter, isBefore, format, differenceInDays } from 'date-fns';
import Layout from '../../../layout';
import { Preloader, ThreeDots } from 'react-preloader-icon';
import { FaDiscord, FaGlobe, FaTelegram, FaTwitter } from 'react-icons/fa6';
import CurrentChain from '../../../components/Presale/CurrentChain';
import { publicClient } from '../../../config';
import { createWalletClient, custom, http, encodePacked, keccak256, toHex } from 'viem';
import { useChain } from '../../../context/ChainContext';
import BondABI from "../../../abis/Bond.json";
import erc20Abi from "../../../abis/ERC20.json";
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';
import { usePageTitleBonds } from '../../../hooks/utils/index.tsx';
import { getTokenAllowance, getTokenBalance } from '../../../utils/web3/actions';
import { getPurchasedTokensAmount } from '../../../utils/web3/bond';
import { getTokenData } from '../../../services/index.ts';


function CountdownTimer({
    whitelistStartTime,
    saleStartTime,
    saleEndTime,
    withdrawTime
}: {
    whitelistStartTime: number;
    saleStartTime: number;
    saleEndTime: number;
    withdrawTime: number;
}) {
    const now = new Date();
    let targetTime: Date | null = null;
    let label = '';
    let stageLabel = '';
    let stageColor = '';

    // Set the appropriate target time based on the current stage
    if (isBefore(now, new Date(whitelistStartTime * 1000))) {
        targetTime = new Date(whitelistStartTime * 1000);
        label = 'Whitelist starts in';
        stageLabel = 'UPCOMING';
        stageColor = 'from-blue-500/20 to-blue-600/30 text-blue-400';
    } else if (isBefore(now, new Date(saleStartTime * 1000))) {
        targetTime = new Date(saleStartTime * 1000);
        label = 'Sale starts in';
        stageLabel = 'WHITELIST OPEN';
        stageColor = 'from-purple-500/20 to-purple-600/30 text-purple-400';
    } else if (isBefore(now, new Date(saleEndTime * 1000))) {
        targetTime = new Date(saleEndTime * 1000);
        label = 'Sale ends in';
        stageLabel = 'SALE ACTIVE';
        stageColor = 'from-green-500/20 to-green-600/30 text-green-400';
    } else if (isBefore(now, new Date(withdrawTime * 1000))) {
        targetTime = new Date(withdrawTime * 1000);
        label = 'Claiming starts in';
        stageLabel = 'WAITING FOR CLAIM';
        stageColor = 'from-yellow-500/20 to-yellow-600/30 text-yellow-400';
    } else {
        // All periods have passed
        return (
            <div className="p-6 relative">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500/60 to-green-600/80"></div>
                <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-r from-green-500/20 to-green-600/30 px-4 py-2 mb-4">
                        <span className="text-green-400 text-sm font-medium tracking-wide">CLAIM ACTIVE</span>
                    </div>
                    <p className="text-gray-300">Claim period is now active</p>
                </div>
            </div>
        );
    }

    const calculateTimeLeft = () => {
        if (!targetTime) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        const difference = targetTime.getTime() - new Date().getTime();

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            // If countdown is complete, refresh the page to update the stage
            if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 &&
                newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
                window.location.reload();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetTime]);

    return (
        <div className="p-6 relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 to-primary/80"></div>
            <div className="flex flex-col items-center">
                <div className={`bg-gradient-to-r ${stageColor} px-4 py-2 mb-4`}>
                    <span className={`${stageColor.split(' ').pop()} text-sm font-medium tracking-wide`}>{stageLabel}</span>
                </div>
                <p className="text-lg text-gray-300 mb-6 font-medium">{label}</p>
                <div className="grid grid-cols-4 gap-4 w-full">
                    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 shadow-inner border border-gray-800/50">
                        <div className="text-2xl md:text-3xl font-bold text-white mb-1">{timeLeft.days}</div>
                        <div className="text-xs text-gray-400">Days</div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 shadow-inner border border-gray-800/50">
                        <div className="text-2xl md:text-3xl font-bold text-white mb-1">{timeLeft.hours}</div>
                        <div className="text-xs text-gray-400">Hours</div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 shadow-inner border border-gray-800/50">
                        <div className="text-2xl md:text-3xl font-bold text-white mb-1">{timeLeft.minutes}</div>
                        <div className="text-xs text-gray-400">Mins</div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 shadow-inner border border-gray-800/50">
                        <div className="text-2xl md:text-3xl font-bold text-white mb-1">{timeLeft.seconds}</div>
                        <div className="text-xs text-gray-400">Secs</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProgressBar({ totalSold, bondSize }: { totalSold: number; bondSize: number }) {
    const progress = (totalSold / bondSize) * 100;
    const progressPercent = Math.min(100, progress).toFixed(1);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-medium">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-800 h-3 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-primary/80 to-primary h-full"
                    style={{ width: `${Math.min(100, progress)}%` }}
                ></div>
            </div>
            <div className="flex justify-between mt-1.5 text-sm">
                <span className="text-gray-300">{Number(totalSold).toLocaleString()}</span>
                <span className="text-gray-400">{Number(bondSize).toLocaleString()}</span>
            </div>
        </div>
    );
}

function BondStage({
    bond,
    userData,
    onWhitelist,
    onPurchase,
    onClaim,
    onRefund,
    isConnected,
    onConnect,
    purchasingStatus,
    loading,
    refundStatus
}: {
    bond: any;
    userData: any;
    onWhitelist: () => void;
    onPurchase: (amount: string) => void;
    onClaim: () => void;
    onRefund: () => void;
    isConnected: boolean;
    onConnect: () => void;
    purchasingStatus: 'idle' | 'approving' | 'purchasing';
    loading: boolean;
    refundStatus?: 'idle' | 'processing';
}) {

    const now = new Date();
    const [purchaseAmount, setPurchaseAmount] = useState('');

    const whitelistStartDate = new Date(bond.whitelistStartTime * 1000);
    const saleStartDate = new Date(bond.saleStartTime * 1000);
    const saleEndDate = new Date(bond.saleEndTime * 1000);
    const withdrawDate = new Date(bond.withdrawTime * 1000);

    // Before whitelist
    if (isBefore(now, whitelistStartDate)) {
        return (
            <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/30 px-4 py-2 mb-4">
                        <span className="text-blue-400 text-sm font-medium tracking-wide">Coming Soon</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Bond not started yet</h3>
                    <p className="text-gray-400 text-center max-w-sm">
                        The whitelist period will start on {format(whitelistStartDate, "PPP 'at' p")}
                    </p>
                </div>
                <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-5 border border-gray-800/30">
                    <p className="text-sm text-gray-400 text-center">Stay tuned for this exciting bond opportunity!</p>
                </div>
            </div>
        );
    }

    // Whitelist period
    if (isBefore(now, saleStartDate)) {
        return (
            <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/30 px-4 py-2 mb-4">
                        <span className="text-purple-400 text-sm font-medium tracking-wide">Whitelist Open</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Join the Whitelist</h3>
                </div>

                {!isConnected ? (
                    <button
                        onClick={onConnect}
                        className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white py-3.5 px-6 font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        Connect Wallet to Join Whitelist
                    </button>
                ) : userData?.isWhitelisted ? (
                    <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] border border-green-500/20 p-5 text-center">
                        <div className="flex flex-col items-center">
                            <div className="bg-green-500/10 p-3 mb-3">
                                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <p className="font-medium text-green-400 mb-1">You are whitelisted for this bond</p>
                            <p className="text-sm text-gray-400">You'll be able to participate when the sale starts</p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-400 mb-5 text-center">
                            Join the whitelist now to participate in this bond sale when it opens.
                        </p>
                        <button
                            onClick={onWhitelist}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white py-3.5 px-6 font-medium disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <Preloader
                                        use={ThreeDots}
                                        size={20}
                                        strokeWidth={6}
                                        strokeColor="#FFFFFF"
                                        duration={2000}
                                    />
                                    <span className="ml-2">Processing...</span>
                                </span>
                            ) : (
                                "Join Whitelist"
                            )}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Sale period
    if (isBefore(now, saleEndDate)) {
        return (
            <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-gradient-to-r from-green-500/20 to-green-600/30 px-4 py-2 mb-4">
                        <span className="text-green-400 text-sm font-medium tracking-wide">Sale Active</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Bond Purchase</h3>
                </div>

                {!isConnected ? (
                    <button
                        onClick={onConnect}
                        className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white py-3.5 px-6 font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        Connect Wallet to Purchase
                    </button>
                ) : !userData?.isWhitelisted ? (
                    <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] border border-red-500/20 p-5">
                        <div className="flex flex-col items-center">
                            <div className="bg-red-500/10 p-3 mb-3">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <p className="font-medium text-red-400 mb-1">You are not whitelisted for this bond</p>
                            <p className="text-sm text-gray-400">Unfortunately, you cannot participate in this bond sale</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-sm mx-auto">
                        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] border border-gray-800/30 p-5 mb-5">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Current Discount</p>
                                    <p className="text-lg font-medium text-green-500">{(bond.currentDiscount).toFixed(2)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Your Allocation</p>
                                    <p className="text-lg font-medium">{bond?.bondAllocation || 0} {bond.paymentToken.symbol}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">You've Paid</p>
                                <p className="text-xl font-medium">{userData?.amountPaid || 0} <span className="text-gray-400 text-sm">{bond.paymentToken.symbol}</span></p>
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="block text-gray-300 mb-2 font-medium">Purchase Amount</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={purchaseAmount}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9.]/g, '');
                                        const maxAllocation = parseFloat(bond.bondAllocation);
                                        const numericValue = parseFloat(value);

                                        if (!isNaN(numericValue) && numericValue <= maxAllocation) {
                                            setPurchaseAmount(value);
                                        } else if (value === '') {
                                            setPurchaseAmount('');
                                        }
                                    }}
                                    disabled={purchasingStatus !== 'idle'}
                                    className="w-full p-3.5 bg-[#1A1A1A] border border-gray-700 text-white disabled:bg-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="Enter amount to purchase"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    {bond.paymentToken.symbol}
                                </div>
                            </div>
                            {purchaseAmount && Number(purchaseAmount) > 0 && (
                                <div className="mt-2 text-xs text-gray-300 bg-primary/10 p-2.5 border border-primary/20">
                                    <span>
                                        You will receive approximately {
                                            ((Number(purchaseAmount) * bond.paymentTokenPrice) /
                                                (bond.saleTokenPrice * (1 - bond.currentDiscount / 100))
                                            ).toFixed(2)} {bond.saleToken.symbol}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {userData?.amountPaid > 0 && (
                                <button
                                    onClick={onRefund}
                                    disabled={refundStatus === 'processing' || loading}
                                    className="w-full bg-gradient-to-r from-amber-600/90 to-amber-700 hover:from-amber-600 hover:to-amber-700/90 text-white py-3.5 px-6 font-medium disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {refundStatus === 'processing' ? (
                                        <span className="flex items-center justify-center">
                                            <Preloader
                                                use={ThreeDots}
                                                size={20}
                                                strokeWidth={6}
                                                strokeColor="#FFFFFF"
                                                duration={2000}
                                            />
                                            <span className="ml-2">Processing Refund...</span>
                                        </span>
                                    ) : (
                                        "Request Refund"
                                    )}
                                </button>
                            )}

                            <button
                                onClick={() => onPurchase(purchaseAmount)}
                                disabled={purchasingStatus !== 'idle' || !purchaseAmount || parseFloat(purchaseAmount) <= 0}
                                className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white py-3.5 px-6 font-medium disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
                            >
                                {purchasingStatus === 'approving' ? (
                                    <span className="flex items-center justify-center">
                                        <Preloader
                                            use={ThreeDots}
                                            size={20}
                                            strokeWidth={6}
                                            strokeColor="#FFFFFF"
                                            duration={2000}
                                        />
                                        <span className="ml-2">Approving Tokens...</span>
                                    </span>
                                ) : purchasingStatus === 'purchasing' ? (
                                    <span className="flex items-center justify-center">
                                        <Preloader
                                            use={ThreeDots}
                                            size={20}
                                            strokeWidth={6}
                                            strokeColor="#FFFFFF"
                                            duration={2000}
                                        />
                                        <span className="ml-2">Purchasing...</span>
                                    </span>
                                ) : (
                                    "Purchase Bond"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Waiting for claim period
    if (isBefore(now, withdrawDate)) {
        return (
            <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/30 px-4 py-2 mb-4">
                        <span className="text-yellow-400 text-sm font-medium tracking-wide">Sale Ended</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">Bond Sale Ended</h3>
                    <p className="text-gray-400 text-center max-w-sm mb-2">
                        Claiming period will start on {format(withdrawDate, "PPP 'at' p")}
                    </p>
                </div>

                {!isConnected ? (
                    <button
                        onClick={onConnect}
                        className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white py-3.5 px-6 font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        Connect Wallet
                    </button>
                ) : userData?.amountPaid > 0 ? (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] border border-gray-800/30 p-5">
                            <p className="text-gray-400 text-sm mb-1">Your Participation</p>
                            <p className="text-2xl font-bold">{userData.amountPaid} <span className="text-gray-400 text-sm font-normal">{bond.paymentToken.symbol}</span></p>
                            <div className="mt-3 pt-3 border-t border-gray-800">
                                <p className="text-gray-400 text-sm mb-1">Estimated Tokens to Receive</p>
                                <p className="text-lg font-medium">
                                    {userData?.purchasedTokens !== null ? userData?.purchasedTokens.toFixed(2) : 'Loading...'} {bond.saleToken.symbol}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onRefund}
                            disabled={refundStatus === 'processing' || loading}
                            className="w-full bg-gradient-to-r from-amber-600/90 to-amber-700 hover:from-amber-600 hover:to-amber-700/90 text-white py-3.5 px-6 font-medium disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {refundStatus === 'processing' ? (
                                <span className="flex items-center justify-center">
                                    <Preloader
                                        use={ThreeDots}
                                        size={20}
                                        strokeWidth={6}
                                        strokeColor="#FFFFFF"
                                        duration={2000}
                                    />
                                    <span className="ml-2">Processing Refund...</span>
                                </span>
                            ) : (
                                "Request Refund"
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] border border-gray-800/30 p-5">
                        <p className="text-gray-400 text-center">You didn't participate in this bond sale</p>
                    </div>
                )}
            </div>
        );
    }

    // Claim period
    return (
        <div className="p-6">
            {/* <div className="flex flex-col items-center mb-6">
                <div className="bg-gradient-to-r from-green-500/20 to-green-600/30 px-4 py-2 mb-4">
                    <span className="text-green-400 text-sm font-medium tracking-wide">Claim Active</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Claim Period</h3>
            </div> */}

            {!isConnected ? (
                <button
                    onClick={onConnect}
                    className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white py-3.5 px-6 font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Connect Wallet to Claim
                </button>
            ) : userData?.amountPaid > 0 && userData?.claimableTokens === 0 ? (
                <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] border border-green-500/20 p-5">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-green-500/10 p-3 mb-3">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <p className="font-medium text-green-400 mb-1">You've successfully claimed all your tokens</p>
                        <p className="text-sm text-gray-400 text-center">Thank you for participating in this bond</p>
                    </div>
                </div>
            ) : userData?.claimableTokens === 0 ? (
                <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] border border-yellow-500/20 p-5">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-yellow-500/10 p-3 mb-3">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <p className="font-medium text-yellow-400 mb-1">You don't have any tokens to claim right now</p>
                        <p className="text-sm text-gray-400 text-center">Your tokens may be subject to vesting</p>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] border border-gray-800/30 p-5">
                    <p className="text-gray-400 text-center">You didn't participate in this bond</p>
                </div>
            )}
        </div>
    );
}


// The createViemWalletClient function will be defined inside the component


function BondDetail() {
    const { publicClient } = useChain();

    // Add this function to create wallet client
    const createViemWalletClient = () => {
        return createWalletClient({
            chain: publicClient.chain,
            transport: custom(window.ethereum as any)
        });
    };

    const { id } = useParams();
    const navigate = useNavigate();
    const { authenticated, login } = usePrivy();
    const { wallets } = useWallets();
    const [wallet, setWallet] = useState<any>(null);
    const [currentChain, setCurrentChain] = useState('84532');

    const [loading, setLoading] = useState(false);
    const [purchasingStatus, setPurchasingStatus] = useState<'idle' | 'approving' | 'purchasing'>('idle');
    const [refundStatus, setRefundStatus] = useState<'idle' | 'processing'>('idle');

    // First, fetch the bond data using the project name from URL parameter
    const { data: bondData, loading: bondLoading, error: bondError, refetch } = useBond(id || null);

    // Always initialize these hooks with fallback values when bondData is undefined
    // This ensures hooks are always called in the same order
    const bondId = bondData?.id as `0x${string}` || '0x0000000000000000000000000000000000000000';
    const walletAddress = wallet?.address as `0x${string}` || '0x0000000000000000000000000000000000000000';


    // Now call the other hooks with default values to ensure they're always called
    const { data: stakingTiers, loading: tiersLoading } = useBondStakingTiers(bondId);
    const { data: userData, loading: userDataLoading } = useBondUser(bondId, walletAddress, { polling: true });

    const [priceData, setPriceData] = useState<
        {
            token: `0x${string}`,
            price: bigint,
            timestamp: bigint,
            signature: `0x${string}`
        }
    >(
        {
            token: '0x0000000000000000000000000000000000000000',
            price: 0n,
            timestamp: 0n,
            signature: '0x0000000000000000000000000000000000000000000000000000000000000000'
        }
    );


    // Set wallet and chain
    useEffect(() => {
        if (authenticated && wallets.length > 0) {
            const activeWallet = wallets[0];
            setWallet(activeWallet);

            const chainInfo = activeWallet.chainId;
            const chainId = chainInfo.split(':')[1];
            setCurrentChain(chainId);
        }
        document.title = `Join ${bondData?.bondInfo?.projectName} Bond on DerHex Launchpad` || "Bond Details";
    }, [authenticated, wallets, bondData]);

    // Mock functions for bond actions - these would be replaced with actual contract interactions
    const handleWhitelist = async () => {
        const walletClient = await createViemWalletClient();
        const [account] = await walletClient.getAddresses();

        setLoading(true);
        try {
            const { request } = await publicClient.simulateContract({
                address: bondId,
                abi: BondABI,
                functionName: "whitelist",
                account
            });

            const hash = await walletClient.writeContract(request);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt && receipt.status === "success") {
                toast.success("Successfully Whitelisted");
                await refetch();
            }
        } catch (error: any) {
            console.log(error);
            if (error.message.includes("User rejected the request")) {
                toast.error("User Rejected the Request");
                return;
            }
            if (error.message.includes("already whitelisted")) {
                toast.error("Already Whitelisted");
                return;
            }
            if (error.message.includes("whitelist has not begun")) {
                toast.error("Whitelist has not begun");
                return;
            }
            if (error.message.includes("staked amount less than requirement")) {
                toast.error("Must stake in Lock & Stake to Participate");
                return;
            }
            if (error.message.includes("sale has started")) {
                toast.error("Whitelist is Over!");
                return;
            }
            toast.error("Whitelist Failed! Please Try Again Later");
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (amount: string) => {
        if (!amount) return;

        try {
            // Set initial purchasing status
            setPurchasingStatus('approving');

            const walletClient = await createViemWalletClient();
            const [account] = await walletClient.getAddresses();
            const amountToPurchase = ethers.parseUnits(amount, bondData.paymentToken.decimals);

            // Check token balance first
            const tokenBalance = await getTokenBalance(
                bondData.paymentToken.id as `0x${string}`,
                wallet?.address as `0x${string}`
            );

            if (Number(tokenBalance) < Number(amount)) {
                toast.error(`You don't have enough ${bondData.paymentToken.symbol}`);
                setPurchasingStatus('idle');
                return;
            }

            // Approve Token Spending
            const allowance = await getTokenAllowance(
                bondData.paymentToken.id as `0x${string}`,
                bondId,
                wallet?.address as `0x${string}`
            );

            // Check if allowance is less than purchase amount
            if (Number(allowance) < Number(amount)) {
                toast('Approving token spending...');

                try {
                    // Allow Contract to Spend
                    const { request } = await publicClient.simulateContract({
                        address: bondData.paymentToken.id as `0x${string}`,
                        account,
                        abi: erc20Abi,
                        functionName: "approve",
                        args: [bondId, amountToPurchase]
                    });

                    // Run Approval
                    const txHash = await walletClient.writeContract(request);
                    toast('Approval transaction submitted...');

                    const receipt = await publicClient.waitForTransactionReceipt({
                        hash: txHash
                    });

                    if (receipt.status !== 'success') {
                        toast.error('Token approval failed');
                        setPurchasingStatus('idle');
                        return;
                    }

                    toast.success('Token approval successful');
                } catch (error: any) {
                    console.error('Approval error:', error);
                    if (error.message.includes("User rejected the request")) {
                        toast.error("User rejected the approval");
                    } else {
                        toast.error("Token approval failed");
                    }
                    setPurchasingStatus('idle');
                    return;
                }
            }

            // Now proceed with the purchase
            setPurchasingStatus('purchasing');
            toast('Preparing purchase transaction...');

            const signerAccount = privateKeyToAccount(import.meta.env.VITE_TRUSTED_SIGNER_PRIVATE_KEY);

            const tokenAddress = bondData.saleToken.id;
            const price = ethers.parseUnits("0.1", 18);
            const timestamp = BigInt(Math.floor(Date.now() / 1000));
            const packed = encodePacked(
                ['address', 'uint256', 'uint256'],
                [tokenAddress, price, timestamp]
            );

            const messageHash = keccak256(packed);
            const signature = await signerAccount.signMessage({ message: { raw: messageHash } });

            const priceData = {
                token: tokenAddress,
                price,
                timestamp,
                signature,
            };

            const { request } = await publicClient.simulateContract({
                address: bondId,
                abi: BondABI,
                functionName: "purchase",
                args: [amountToPurchase, priceData],
                account
            });

            const hash = await walletClient.writeContract(request);
            toast('Purchase transaction submitted...');

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt && receipt.status === "success") {
                toast.success("Successfully Purchased Bond");
                await refetch();
            } else {
                toast.error("Purchase transaction failed");
            }
        } catch (error: any) {
            console.error("Error during purchase process:", error);

            if (error.message.includes("User rejected the request")) {
                toast.error("User rejected the purchase");
            } else if (error.message.includes("sale has not begun")) {
                toast.error('Sale has not started yet');
            } else if (error.message.includes("not whitelisted")) {
                toast.error("Must whitelist to participate");
            } else if (error.message.includes("Purchase exceeds bond allocation")) {
                toast.error("Purchase exceeds bond allocation");
            } else if (error.message.includes("Purchase exceeds bond size")) {
                toast.error("Purchase exceeds bond size");
            }
            else {
                toast.error("Purchase failed! Please try again later");
            }
        } finally {
            setPurchasingStatus('idle');
        }
    };

    const handleClaim = async () => {
        const walletClient = await createViemWalletClient();
        const [account] = await walletClient.getAddresses();

        setLoading(true);
        try {
            const { request } = await publicClient.simulateContract({
                address: bondId,
                abi: BondABI,
                functionName: "claim",
                account
            });

            const hash = await walletClient.writeContract(request);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt && receipt.status === "success") {
                toast.success("Successfully Claimed Bond");
                await refetch();
            }
        }
        catch (error: any) {
            console.error(error);
            if (error.message.includes("claim period has not started")) {
                toast.error("Claim Period has not started");
            }
            if (error.message.includes("Nothing to claim")) {
                toast.error("No Claimable Tokens");
            }
            if (error.message.includes("No tokens unlocked")) {
                toast.error("No Tokens Unlocked");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async () => {
        const walletClient = await createViemWalletClient();
        const [account] = await walletClient.getAddresses();

        setRefundStatus('processing');
        try {
            const now = Math.floor(Date.now() / 1000);
            const canRefund = now >= bondData.saleStartTime && now <= bondData.saleEndTime + bondData.withdrawDelay;

            if (!canRefund) {
                toast.error("Refund is only available during the sale period and withdraw delay");
                setRefundStatus('idle');
                return;
            }

            const { request } = await publicClient.simulateContract({
                address: bondId,
                abi: BondABI,
                functionName: "refund",
                account
            });

            const hash = await walletClient.writeContract(request);
            toast('Refund transaction submitted...');

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            if (receipt && receipt.status === "success") {
                toast.success("Successfully Refunded");
                await refetch();
            } else {
                toast.error("Refund transaction failed");
            }
        } catch (error: any) {
            console.error("Error during refund process:", error);

            if (error.message.includes("User rejected the request")) {
                toast.error("User rejected the refund request");
            } else if (error.message.includes("Not in sale period")) {
                toast.error("Refund is only available during the sale period");
            } else if (error.message.includes("Withdraw delay period has ended")) {
                toast.error("Refund period has ended");
            } else if (error.message.includes("No tokens purchased")) {
                toast.error("You have no tokens to refund");
            } else {
                toast.error("Refund failed! Please try again later");
            }
        } finally {
            setRefundStatus('idle');
        }
    };

    if (bondLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-[500px]">
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

    if (bondError.message || !bondData) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-red-500 text-xl font-medium mt-4">Bond Not Found</h3>
                    <p className="text-gray-400 max-w-md mt-2">
                        We couldn't find the bond you're looking for. It may have been removed or you might have followed an invalid link.
                    </p>
                    <button
                        onClick={() => navigate('/deals/bonds')}
                        className="mt-6 px-6 py-2  bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    >
                        Back to Bonds
                    </button>
                </div>
            </Layout>
        );
    }


    return (
        <Layout>
            <div className="font-space text-white min-h-screen">
                {/* Hero section with background */}
                <div className="relative h-[360px] border-b border-primary/20">
                    <img
                        src={bondData.bondInfo?.images?.bg}
                        alt={bondData.bondInfo?.projectName}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90"></div>

                    {/* Project logo and name */}
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
                        <div className="container mx-auto">
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="h-24 w-24 overflow-hidden bg-black border-4 border-primary shadow-lg">
                                    <img
                                        src={bondData.bondInfo?.images?.logo}
                                        alt={bondData.bondInfo?.projectName}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">{bondData.bondInfo?.projectName}</h1>
                                    <div className="flex items-center gap-4">
                                        {bondData.bondInfo?.website && (
                                            <a
                                                href={bondData.bondInfo.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white hover:text-primary transition-colors p-2 bg-white/10"
                                            >
                                                <FaGlobe size={18} />
                                            </a>
                                        )}
                                        {bondData.bondInfo?.socials?.twitter && (
                                            <a
                                                href={bondData.bondInfo.socials.twitter}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white hover:text-primary transition-colors p-2 bg-white/10"
                                            >
                                                <FaTwitter size={18} />
                                            </a>
                                        )}
                                        {bondData.bondInfo?.socials?.telegram && (
                                            <a
                                                href={bondData.bondInfo.socials.telegram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white hover:text-primary transition-colors p-2 bg-white/10"
                                            >
                                                <FaTelegram size={18} />
                                            </a>
                                        )}
                                        {bondData.bondInfo?.socials?.discord && (
                                            <a
                                                href={bondData.bondInfo.socials.discord}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white hover:text-primary transition-colors p-2 bg-white/10"
                                            >
                                                <FaDiscord size={18} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    <div className="bg-[#291254] p-3 px-4 shadow flex items-center gap-2">
                                        <CurrentChain chainId={bondData?.chainId || currentChain} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left column */}
                        <div className="lg:w-2/3">
                            {/* Project description */}
                            <div className="bg-[#111115] shadow-lg p-6 mb-6 border border-gray-800/30">
                                <h2 className="text-xl font-bold mb-4 flex items-center">
                                    <span className="w-1 h-6 bg-primary mr-3"></span>
                                    About {bondData.bondInfo?.projectName}
                                </h2>
                                <p className="text-gray-300 leading-relaxed">
                                    {bondData.bondInfo?.description}
                                </p>
                            </div>

                            {/* Bond stats */}
                            <div className="bg-[#111115] shadow-lg p-6 border border-gray-800/30">
                                <h2 className="text-xl font-bold mb-6 flex items-center">
                                    <span className="w-1 h-6 bg-primary mr-3"></span>
                                    Bond Details
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 border border-gray-800/30">
                                            <p className="text-gray-400 text-sm mb-1">Bond Type</p>
                                            <p className="text-lg font-medium">
                                                {bondData.bondType === 0 ? 'Dynamic' : 'Fixed'} Bond
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 border border-gray-800/30">
                                            <p className="text-gray-400 text-sm mb-1">Bond Size</p>
                                            <p className="text-lg font-medium">
                                                {Number(bondData.bondSize).toLocaleString()} {bondData.saleToken.symbol}
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 border border-gray-800/30">
                                            <p className="text-gray-400 text-sm mb-1">Discount Range</p>
                                            <p className="text-lg font-medium">
                                                {(bondData.initialDiscountPercentage).toFixed()}% to {(bondData.finalDiscountPercentage).toFixed()}%
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 border border-gray-800/30">
                                            <p className="text-gray-400 text-sm mb-1">Current Discount</p>
                                            <div className="flex items-center">
                                                <p className="text-lg font-medium">
                                                    {(bondData.currentDiscount).toFixed(2)}%
                                                </p>
                                                <span className="ml-2 px-2 py-0.5 bg-green-600/20 text-green-500 text-xs rounded-full">
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 border border-gray-800/30">
                                            <ProgressBar
                                                totalSold={Number(bondData.totalSold)}
                                                bondSize={Number(bondData.bondSize)}
                                            />
                                        </div>

                                        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 border border-gray-800/30">
                                            <p className="text-gray-400 text-sm mb-1">Access Type</p>
                                            <div className="flex items-center">
                                                <p className="text-lg font-medium">
                                                    {bondData.isPrivateBond ? 'Private' : 'Public'} Bond
                                                </p>
                                                {bondData.isPrivateBond && (
                                                    <span className="ml-2 px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                                                        Staking Required
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#131316] p-4 border border-gray-800/30">
                                            <p className="text-gray-400 text-sm mb-1">Vesting Period</p>
                                            <p className="text-lg font-medium">
                                                {bondData.linearVestingEndTime && bondData.linearVestingEndTime > 0 ? (
                                                    `${differenceInDays(new Date(bondData.linearVestingEndTime * 1000), new Date(bondData.withdrawTime * 1000))} days linear vesting`
                                                ) : bondData.cliffPeriod && bondData.cliffPeriod.length > 0 ? (
                                                    'Cliff vesting'
                                                ) : (
                                                    'No vesting'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right column - Combined Bond Status & Participate Component */}
                        <div className="lg:w-1/3 space-y-6">
                            {/* First Card: Bond Status & Countdown */}
                            <div className="bg-[#111115] shadow-lg overflow-hidden border border-gray-800/30">
                                {/* Header section with the current stage */}
                                <div className="p-5 bg-gradient-to-r from-[#171717] to-[#121215] border-b border-gray-800 flex justify-between items-center">
                                    <h3 className="text-lg font-bold">Bond Status</h3>

                                    {/* Show stage label based on current time */}
                                    {(() => {
                                        const now = new Date();
                                        let stageLabel = '';
                                        let stageClass = '';

                                        if (isBefore(now, new Date(bondData.whitelistStartTime * 1000))) {
                                            stageLabel = 'UPCOMING';
                                            stageClass = 'from-blue-500/20 to-blue-600/30 text-blue-400';
                                        } else if (isBefore(now, new Date(bondData.saleStartTime * 1000))) {
                                            stageLabel = 'WHITELIST';
                                            stageClass = 'from-purple-500/20 to-purple-600/30 text-purple-400';
                                        } else if (isBefore(now, new Date(bondData.saleEndTime * 1000))) {
                                            stageLabel = 'SALE LIVE';
                                            stageClass = 'from-green-500/20 to-green-600/30 text-green-400';
                                        } else if (isBefore(now, new Date(bondData.withdrawTime * 1000))) {
                                            stageLabel = 'ENDED';
                                            stageClass = 'from-yellow-500/20 to-yellow-600/30 text-yellow-400';
                                        } else {
                                            stageLabel = 'CLAIM';
                                            stageClass = 'from-green-500/20 to-green-600/30 text-green-400';
                                        }

                                        return (
                                            <div className={`bg-gradient-to-r ${stageClass} px-4 py-1.5`}>
                                                <span className={`${stageClass.split(' ').pop()} text-sm font-medium tracking-wide`}>
                                                    {stageLabel}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Countdown timer */}
                                <div className="bg-[#131316]">
                                    <CountdownTimer
                                        whitelistStartTime={bondData.whitelistStartTime}
                                        saleStartTime={bondData.saleStartTime}
                                        saleEndTime={bondData.saleEndTime}
                                        withdrawTime={bondData.withdrawTime}
                                    />
                                </div>
                            </div>

                            {/* Second Card: Action Panel */}
                            <div className="bg-[#111115] shadow-lg overflow-hidden border border-gray-800/30">
                                <div className="p-5 bg-gradient-to-r from-[#171717] to-[#121215] border-b border-gray-800">
                                    <h3 className="text-lg font-bold">Participate</h3>
                                </div>
                                <BondStage
                                    bond={bondData}
                                    userData={userData}
                                    onWhitelist={handleWhitelist}
                                    onPurchase={handlePurchase}
                                    onClaim={handleClaim}
                                    onRefund={handleRefund}
                                    isConnected={authenticated}
                                    onConnect={login}
                                    purchasingStatus={purchasingStatus}
                                    loading={loading}
                                    refundStatus={refundStatus}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default BondDetail;