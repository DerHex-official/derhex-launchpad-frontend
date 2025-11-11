// import React from 'react'
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import ConfirmStakingModal from "../Modal/ConfirmStaking";
import ConfirmUnstaking from "../Modal/ConfirmUnstaking";
import TxReceipt from "../Modal/TxReceipt";
import { useLockStake } from "../../hooks/web3/useLockStake";
import { usePrivy } from "@privy-io/react-auth";
import { createWalletClient, custom } from 'viem';
// We'll use publicClient from useChain instead of direct import
import { Preloader, ThreeDots } from 'react-preloader-icon';
import { IoWalletSharp } from "react-icons/io5";
import { ethers } from 'ethers';
import { estimateRewards as estimateStakeRewards } from "../../utils/web3/stakeLock";
import { toast } from 'react-hot-toast';
import { getTokenDecimals, getTokenBalance, getTokenAllowance } from "../../utils/web3/actions";
import erc20Abi from "../../abis/ERC20.json";
import stakeLockABI from "../../abis/StakeLock.json";
import { useChain } from "../../context/ChainContext";

function Dynamic() {
  const { publicClient } = useChain();

  // Add this function to create wallet client
  const createViemWalletClient = () => {
    return createWalletClient({
      chain: publicClient.chain,
      transport: custom(window.ethereum)
    });
  };
  const [stakeAmount, setStakeAmount] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<string>("1x");
  const [estimatedRewards, setEstimatedRewards] = useState<number>(0);
  const [showMultiplierDropdown, setShowMultiplierDropdown] = useState<boolean>(false);
  const { user, login, authenticated } = usePrivy();
  const { data, error, loading, refetch } = useLockStake({ polling: false, userAddress: user?.wallet?.address as `0x${string}` })
  const [openConfirmStaking, setOpenConfirmStaking] = useState<boolean>(false);
  const [openConfirmUnstaking, setOpenConfirmUnstaking] = useState<boolean>(false);
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [showTxModal, setShowTxModal] = useState<boolean>(false);
  const [txReceiptTitle, setTxReceiptTitle] = useState<string>("Staking Successful");
  const [txHash, setTxHash] = useState<string>("");

  const multiplierOptions = [
    { value: "1x", minAmount: 0 },
    { value: "1.5x", minAmount: 1000 },
    { value: "2x", minAmount: 5000 },
    { value: "2.5x", minAmount: 10000 },
    { value: "3x", minAmount: 15000 },
    { value: "3.5x", minAmount: 50000 },
  ];

  async function setEstimate(stakeAmount: number) {
    const stakeAmountInWei = ethers.parseEther(stakeAmount.toString());
    const estimate = await estimateStakeRewards(stakeAmountInWei);
    setEstimatedRewards(Number(estimate));
  }

  function handleSetAmount(amount: number) {
    const amountToStake = Number(amount);
    let multiplier = "1x";

    if (amountToStake >= 50000) {
      multiplier = "3.5x";
    } else if (amountToStake >= 15000) {
      multiplier = "3x";
    } else if (amountToStake >= 10000) {
      multiplier = "2.5x";
    } else if (amountToStake >= 5000) {
      multiplier = "2x";
    } else if (amountToStake >= 1000) {
      multiplier = "1.5x";
    }

    setMultiplier(multiplier);
    setStakeAmount(amount)
    setEstimate(amount);
  }

  function handleMultiplierSelect(selectedMultiplier: string) {
    const selected = multiplierOptions.find(option => option.value === selectedMultiplier);
    if (selected) {
      setStakeAmount(selected.minAmount);
      setEstimate(selected.minAmount);
      setMultiplier(selected.value);
    }
    setShowMultiplierDropdown(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] py-12 px-4">
        <div className="bg-gradient-to-br from-[#17043B] to-[#291254] clip-path-polygon p-8 shadow-lg border border-primary/10 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 clip-path-polygon bg-primary/20 flex items-center justify-center">
              <Preloader
                use={ThreeDots}
                size={32}
                strokeWidth={6}
                strokeColor="#7B4EEE"
                duration={2000}
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">Loading Staking Data</h2>
          <p className="text-gray-400">Please wait while we fetch your staking information...</p>
        </div>
      </div>
    );
  }


  if (error.message) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] py-12 px-4">
        <div className="bg-gradient-to-br from-[#17043B] to-[#291254] clip-path-polygon p-8 shadow-lg border border-red-500/30 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 clip-path-polygon bg-red-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">Error Loading Data</h2>
          <p className="text-red-400 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 clip-path-polygon hover:bg-primary/90 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  async function handleStake() {
    if (!user?.wallet?.address) {
      toast("Connect Wallet")
      return;
    }
    setIsStaking(true);
    const walletClient = createViemWalletClient();
    const [account] = await walletClient.getAddresses();
    const decimals = await getTokenDecimals(data.stakeLock.stakeToken.id)
    const stakeAmountArg = ethers.parseUnits(stakeAmount.toString(), decimals);
    const balanceOfStakeToken = await getTokenBalance(data.stakeLock.stakeToken.id, user?.wallet?.address as `0x${string}`);

    if (stakeAmount === 0) {
      toast("Set stake amount")
      setIsStaking(false)
      return;
    }

    if (stakeAmount > Number(balanceOfStakeToken)) {
      toast("Insufficient balance")
      setIsStaking(false)
      return;
    }

    if (!account) {
      toast("Connect Wallet");
      setIsStaking(false)
      return;
    }

    // Approve Token Spending
    async function approveTokenSpending() {
      if (user?.wallet?.address) {
        let allowance = await getTokenAllowance(
          data.stakeLock.stakeToken.id,
          data.stakeLock.id,
          user.wallet.address as `0x${string}`
        )

        console.log(allowance);
        try {
          // Check if allowance is less than stake amount
          if (Number(allowance) < stakeAmount) {
            // Allow Contract to Spend
            const { request } = await publicClient.simulateContract({
              address: data.stakeLock.stakeToken.id,
              account,
              abi: erc20Abi,
              functionName: "approve",
              args: [data.stakeLock.id, stakeAmountArg]  // Changed to approve staking pool contract
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

        } catch (error: any) {
          console.error(error.message)
          if (error.message.includes("User rejected the request")) {
            toast("User Rejected the Request")
            return;
          }
          setIsStaking(false)
        } 
      }
    }

    const receipt = await approveTokenSpending();
    if (receipt && receipt.status === "success") {
      try {
        // Stake Transaction
        const { request } = await publicClient.simulateContract({
          address: data.stakeLock.id,
          abi: stakeLockABI,
          account,
          functionName: "stake",
          args: [
            stakeAmountArg
          ]
        })

        const hash = await walletClient.writeContract(request)
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: hash
        })

        if (receipt.status === "success") {
          toast("Successfully staked")
          setShowTxModal(false);
          setTxReceiptTitle("Succesfully Staked")

          setTxHash(hash)
          setTimeout(() => {
            setShowTxModal(true)
          }, 2000)
          setStakeAmount(0)
          setOpenConfirmStaking(false)
          setTimeout(async () => {
            await refetch();
          }, 5000)
        }

      } catch (error: any) {
        console.error(error.message)
        if (error.message.includes("User rejected the request")) {
          toast("User Rejected the Request")
          return;
        }
        toast.error("Stake Failure, Please Try Again later")
        setIsStaking(false)
      } finally {
        setIsStaking(false)
      }
    }
  }


  async function handleWithdraw(unstake: boolean = false) {
    const walletClient = createViemWalletClient();
    const [account] = await walletClient.getAddresses();

    if (unstake === false) {
      if (Number(data?.userData?.rewards) === 0) {
        toast("No Rewards Available")
        return;
      }
    }

    try {
      setIsStaking(true);
      const { request } = await publicClient.simulateContract({
        address: data.stakeLock.id,
        abi: stakeLockABI,
        account,
        functionName: "withdraw",
        args: [unstake]
      })

      const hash = await walletClient.writeContract(request);
      setTxReceiptTitle(unstake ? "Successfully Unstaked" : "Successfully Withdrawal and Unstaking")
      setTxHash(hash)
      setStakeAmount(0)
      setOpenConfirmUnstaking(false)

      toast(unstake ? "Successfully Unstaked tokens" : "Successful Withdrawal of Reward Tokens & Unstake")


      setTimeout(() => {
        setShowTxModal(false)
      }, 2000)
      setTimeout(async () => {
        await refetch()
      }, 5000)
    } catch (error: any) {
      console.error(error)
      if (error.message.includes("User rejected the request")) {
        toast("User Rejected the Request")
        return;
      }
      if (error.message.includes("not_reward_timestamp")) {
        toast("Not yet reward date")
        return;
      }
      toast.error(unstake ? "Failed to Unstake Tokens" : "Failed to Withdraw Rewards")
    } finally {
      setIsStaking(false)
    }
  }


  console.log(data)

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

  const badgeInfo = getBadgeInfo(data?.userData?.amountStaked || 0);
  const currentMultiplier = returnMultiplier(data?.userData?.amountStaked || 0);

  return (
    <div className="flex flex-col font-space text-white">
      {/* Hero Section with Background */}
      <div className="relative overflow-hidden hero-bg py-12 lg:py-20">
        {/* Animated gradient orbs */}
        <div className="h-[400px] w-[400px] top-0 absolute clip-path-polygon left-[-10%] blur-[60px] bg-[#8949FF33] animate-pulse"></div>
        <div className="h-[500px] w-[500px] top-0 absolute clip-path-polygon right-[-10%] blur-[60px] bg-[#8949FF33] animate-pulse delay-1000"></div>

        {/* Header Content */}
        <div className="w-full lg:w-[80%] mx-auto text-center py-16 px-4 relative z-10">
          <div className="inline-block mb-4 px-4 py-1.5 bg-primary/20 clip-path-polygon">
            <span className="text-primary font-medium text-sm">Stake & Earn Multipliers</span>
          </div>
          <h1 className="text-[36px] lg:text-[70px] font-[600] leading-[1.1] lg:leading-[1.1] text-center mb-6">
            Boost Your Presale Rewards with <br className="hidden lg:block" />
            <span className="text-primary">Staking Multipliers</span>
          </h1>
          <p className="text-[16px] text-center lg:text-[22px] mt-[10px] lg:mt-[5px] text-gray-300 max-w-3xl mx-auto">
            The more you stake in this pool, the higher your presale reward multiplier!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 py-12 space-y-10">
        {/* User Stats Cards */}
        {authenticated && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Badge */}
            <div className="bg-gradient-to-br from-[#17043B] to-[#291254] clip-path-polygon p-6 shadow-lg hover:shadow-2xl transition-all border border-primary/10 group hover:border-primary/30">
              <div className="flex items-center space-x-4">
                {badgeInfo.image && (
                  <div className="w-16 h-16 clip-path-polygon bg-[#291254] flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-300">
                    <img src={badgeInfo.image} alt={badgeInfo.name} className="w-10 h-10" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{badgeInfo.name}</h3>
                  <p className="text-gray-400 text-sm">Current Badge</p>
                </div>
              </div>
            </div>

            {/* Current Multiplier */}
            <div className="bg-gradient-to-br from-[#17043B] to-[#291254] clip-path-polygon p-6 shadow-lg hover:shadow-2xl transition-all border border-primary/10 group hover:border-primary/30">
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-5xl font-bold text-primary block mb-2 group-hover:scale-110 transition-transform duration-300">{currentMultiplier}</span>
                <p className="text-gray-400 text-sm">Current Multiplier</p>
              </div>
            </div>

            {/* Amount Staked */}
            <div className="bg-gradient-to-br from-[#17043B] to-[#291254] clip-path-polygon p-6 shadow-lg hover:shadow-2xl transition-all border border-primary/10 group hover:border-primary/30">
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-5xl font-bold block mb-2 group-hover:scale-110 transition-transform duration-300">{data?.userData?.amountStaked || 0}</span>
                <p className="text-gray-400 text-sm">Total Staked DRX</p>
              </div>
            </div>
          </div>
        )}

        {/* Staking Interface */}
        <div className="bg-gradient-to-br from-[#17043B] to-[#291254] clip-path-polygon p-8 shadow-lg border border-primary/10">
          <h2 className="text-2xl font-bold mb-6 text-center lg:text-left">Stake Your DRX Tokens</h2>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Staking Input */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Amount to Stake</label>
                <div className="relative group">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => handleSetAmount(Number(e.target.value))}
                    className="w-full bg-[#0B0118] p-4 text-white clip-path-polygon focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-primary/20 focus:border-transparent"
                    placeholder="Enter amount"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <span className="text-gray-400 font-medium">DRX</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Multiplier</label>
                <div className="relative">
                  <button
                    onClick={() => setShowMultiplierDropdown(!showMultiplierDropdown)}
                    className="w-full bg-[#0B0118] p-4 text-left flex items-center justify-between hover:bg-[#17043B] transition-colors clip-path-polygon border border-primary/20"
                  >
                    <div className="flex items-center">
                      <span className="text-primary font-medium mr-2">{multiplier}</span>
                      <span className="text-sm text-gray-400">Multiplier</span>
                    </div>
                    <FaChevronDown className={`transition-transform duration-300 text-primary ${showMultiplierDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showMultiplierDropdown && (
                    <div className="absolute w-full mt-2 bg-[#0B0118] clip-path-polygon shadow-xl z-10 border border-primary/20 overflow-hidden">
                      {multiplierOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleMultiplierSelect(option.value)}
                          className="w-full p-4 text-left hover:bg-primary hover:text-white transition-all flex justify-between items-center border-b border-primary/10 last:border-b-0"
                        >
                          <span className="font-medium">{option.value}</span>
                          <span className="text-sm text-gray-400">Min: {option.minAmount} DRX</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Rewards */}
              <div className="bg-[#0B0118] p-6 clip-path-polygon border border-primary/20 hover:border-primary/40 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Estimated Rewards</p>
                    <p className="text-2xl font-bold">{Number(estimatedRewards).toLocaleString()} <span className="text-primary">DRX</span></p>
                  </div>
                  <div className="text-right bg-primary/10 px-4 py-2 clip-path-polygon">
                    <p className="text-sm text-gray-300">APY</p>
                    <p className="text-xl font-bold text-primary">{data?.stakeLock?.apyRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Action Buttons */}
            <div className="flex flex-col justify-center space-y-6">
              {!authenticated ? (
                <div className="space-y-6">
                  <div className="bg-[#0B0118] p-6 clip-path-polygon border border-primary/20">
                    <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-400 mb-4">Connect your wallet to start staking and earning rewards</p>
                    <button
                      onClick={login}
                      className="w-full bg-primary text-white p-4 clip-path-polygon flex items-center justify-center space-x-3 hover:bg-primary/90 transition-all text-lg font-medium"
                    >
                      <IoWalletSharp className="text-xl" />
                      <span>Connect Wallet</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-[#0B0118] p-6 rounded-xl border border-primary/20">
                    <h3 className="text-xl font-bold mb-4">Stake Your Tokens</h3>
                    <p className="text-gray-400 mb-6">Stake your DRX tokens to earn rewards and increase your multiplier</p>
                    <button
                      onClick={() => setOpenConfirmStaking(true)}
                      disabled={isStaking || stakeAmount <= 0}
                      className="w-full bg-primary text-white p-4 clip-path-polygon hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                    >
                      {isStaking ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span>Processing</span>
                          <Preloader
                            use={ThreeDots}
                            size={24}
                            strokeWidth={6}
                            strokeColor="#FFFFFF"
                            duration={2000}
                          />
                        </div>
                      ) : (
                        'Stake DRX'
                      )}
                    </button>
                  </div>

                  <div className="bg-[#0B0118] p-6 clip-path-polygon border border-primary/20">
                    <h3 className="text-xl font-bold mb-4">Manage Your Stake</h3>
                    <p className="text-gray-400 mb-6">Withdraw your staked tokens and claim rewards</p>
                    <button
                      onClick={() => setOpenConfirmUnstaking(true)}
                      disabled={isStaking || data?.userData?.amountStaked === 0}
                      className="w-full border-2 border-primary text-primary p-4 clip-path-polygon hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                    >
                      {isStaking ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span>Processing</span>
                          <Preloader
                            use={ThreeDots}
                            size={24}
                            strokeWidth={6}
                            strokeColor="#FFFFFF"
                            duration={2000}
                          />
                        </div>
                      ) : (
                        'Unstake DRX'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Multiplier Tiers Information */}
        <div className="bg-gradient-to-br from-[#17043B] to-[#291254] clip-path-polygon p-8 shadow-lg border border-primary/10">
          <h2 className="text-2xl font-bold mb-6 text-center">Staking Multiplier Tiers</h2>
          <p className="text-gray-300 text-center mb-8 max-w-3xl mx-auto">
            Stake more DRX tokens to unlock higher multiplier tiers and maximize your presale rewards.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {multiplierOptions.map((option, index) => (
              <div
                key={option.value}
                className={`bg-[#0B0118] p-5 clip-path-polygon border ${option.value === multiplier ? 'border-primary' : 'border-primary/10'} hover:border-primary/50 transition-all`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 clip-path-polygon bg-primary/20 flex items-center justify-center mb-3">
                    <span className="text-primary font-bold text-xl">{option.value}</span>
                  </div>
                  <h3 className="font-bold mb-1">
                    {index === 0 ? 'Basic' : index === 1 ? 'Bronze' : index === 2 ? 'Silver' : index === 3 ? 'Gold' : 'Diamond'} Tier
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">Min. {option.minAmount} DRX</p>
                  {option.value === multiplier && (
                    <span className="bg-primary/20 text-primary text-xs px-3 py-1 clip-path-polygon">Current Tier</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-br from-[#17043B] to-[#291254] clip-path-polygon p-8 shadow-lg border border-primary/10">
          <h2 className="text-2xl font-bold mb-6 text-center">Benefits of Staking</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0B0118] p-6 clip-path-polygon border border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 clip-path-polygon bg-primary/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Earn Passive Income</h3>
              <p className="text-gray-400">
                Stake your DRX tokens and earn {data?.stakeLock?.apyRate}% APY rewards automatically.
              </p>
            </div>

            <div className="bg-[#0B0118] p-6 clip-path-polygon border border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 clip-path-polygon bg-primary/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Presale Multipliers</h3>
              <p className="text-gray-400">
                Increase your allocation and rewards in upcoming presales with multipliers up to 3.5x.
              </p>
            </div>

            <div className="bg-[#0B0118] p-6 clip-path-polygon border border-primary/20 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 clip-path-polygon bg-primary/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Exclusive Badges</h3>
              <p className="text-gray-400">
                Earn unique badges based on your staking tier, showcasing your status in the DerHex ecosystem.
              </p>
            </div>
          </div>
        </div>

        {/* Modals */}
        {openConfirmStaking && (
          <ConfirmStakingModal
            onClose={() => setOpenConfirmStaking(false)}
            onConfirm={handleStake}
            stakeAmount={stakeAmount}
            loading={isStaking}
            APY={data.stakeLock.apyRate}
            tokenSymbol="DRX"
          />
        )}
        {openConfirmUnstaking && (
          <ConfirmUnstaking
            tokenSymbol={data.stakeLock.stakeToken.symbol}
            onConfirm={() => handleWithdraw(false)}
            onClose={() => setOpenConfirmUnstaking(false)}
            loading={isStaking}
            APY={data.stakeLock.apyRate}
            rewardsTokenSymbol={data.stakeLock.rewardToken.symbol}
            nextRewardTime={data.userData.nextRewardTime}
            lockAmount={data.userData.amountStaked}
            rewardAmount={data.userData.rewards}
            lastStakeTime={data.userData.lastStakeTime}
            lockStake={true}
          />
        )}

        <TxReceipt
          visible={showTxModal}
          onClose={() => setShowTxModal(false)}
          txHash={txHash}
          title={txReceiptTitle}
        />
      </div>
    </div>
  );
}

export default Dynamic;
