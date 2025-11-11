import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import Layout from '../../../layout/Admin';
import { Preloader, ThreeDots } from 'react-preloader-icon';
import { getContractAddress } from '../../../utils/source';
import BondFactoryABI from '../../../abis/BondFactory.json';
import ERC20ABI from '../../../abis/ERC20.json';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { createWalletClient, custom } from "viem";
import TxReceipt from '../../../components/Modal/TxReceipt/index.tsx';
import { usePageTitle } from '../../../hooks/utils/index.tsx';
import { useChain } from '../../../context/ChainContext';

interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
}

// The createViemWalletClient function will be defined inside the component


function BondCreator() {
    const { publicClient } = useChain();
    const { publicClient: client } = useChain();

    // Add this function to create wallet client
    const createViemWalletClient = () => {
        return createWalletClient({
            chain: publicClient.chain,
            transport: custom(window.ethereum as any)
        });
    };

    const navigate = useNavigate();
    const { authenticated, login } = usePrivy();
    const { wallets } = useWallets();
    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    usePageTitle("Create Bond");

    const [txReceiptTitle] = useState<string>("Successfully Created New Bond");
    const [showTxModal, setShowTxModal] = useState<boolean>(false);
    const [txHash, setTxHash] = useState<`0x${string}`>("0x");


    // Token inputs and validation states
    const [paymentTokenAddress, setPaymentTokenAddress] = useState<string>('0xBaB33cC1E26ADa9be8E0a00b581bd3951EC94200');
    const [saleTokenAddress, setSaleTokenAddress] = useState<string>('0xFA64E2FDbf9ba4880043c16311C7b5A425c1c52F');
    const [paymentTokenInfo, setPaymentTokenInfo] = useState<TokenInfo | null>(null);
    const [saleTokenInfo, setSaleTokenInfo] = useState<TokenInfo | null>(null);
    const [validatingPaymentToken, setValidatingPaymentToken] = useState(false);
    const [validatingSaleToken, setValidatingSaleToken] = useState(false);
    const [paymentTokenError, setPaymentTokenError] = useState<string | null>(null);
    const [saleTokenError, setSaleTokenError] = useState<string | null>(null);

    // Other form fields
    const [bondSize, setBondSize] = useState<string>('500');
    const [whitelistStartTime, setWhitelistStartTime] = useState<string>('');
    const [saleStartTime, setSaleStartTime] = useState<string>('');
    const [saleEndTime, setSaleEndTime] = useState<string>('');
    const [withdrawDelay, setWithdrawDelay] = useState<number>(60 * 20);
    const [bondType, setBondType] = useState<'Dynamic' | 'Fixed'>('Dynamic');
    const [fixedDiscount, setFixedDiscount] = useState<string>('');
    const [metadataURI, setMetadataURI] = useState<string>('https://gist.github.com/TimmyIsANerd/49832fca4b76495e78b203d5245011d6/raw/5633514457010c956b6ff30292640ec8aa5a0d99/ScarabX.json');

    useEffect(() => {
        if (authenticated && wallets.length > 0) {
            const activeWallet = wallets[0];
            setWallet(activeWallet);
        }
    }, [authenticated, wallets]);

    // Validate if address is a valid ERC20 token
    const validateERC20Token = async (address: string, isPaymentToken: boolean) => {
        if (!ethers.isAddress(address)) {
            if (isPaymentToken) {
                setPaymentTokenError('Invalid address format');
                setPaymentTokenInfo(null);
            } else {
                setSaleTokenError('Invalid address format');
                setSaleTokenInfo(null);
            }
            return false;
        }

        try {
            if (isPaymentToken) {
                setValidatingPaymentToken(true);
                setPaymentTokenError(null);
            } else {
                setValidatingSaleToken(true);
                setSaleTokenError(null);
            }

            // Check if we can interact with basic ERC20 functions
            const [name, symbol, decimals] = await Promise.all([
                client.readContract({
                    address: address as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "name"
                }).catch(() => null),
                client.readContract({
                    address: address as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "symbol"
                }).catch(() => null),
                client.readContract({
                    address: address as `0x${string}`,
                    abi: ERC20ABI,
                    functionName: "decimals"
                }).catch(() => null)
            ]);

            if (!name || !symbol || decimals === null) {
                throw new Error("Not a valid ERC20 token");
            }

            const tokenInfo: TokenInfo = {
                address,
                name: name as string,
                symbol: symbol as string,
                decimals: Number(decimals)
            };

            if (isPaymentToken) {
                setPaymentTokenInfo(tokenInfo);
            } else {
                setSaleTokenInfo(tokenInfo);
            }

            return true;
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to validate token";
            if (isPaymentToken) {
                setPaymentTokenError(errorMessage);
                setPaymentTokenInfo(null);
            } else {
                setSaleTokenError(errorMessage);
                setSaleTokenInfo(null);
            }
            return false;
        } finally {
            if (isPaymentToken) {
                setValidatingPaymentToken(false);
            } else {
                setValidatingSaleToken(false);
            }
        }
    };

    // Handle payment token address change with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (paymentTokenAddress && ethers.isAddress(paymentTokenAddress)) {
                validateERC20Token(paymentTokenAddress, true);
            } else if (paymentTokenAddress) {
                setPaymentTokenError('Invalid address format');
                setPaymentTokenInfo(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [paymentTokenAddress]);

    // Handle sale token address change with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (saleTokenAddress && ethers.isAddress(saleTokenAddress)) {
                validateERC20Token(saleTokenAddress, false);
            } else if (saleTokenAddress) {
                setSaleTokenError('Invalid address format');
                setSaleTokenInfo(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [saleTokenAddress]);

    // Handle specific error messages and map them to user-friendly notifications
    const handleContractError = (err: any) => {
        const errorMessage = err?.message || 'Failed to create bond';
        setError(errorMessage);

        // Match specific error messages from the contract and show user-friendly toast
        if (typeof errorMessage === 'string') {
            // Timeline errors
            if (errorMessage.includes('whitelist timestamp too early')) {
                toast.error('Whitelist start time must be in the future');
            } else if (errorMessage.includes('sale start timestamp too early')) {
                toast.error('Sale start time must be in the future');
            } else if (errorMessage.includes('sale end timestamp too early')) {
                toast.error('Sale end time must be in the future');
            } else if (errorMessage.includes('sale start time before whitelist')) {
                toast.error('Sale start time must be after whitelist start time');
            } else if (errorMessage.includes('sale end time before sale start')) {
                toast.error('Sale end time must be after sale start time');
            } else if (errorMessage.includes('end time has to be within 10 years')) {
                toast.error('Sale end time cannot be more than 10 years after start time');
            } else if (errorMessage.includes('withdrawDelay has to be within 5 years')) {
                toast.error('Withdraw delay cannot exceed 5 years');
            } else if (errorMessage.includes('withdrawTime must be in future')) {
                toast.error('Withdraw time must be in the future');
            }
            // Bond size and discount errors
            else if (errorMessage.includes('bond size must be greater than 0')) {
                toast.error('Bond size must be greater than 0');
            } else if (errorMessage.includes('Invalid fixed discount')) {
                toast.error('Fixed discount percentage cannot exceed 100%');
            }
            // General errors
            else if (errorMessage.includes('Already initialized')) {
                toast.error('This bond has already been initialized');
            } else if (errorMessage.includes('user rejected transaction')) {
                toast.error('Transaction was rejected by the user');
            } else if (errorMessage.includes('insufficient funds')) {
                toast.error('Insufficient funds for transaction');
            } else {
                // Generic error for any other case
                toast.error('Error creating bond: Check your inputs and try again');
            }
        }
    };

    const handleCreateBond = async () => {
        if (!authenticated || !wallet) {
            login();
            return;
        }

        if (!paymentTokenInfo || !saleTokenInfo || !bondSize || !whitelistStartTime ||
            !saleStartTime || !saleEndTime || !withdrawDelay || !metadataURI) {
            setError('Please fill in all required fields and ensure tokens are valid');
            toast.error('Please fill in all required fields');
            return;
        }

        if (bondType === 'Fixed' && !fixedDiscount) {
            setError('Please enter fixed discount percentage');
            toast.error('Please enter fixed discount percentage');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const bondFactoryAddress = getContractAddress("bondFactory");

            // Convert timestamps to Unix timestamps
            const whitelistStartTimestamp = Math.floor(new Date(whitelistStartTime).getTime() / 1000);
            const saleStartTimestamp = Math.floor(new Date(saleStartTime).getTime() / 1000);
            const saleEndTimestamp = Math.floor(new Date(saleEndTime).getTime() / 1000);

            // Validate timestamps
            const now = Math.floor(Date.now() / 1000);
            if (whitelistStartTimestamp <= now) {
                throw new Error('whitelist timestamp too early');
            }
            if (saleStartTimestamp <= now) {
                throw new Error('sale start timestamp too early');
            }
            if (saleEndTimestamp <= now) {
                throw new Error('sale end timestamp too early');
            }
            if (whitelistStartTimestamp >= saleStartTimestamp) {
                throw new Error('sale start time before whitelist');
            }
            if (saleStartTimestamp >= saleEndTimestamp) {
                throw new Error('sale end time before sale start');
            }

            // Convert fixed discount to basis points if applicable
            const fixedDiscountBps = bondType === 'Fixed' ?
                Math.floor(parseFloat(fixedDiscount) * 100) : 0;

            const walletClient = await createViemWalletClient();

            // Create bond
            const { request } = await client.simulateContract({
                address: bondFactoryAddress as `0x${string}`,
                abi: BondFactoryABI,
                functionName: 'createBond',
                args: [
                    metadataURI,
                    wallet.address,
                    paymentTokenInfo.address,
                    saleTokenInfo.address,
                    whitelistStartTimestamp,
                    saleStartTimestamp,
                    saleEndTimestamp,
                    withdrawDelay,
                    wallet.address,
                    bondSize,
                    bondType === 'Dynamic' ? 0 : 1, // 0 for Dynamic, 1 for Fixed
                    fixedDiscountBps
                ],
                account: wallet.address as `0x${string}`
            });
            const hash = await walletClient.writeContract(request);
            setTxHash(hash);
            setShowTxModal(true)

            toast("Successfully Created New Bond")
            setTimeout(async () => {
                // Verify Transaction is Complete
                const receipt = await client.waitForTransactionReceipt({ hash });
                if (receipt && receipt.status === "success") {
                    navigate("/admin/dashboard/bonds");
                }
            }, 5000);
        } catch (err: any) {
            console.error('Error creating bond:', err);
            handleContractError(err);
        } finally {
            setLoading(false);
        }
    };

    if (!authenticated) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Connect Wallet to Create Bond</h2>
                    <button
                        onClick={login}
                        className="bg-primary hover:bg-primary/80 text-white py-2 px-6 rounded-full"
                    >
                        Connect Wallet
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <TxReceipt
                visible={showTxModal}
                onClose={() => setShowTxModal(false)}
                title={txReceiptTitle}
                txHash={txHash}
            />
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-8 text-white">Create New Bond</h1>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Token Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Payment Token Address</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={paymentTokenAddress}
                                    onChange={(e) => setPaymentTokenAddress(e.target.value)}
                                    placeholder="Enter ERC20 token address (0x...)"
                                    className={`w-full p-2 pr-10 bg-[#1A1A1A] border ${paymentTokenInfo ? 'border-green-500' : paymentTokenError ? 'border-red-500' : 'border-gray-700'} rounded text-white`}
                                />
                                {validatingPaymentToken ? (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Preloader
                                            use={ThreeDots}
                                            size={20}
                                            strokeWidth={6}
                                            strokeColor="#FFFFFF"
                                            duration={2000}
                                        />
                                    </div>
                                ) : paymentTokenInfo ? (
                                    <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                                ) : paymentTokenError ? (
                                    <FaTimesCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" />
                                ) : null}
                            </div>
                            {paymentTokenError && (
                                <p className="mt-1 text-xs text-red-500">{paymentTokenError}</p>
                            )}
                            {paymentTokenInfo && (
                                <div className="mt-2 text-sm text-white">
                                    <p>{paymentTokenInfo.name} ({paymentTokenInfo.symbol})</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Sale Token Address</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={saleTokenAddress}
                                    onChange={(e) => setSaleTokenAddress(e.target.value)}
                                    placeholder="Enter ERC20 token address (0x...)"
                                    className={`w-full p-2 pr-10 bg-[#1A1A1A] border ${saleTokenInfo ? 'border-green-500' : saleTokenError ? 'border-red-500' : 'border-gray-700'} rounded text-white`}
                                />
                                {validatingSaleToken ? (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Preloader
                                            use={ThreeDots}
                                            size={20}
                                            strokeWidth={6}
                                            strokeColor="#FFFFFF"
                                            duration={2000}
                                        />
                                    </div>
                                ) : saleTokenInfo ? (
                                    <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                                ) : saleTokenError ? (
                                    <FaTimesCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" />
                                ) : null}
                            </div>
                            {saleTokenError && (
                                <p className="mt-1 text-xs text-red-500">{saleTokenError}</p>
                            )}
                            {saleTokenInfo && (
                                <div className="mt-2 text-sm text-white">
                                    <p>{saleTokenInfo.name} ({saleTokenInfo.symbol})</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bond Size */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-white">Bond Size</label>
                        <input
                            type="text"
                            value={bondSize}
                            onChange={(e) => setBondSize(e.target.value)}
                            placeholder="Enter bond size"
                            className="w-full p-2 bg-[#1A1A1A] border border-gray-700 rounded text-white"
                        />
                        {saleTokenInfo && (
                            <p className="mt-1 text-xs text-gray-400">Amount in {saleTokenInfo.symbol}</p>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Whitelist Start Time</label>
                            <input
                                type="datetime-local"
                                value={whitelistStartTime}
                                onChange={(e) => setWhitelistStartTime(e.target.value)}
                                className="w-full p-2 bg-[#1A1A1A] border border-gray-700 rounded text-white"
                            />
                            <p className="mt-1 text-xs text-gray-400">Must be in the future</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Sale Start Time</label>
                            <input
                                type="datetime-local"
                                value={saleStartTime}
                                onChange={(e) => setSaleStartTime(e.target.value)}
                                className="w-full p-2 bg-[#1A1A1A] border border-gray-700 rounded text-white"
                            />
                            <p className="mt-1 text-xs text-gray-400">Must be after whitelist start</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Sale End Time</label>
                            <input
                                type="datetime-local"
                                value={saleEndTime}
                                onChange={(e) => setSaleEndTime(e.target.value)}
                                className="w-full p-2 bg-[#1A1A1A] border border-gray-700 rounded text-white"
                            />
                            <p className="mt-1 text-xs text-gray-400">Must be after sale start</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Withdraw Delay (days)</label>
                            <input
                                type="number"
                                value={Number(withdrawDelay) / (24 * 60 * 60)}
                                onChange={(e) => setWithdrawDelay(Number(e.target.value) * 24 * 60 * 60)}
                                placeholder="Enter delay in days"
                                className="w-full p-2 bg-[#1A1A1A] border border-gray-700 rounded text-white"
                            />
                            <p className="mt-1 text-xs text-gray-400">Cannot exceed 5 years (1825 days)</p>
                        </div>
                    </div>

                    {/* Bond Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-white">Bond Type</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center text-white">
                                <input
                                    type="radio"
                                    value="Dynamic"
                                    checked={bondType === 'Dynamic'}
                                    onChange={() => setBondType('Dynamic')}
                                    className="mr-2"
                                />
                                Dynamic
                            </label>
                            <label className="flex items-center text-white">
                                <input
                                    type="radio"
                                    value="Fixed"
                                    checked={bondType === 'Fixed'}
                                    onChange={() => setBondType('Fixed')}
                                    className="mr-2"
                                />
                                Fixed
                            </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                            {bondType === 'Dynamic'
                                ? 'Dynamic bonds adjust discount based on amount sold'
                                : 'Fixed bonds maintain constant discount rate'
                            }
                        </p>
                    </div>

                    {/* Fixed Discount (only shown for Fixed bond type) */}
                    {bondType === 'Fixed' && (
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Fixed Discount (%)</label>
                            <input
                                type="number"
                                value={fixedDiscount}
                                onChange={(e) => setFixedDiscount(e.target.value)}
                                placeholder="Enter fixed discount percentage"
                                min="0"
                                max="100"
                                className="w-full p-2 bg-[#1A1A1A] border border-gray-700 rounded text-white"
                            />
                            <p className="mt-1 text-xs text-gray-400">Enter value between 0-100%</p>
                        </div>
                    )}

                    {/* Metadata URI */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-white">Metadata URI</label>
                        <input
                            type="text"
                            value={metadataURI}
                            onChange={(e) => setMetadataURI(e.target.value)}
                            placeholder="Enter metadata URI"
                            className="w-full p-2 bg-[#1A1A1A] border border-gray-700 rounded text-white"
                        />
                        <p className="mt-1 text-xs text-gray-400">URL to JSON with project details</p>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleCreateBond}
                        disabled={loading || !paymentTokenInfo || !saleTokenInfo}
                        className="w-full bg-primary hover:bg-primary/80 disabled:bg-gray-700 text-white py-3 px-6 rounded-lg"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <Preloader
                                    use={ThreeDots}
                                    size={20}
                                    strokeWidth={6}
                                    strokeColor="#FFFFFF"
                                    duration={2000}
                                />
                                <span className="ml-2">Creating Bond...</span>
                            </div>
                        ) : (
                            'Create Bond'
                        )}
                    </button>
                </div>
            </div>
        </Layout>
    );
}

export default BondCreator;