// import React from 'react'
import { useState, useEffect } from "react";
import { IoWalletSharp } from "react-icons/io5";
import { GoAlert } from "react-icons/go";
import { useParams } from 'react-router-dom';
import { getTokenData } from "../../services";
import { GET_STAKING_POOL_BY_ID } from "../../graphql/queries";
import { useQuery } from "@apollo/client";
import {
  toast
} from "react-hot-toast";
import { usePrivy } from "@privy-io/react-auth";
import { Preloader, ThreeDots } from 'react-preloader-icon';
import { noOfDays } from "../../utils/tools";
import { getTokenBalance, getStakingPoolPauseStatus, getTotalSupply, getAmountStaked, getTokenDecimals, getTokenAllowance, getNextRewardWithdrawTime, getStakingPoolRewardsAmount, getLastStakeTime, getStakingPoolDataByAddress, getStakingPoolOwner } from "../../utils/web3/actions";
import ConfirmStakingModal from "../Modal/ConfirmStaking";
import ConfirmUnstaking from "../Modal/ConfirmUnstaking";
import { createWalletClient, custom } from "viem";
import { useChain } from "../../context/ChainContext";
import { publicClient } from "../../config";
import stakingPoolABI from "../../abis/StakingPool.json";
import erc20Abi from "../../abis/ERC20.json";
import { ethers } from "ethers";
import TxReceipt from "../Modal/TxReceipt";

import ManageStaking from "../Modal/ManageStaking";

// The createViemWalletClient function will be defined inside the component


function SingleStake() {
  const { publicClient } = useChain();

  // Add this function to create wallet client
  const createViemWalletClient = () => {
    return createWalletClient({
      chain: publicClient.chain,
      transport: custom(window.ethereum as any)
    });
  };

  const [coinGeckoData, setCoinGeckoData] = useState<any>(null);
  const { id } = useParams<{ id: `0x${string}` }>();
  // const { data, loading: loadingStakingPool, error: stakingPoolError } = useQuery(GET_STAKING_POOL_BY_ID, {
  //   variables: { id }
  // })

  const [startUpLoading, setStartUpLoading] = useState<boolean>(true);
  const [loadingStakingPool, setLoadingStakingPool] = useState<boolean>(true);
  const [stakingPoolError, setStakingPoolError] = useState<{ message: string }>({ message: "" });
  const [data, setData] = useState<any>(null);

  const { authenticated, login, user } = usePrivy();
  const [stakeAmount, setStakeAmount] = useState<number>(0.00)
  const [balance, setTokenBalance] = useState<string | 0>(0);
  const [paused, setPaused] = useState<boolean>(true)
  const [totalSupply, setTotalSupply] = useState<number | string>(0)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [staked, setStaked] = useState<number>(0);
  const [showTxModal, setShowTxModal] = useState<boolean>(false);
  const [txReceiptTitle, setTxReceiptTitle] = useState<string>("Staking Successful");
  const [txHash, setTxHash] = useState<string>("");

  const [showUnstakeModal, setShowUnstakeModal] = useState<boolean>(false)
  const [nextRewardTime, setNextRewardTime] = useState<number>(0);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [lastStakeTime, setLastStakeTime] = useState(0);
  const [stakingPoolOwner, setStakingPoolOwner] = useState<`0x${string}` | string>("")

  const [manageStakingModal, setManageStakingModal] = useState<boolean>(false)


  useEffect(() => {
    if (authenticated) {
      loadUpData();
    }
  }, [authenticated]);

  async function loadUpData() {
    setLoadingStakingPool(true);
    try {
      const owner = await getStakingPoolOwner(id as `0x${string}`);
      setStakingPoolOwner(owner)
      const stakingPoolData = await getStakingPoolDataByAddress(id as `0x${string}`);
      // Set data first
      setData(stakingPoolData);
      // Then call getCoinGeckoTokenData with the new data directly
      await getCoinGeckoTokenData(stakingPoolData);
    } catch (error) {
      setStakingPoolError((prevError) => ({ ...prevError, message: "Failed to retrieve staking pool data" }));
    } finally {
      setLoadingStakingPool(false);
    }
  }

  async function getCoinGeckoTokenData(stakingPoolData?: any) {
    setStartUpLoading(true);

    // Use the passed data or fall back to state
    const poolData = stakingPoolData || data;

    try {
      if (!poolData?.stakingPool?.stakeToken?.id) {
        throw new Error("Staking pool data not available");
      }

      const tokenData = await getTokenData(poolData.stakingPool.stakeToken.id);
      setCoinGeckoData(tokenData);

      if (!user?.wallet?.address) {
        throw new Error("User wallet not connected");
      }

      const [
        tokenBalance,
        pauseStatus,
        supply,
        alreadyStaked,
        nextRewardTime,
        rewardsAmount,
        lastStakeTime
      ] = await Promise.all([
        getTokenBalance(poolData.stakingPool.stakeToken.id, user.wallet.address as `0x${string}`),
        getStakingPoolPauseStatus(poolData.stakingPool.id),
        getTotalSupply(poolData.stakingPool.stakeToken.id),
        getAmountStaked(poolData.stakingPool.id, user.wallet.address as `0x${string}`),
        getNextRewardWithdrawTime(poolData.stakingPool.id, user.wallet.address as `0x${string}`),
        getStakingPoolRewardsAmount(poolData.stakingPool.id, user.wallet.address as `0x${string}`),
        getLastStakeTime(poolData.stakingPool.id, user.wallet.address as `0x${string}`)
      ]);

      // Update state in one batch
      setTokenBalance(tokenBalance);
      setPaused(pauseStatus);
      setTotalSupply(supply);
      setStaked(Number(alreadyStaked));
      setNextRewardTime(nextRewardTime);
      setRewardAmount(Number(rewardsAmount));
      setLastStakeTime(lastStakeTime);

    } catch (error) {
      console.error(error);
      // toast.error("Failed to retrieve staking data");
    } finally {
      setStartUpLoading(false);
    }
  }

  async function reloadLockedAmount() {
    try {
      if (user?.wallet?.address) {
        const alreadyStaked = await getAmountStaked(data.stakingPool.id, user.wallet.address as `0x${string}`)
        const newBalance = await getTokenBalance(data.stakingPool.stakeToken.id, user.wallet.address as `0x${string}`);
        setStaked(Number(alreadyStaked));
        setTokenBalance(newBalance);
      }
    } catch (error: any) {
      console.error(error)
    }
  }

  async function handleStake() {
    setIsStaking(true);
    const walletClient = createViemWalletClient();
    const [account] = await walletClient.getAddresses();
    const decimals = await getTokenDecimals(data.stakingPool.stakeToken.id)
    const stakeAmountArg = ethers.parseUnits(stakeAmount.toString(), decimals);
    const balanceOfStakeToken = await getTokenBalance(data.stakingPool.stakeToken.id, user?.wallet?.address as `0x${string}`);
    const tokenBalance = await getTokenBalance(data.stakingPool.stakeToken.id, user?.wallet?.address as `0x${string}`)
    console.log("running handle stake")
    if (Number(stakeAmount) > Number(tokenBalance)) {
      toast(`Insufficient ${data.stakingPool.stakeToken.symbol} Balance`)
      setIsStaking(false)
      return;
    }

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
          data.stakingPool.stakeToken.id,
          data.stakingPool.id,
          user.wallet.address as `0x${string}`
        )

        console.log(allowance);
        // Check if allowance is less than stake amount
        if (Number(allowance) < stakeAmount) {
          // Allow Contract to Spend
          const { request } = await publicClient.simulateContract({
            address: data.stakingPool.stakeToken.id,
            account,
            abi: erc20Abi,
            functionName: "approve",
            args: [data.stakingPool.id, stakeAmountArg]  // Changed to approve staking pool contract
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
        // Stake Transaction
        const { request } = await publicClient.simulateContract({
          address: data.stakingPool.id,
          abi: stakingPoolABI,
          account,
          functionName: "stake",
          args: [
            stakeAmountArg
          ]
        })

        const hash = await walletClient.writeContract(request)
        toast("Successfully staked")
        setShowModal(false);


        setTxHash(hash)
        setTimeout(() => {
          setShowTxModal(true)
        }, 2000)
        setStakeAmount(0)
        setTimeout(async () => {
          await reloadLockedAmount();
        }, 5000)
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

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <div className="bg-[#291254] rounded-[20px] p-8 max-w-[500px] w-full">
          <img
            src="/icons/staking/money.svg"
            alt=""
            className="w-[80px] h-[80px] mx-auto mb-6"
          />
          <h2 className="text-[25px] font-[700] text-white mb-4">
            Start Earning Rewards
          </h2>
          <p className="text-[16px] text-gray-300 mb-8">
            Join our staking pool to earn rewards and increase your IDO Power. Link your wallet to get started.
          </p>
          <button
            onClick={login}
            className="bg-primary p-[8px_20px] font-[500] text-[20px] text-white rounded-full flex items-center justify-center space-x-[5px] w-full hover:bg-primary/90 transition-all"
          >
            <IoWalletSharp className="text-[20px] mr-2" />
            <span>Connect Wallet</span>
          </button>
        </div>
      </div>
    );
  }


  if (startUpLoading || loadingStakingPool) {
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


  if (stakingPoolError.message) {
    return <div className="text-red-500 text-center">Error loading staking pool: {stakingPoolError.message}</div>;
  }


  function confirmStake() {
    if (stakeAmount === 0) {
      toast("Set stake amount")
      return;
    }

    setShowModal(true)
    return
  }

  async function unstakeConfirm() {
    setShowUnstakeModal(true)
    return;
  }

  async function handleWithdraw(unstake: boolean = false) {
    const walletClient = createViemWalletClient();
    const [account] = await walletClient.getAddresses();

    if (unstake === false) {
      if (Number(rewardAmount) === 0) {
        toast("No Rewards Available")
        return;
      }
    }

    try {
      setIsStaking(true);
      const { request } = await publicClient.simulateContract({
        address: data.stakingPool.id,
        abi: stakingPoolABI,
        account,
        functionName: "withdraw",
        args: [unstake]
      })

      const hash = await walletClient.writeContract(request);
      setTxReceiptTitle(unstake ? "Successfully Unstaked" : "Successfully Withdrawal and Unstaking")
      setTxHash(hash)
      setStaked(0)
      setShowUnstakeModal(false)

      toast(unstake ? "Successfully Unstaked tokens" : "Successful Withdrawal of Reward Tokens & Unstake")


      setTimeout(() => {
        setShowTxModal(false)
      }, 2000)
      setTimeout(async () => {
        await reloadLockedAmount();
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


  return (
    <div className="text-white font-space flex items-center justify-center p-[40px_20px] lg:py-[80px] w-full">
      <TxReceipt
        visible={showTxModal}
        onClose={() => setShowTxModal(false)}
        title={txReceiptTitle}
        txHash={txHash}
      />
      {manageStakingModal && (
        <ManageStaking
          stakingPoolAddress={id as `0x${string}`}
          onClose={() => setManageStakingModal(false)}
          userAddress={user?.wallet?.address as `0x${string}`}
          refetch={loadUpData}
        />
      )}
      {showModal && (
        <ConfirmStakingModal
          stakeAmount={stakeAmount}
          tokenSymbol={data.stakingPool.stakeToken.symbol}
          onConfirm={handleStake}
          onClose={() => {
            setShowModal(false)
            setIsStaking(false)
          }}
          loading={isStaking}
          APY={data.stakingPool.apyRate}
        />
      )}
      {showUnstakeModal && (
        <ConfirmUnstaking
          tokenSymbol={data.stakingPool.stakeToken.symbol}
          onConfirm={handleWithdraw}
          onClose={() => {
            setShowUnstakeModal(false)
            setIsStaking(false)
          }}
          loading={isStaking}
          APY={data.stakingPool.apyRate}
          rewardsTokenSymbol={data.stakingPool.rewardToken.symbol}
          lockAmount={staked}
          nextRewardTime={nextRewardTime}
          rewardAmount={rewardAmount}
          lastStakeTime={lastStakeTime}
        />
      )}
      <div className="relative w-full lg:w-[60%] p-[20px] lg:p-[40px] overflow-hidden group border border-primary/50">
        {/* <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        <span className="absolute inset-[2px] bg-[#000027] clip-path-polygon transition-all duration-300 border border-primary"></span> */}

        <div className="relative">
          <div className="flex items-center justify-center relative">
            <div className="items-center flex justify-center space-x-[10px]">
              {coinGeckoData?.image?.thumb ? (
                <img src={coinGeckoData.image.thumb} className="h-[50px] w-[50px] rounded-full border" alt="" />
              ) : (
                <div className="h-[50px] w-[50px] rounded-full border flex items-center justify-center">?</div>
              )}
              <p className="text-[24px] font-[700]">{data.stakingPool.stakeToken.name}</p>
            </div>
            <div className="flex items-center space-x-[5px] absolute right-0 top-0">
              <p className="text-[#D4D4D4]">Status</p>
              {!paused ? (
                <p className="bg-[#02C35B]/15 text-[#23E33E] text-[14px] rounded-[5px] p-[2px_8px] text-center">
                  Live
                </p>
              ) : (
                <p className="bg-red-500/15 text-red-500 text-[14px] rounded-[5px] p-[2px_8px] text-center">
                  Paused
                </p>
              )}
            </div>
          </div>

          <form className="my-[20px] flex items-center w-full justify-center">
            <input
              className="text-primary text-[63px] text-center bg-transparent outline-none border-none"
              type="number"
              step={0.01}
              value={stakeAmount.toFixed(2)}
              onChange={(e) => setStakeAmount(Number(e.target.value))}
              min={0}
            />
          </form>

          <div className="">
            <div className="flex items-center justify-between">
              <p className="text-white text-[16px] mb-[5px]">Lock Amount: {staked}</p>
              <p className="text-white text-[14px] mb-[5px]">Balance {balance}</p>
            </div>
            <div className="bg-[#291254] mt-[20px] rounded-[8px] space-x-[10px] text-white p-[8px] flex items-center hover:cursor-pointer">
              <GoAlert className="text-[25px] lg:text-[20px]" />
              <p className="text-[12px] lg:text-[14px] leading-[16px] truncate" title={coinGeckoData?.description?.en || "..."}>
                {coinGeckoData?.description?.en || "..."}
              </p>
            </div>

            <div className="mt-[40px]">
              <p className="uppercase text-[14px] text-[#A1A1AA]">Staking Summary</p>
              <div className="mt-[20px] text-[12px] lg:text-[16px] grid grid-cols-2 gap-[10px]">
                <p>Current Price</p>
                <p>Currently priced at {coinGeckoData?.market_data?.current_price?.usd ? `**$${coinGeckoData.market_data.current_price.usd}**` : "**$???**"}.</p>
                <p>Market Cap</p>
                <p>Market Cap {coinGeckoData?.market_data?.market_cap?.usd ? `**$${new Intl.NumberFormat('en-US').format(coinGeckoData.market_data.market_cap.usd)}**` : "$???"} </p>
                <p>Total Supply</p>
                <p>{totalSupply ? new Intl.NumberFormat('en-US').format(Number(totalSupply)) : 0} (${data.stakingPool.stakeToken.symbol})</p>
              </div>
            </div>

            <div className="mt-[40px] text-[12px] lg:text-[16px] grid grid-cols-2 gap-[10px]">
              <p>Total Staked</p>
              <p>{data.stakingPool.totalStaked} {data.stakingPool.stakeToken.symbol}</p>
              <p>APY Rates</p>
              <p>{data.stakingPool.apyRate}%**</p>
              <p>Vesting Period </p>
              <p> {noOfDays(data.stakingPool.withdrawalIntervals)} days</p>
            </div>
          </div>

          {!authenticated ? (
            <button
              className="relative w-full py-3 mt-10 text-center overflow-hidden group-button"
              onClick={login}
            >
              <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
              <span className="absolute inset-[2px] bg-[#000027] transition-all duration-300 clip-path-polygon"></span>
              <span className="relative flex items-center justify-center gap-2">
                <IoWalletSharp className="text-[14px] lg:text-[16px]" />
                <span>Connect Wallet to Join</span>
              </span>
            </button>
          ) : (
            <div className="space-y-5">
              {/* Secondary Button - Manage Staking Pool */}
              {stakingPoolOwner.toLowerCase() === user?.wallet?.address?.toLowerCase() && (
                <button
                  className="relative w-full py-3 mt-10 text-center overflow-hidden group-button"
                  onClick={() => setManageStakingModal(true)}
                >
                  <span className="absolute inset-0 w-full h-full bg-secondary clip-path-polygon"></span>
                  <span className="absolute inset-[2px] bg-[#000027] transition-all duration-300 clip-path-polygon"></span>
                  <span className="relative">Manage Staking Pool</span>
                </button>
              )}

              {/* Primary Button - Withdraw */}
              {(staked > 0 || rewardAmount > 0) && (
                <button
                  className="relative w-full py-3 mt-10 text-center overflow-hidden group-button"
                  onClick={unstakeConfirm}
                >
                  <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
                  <span className="absolute inset-[2px] bg-[#000027] transition-all duration-300 clip-path-polygon"></span>
                  <span className="relative">Withdraw</span>
                </button>
              )}

              {/* Primary Button - Confirm Stake */}
              <button
                className="relative w-full py-3 mt-10 text-center overflow-hidden group-button"
                onClick={confirmStake}
              >
                <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
                <span className="absolute inset-[2px] bg-[#000027] transition-all duration-300 clip-path-polygon"></span>
                <span className="relative">Confirm Stake</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SingleStake
