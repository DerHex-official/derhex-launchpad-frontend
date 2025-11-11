// import React from 'react'

import { useState } from "react";
import toast from "react-hot-toast";
import { FaCheck } from "react-icons/fa6";
import { isValidERC20, getTokenSymbol, getStakingPoolFactoryFee } from "../../utils/web3/actions";
import { Preloader, Oval } from 'react-preloader-icon';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import stakingPoolActionsABI from "../../abis/StakingPoolActions.json";
import { useChain } from "../../context/ChainContext";
import { publicClient } from "../../config";
import { createWalletClient, custom } from "viem";
import { useNavigate } from "react-router-dom";
import { getContractAddress } from "../../utils/source";

// The createViemWalletClient function will be defined inside the component

function PoolForm() {
  const { publicClient } = useChain();

  // Add this function to create wallet client
  const createViemWalletClient = () => {
    return createWalletClient({
      chain: publicClient.chain,
      transport: custom(window.ethereum as any)
    });
  };

  // const abi = [ /* Your Contract ABI Here */ ];
  // const contractAddress = "0x6cE168E73C64a502d4850CCE952bb2b75a3F4711";
  // const provider = new ethers.JsonRpcProvider("https://your-rpc-url");
  // const contract = new ethers.Contract(contractAddress, stakingPoolActions.abi, provider);
  const { user, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const [loading, setLoading] = useState<boolean>(false)
  const [tab, setTab] = useState<number>(0);

  const [stakingSymbol, setStakingSymbol] = useState<string>("")
  const [rewardSymbol, setRewardSymbol] = useState<string>("")
  const navigate = useNavigate();


  const [poolData, setPoolData] = useState({
    stakingTokenAddress: `0x` as `0x${string}`,
    rewardTokenAddress: "0x" as `0x${string}`,
    stakeFeePercentage: 0,
    apyRate: 0,
    withdrawalFeePercentage: 0,
    withdrawalIntervals: 0,
  })

  const { stakingTokenAddress, rewardTokenAddress, stakeFeePercentage, withdrawalFeePercentage, withdrawalIntervals, apyRate } = poolData;


  const handleNextMove = async () => {
    if (!authenticated) {
      toast("Login to Wallet")
      login();
      return;
    }
    if (tab === 0) {
      setLoading(true)
      // Validate for the first step
      if (!stakingTokenAddress.trim()) {
        toast.error("Staking Token Symbol is required!");
        return;
      }
      if (!rewardTokenAddress.trim()) {
        toast.error("Reward Token Address is required!");
        return;
      }

      try {
        const isStakingTokenValid = await isValidERC20(stakingTokenAddress);
        const isRewardTokenValid = await isValidERC20(rewardTokenAddress);

        if (!isStakingTokenValid || !isRewardTokenValid) {
          toast("Make sure Staking and Reward Tokens are valid ERC20 Tokens")
          return;
        }

        const stkSymbol = await getTokenSymbol(stakingTokenAddress)
        const rdSymbol = await getTokenSymbol(rewardTokenAddress);
        setStakingSymbol(stkSymbol as string);
        setRewardSymbol(rdSymbol as string);


        setTab(tab + 1);
      } catch (error: any) {
        toast.error(error.message || "Error validating token addresses");
        return;
      } finally {
        setLoading(false)
      }
    } else if (tab === 1) {
      setLoading(true)
      // Validate for the second step
      if (withdrawalIntervals === 0) {
        toast.error("Withdrawal interval can't be zero!");
        return;
      }

      if (withdrawalIntervals === 0) {
        toast.error("Number of Days is required!");
        return;
      }

      if (apyRate === 0) {
        toast.error("APY Rate is required!");
        return;
      }

      setLoading(false)
      // If valid, proceed to the next tab
      setTab(tab + 1);
    } else if (tab === 2) {
      await createStakingPool();
      console.log("Submitting data: ", poolData);
      // toast.success("Staking Pool created successfully!");
    }
  }

  async function createStakingPool() {
    setLoading(true)
    // await wallet.switchChain(sonic.id);
    try {
      const StakingPoolFactoryCA = getContractAddress("stakingPoolFactory")
      // Ensure all values are correctly formatted
      const formatPercentage = (value: number) => Math.round((value / 100) * 1e4);
      const formatRewardBasis = (value: number) => value * 24 * 60 * 60; // No of Days
      const formatAPYRate = (value: number) => Math.round(value * 1e4);

      // Format the values
      const stakeFeePercentage = formatPercentage(poolData.stakeFeePercentage);
      const withdrawalFeePercentage = formatPercentage(poolData.withdrawalFeePercentage);
      const noOfDays = formatRewardBasis(poolData.withdrawalIntervals);
      const apyRate = formatAPYRate(poolData.apyRate);

      // Submit the data
      const walletClient = createViemWalletClient();
      const [account] = await walletClient.getAddresses();

      if (!account) {
        toast("Connect Wallet");
        return;
      }

      const fee: string = await getStakingPoolFactoryFee();

      // Get wallet balance
      const balance = await publicClient.getBalance({
        address: account
      });

      // Compare balance with required fee
      if (balance < BigInt(fee)) {
        toast(`Insufficient SONIC balance. You need at least ${Number(fee) / 1e18} SONIC to create a staking pool`);
        setLoading(false);
        return;
      }

      const { request, result } = await publicClient.simulateContract({
        address: StakingPoolFactoryCA,
        abi: stakingPoolActionsABI,
        functionName: "createStakingPool",
        account,
        args: [
          user?.wallet?.address,
          poolData.stakingTokenAddress,
          poolData.rewardTokenAddress,
          apyRate,
          stakeFeePercentage,
          withdrawalFeePercentage,
          user?.wallet?.address,
          noOfDays
        ],
        value: BigInt(fee)
      })

      const hash = await walletClient.writeContract(request)

      console.log(hash, result);

      toast.success("Successfully Created New Staking Pool")
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt && receipt.status === "success") {
        navigate("/staking-pool")
      }
    } catch (err: any) {
      console.error("Staking Pool", err);
      toast.error("Creating Staking Pool Failed")
    } finally {
      setLoading(false)
    }

  }






  //   const _newOwner = "0x" + "0".repeat(40);
  //   const _token0 = stakingTokenSymbol;
  //   const _token1 = "0x" + "0".repeat(40);
  //   const _apyRate = Number(apyRate);
  //   const _stakeFeePercentage = parseInt(stakeFee);
  //   const _withdrawalFeePercentage = parseFloat(withdrawalFee);
  //  const _feeReceiver = rewardTokenAddress;
  //  const _intervals = BigInt(numberOfDays)





  const renderButton = () => {
    return (
      <button
        onClick={handleNextMove}
        className={` bg-primary text-white p-[10px_20px] mt-[20px] rounded-[8px] w-full h-[50px] flex items-center justify-center`}
      >
        {!authenticated ? "Connect Wallet" : loading ? (
          <Preloader
            use={Oval}
            size={32}
            strokeWidth={8}
            strokeColor="#FFF"
            duration={800}
          />
        ) : tab === 2 ? "Create Staking Pool" : "Continue"}

      </button>
    );
  };

  return (
    <div className="p-[40px_20px] lg:p-[100px_40px] font-space">
      <div className="flex flex-col lg:flex-row items-start  gap-[20px] text-white">
        <div className="w-full h-full lg:w-[30%] ">
          <p className="text-[20px] lg:text-[36px] font-[500]">
            Create Staking Pool
          </p>
          <div className="w-full flex items-center lg:hidden mt-[40px]  justify-between">
            <div className="flex   w-full items-center">
              <div className="w-fit  flex flex-col lg:flex-row items-center space-x-[5px]">
                <div
                  className={`${tab > 0 ? "bg-[#28C76B]" : "border-[#8949FF] bg-[#291254]"
                    } h-[40px] w-[40px] border rounded-full flex items-center justify-center`}
                >
                  {tab > 0 ? (
                    <FaCheck className="text-white text-[20px]" />
                  ) : (
                    <p className="text-white text-[20px] font-[600]">1</p>
                  )}
                </div>
                <p className="font-[500] text-[#848895] text-[14px] text-center leading-[15px] lg:leading-[20px] mt-[5px] lg:mt-0 lg:text-[16px]">
                  Token Information
                </p>
              </div>
              <div
                className={` ${tab > 0 ? "border-[#28C76B]" : "border-[#5325A9] "
                  } w-full lg:w-fit  lg:h-[150px] border border-dotted"`}
              ></div>
            </div>
            <div className="flex w-full items-center">
              <div className="w-fit  flex flex-col lg:flex-row items-center space-x-[5px]">
                <div
                  className={`${tab > 1 ? "bg-[#28C76B]" : "border-[#8949FF] bg-[#291254]"
                    } h-[40px] w-[40px] border rounded-full flex items-center justify-center`}
                >
                  {tab > 1 ? (
                    <FaCheck className="text-white text-[20px]" />
                  ) : (
                    <p className="text-white text-[20px] font-[600]">2</p>
                  )}
                </div>
                <p className="font-[500] text-[#848895] text-[14px] text-center leading-[15px] lg:leading-[20px] mt-[5px] lg:mt-0 lg:text-[16px]">
                  Staking Information
                </p>
              </div>
              <div
                className={` ${tab > 1 ? "border-[#28C76B]" : "border-[#5325A9] "
                  } w-full lg:w-fit  lg:h-[150px] border border-dotted"`}
              ></div>
            </div>


            <div className="flex  flex-col lg:mt-[20px] items-center">
              <div className="flex flex-col lg:flex-row items-center space-x-[5px]">
                <div
                  className={`${tab > 2 ? "bg-[#28C76B]" : "border-[#8949FF] bg-[#291254]"
                    } h-[40px] w-[40px] border rounded-full flex items-center justify-center`}
                >
                  {tab > 2 ? (
                    <FaCheck className="text-white text-[20px]" />
                  ) : (
                    <p className="text-white text-[20px] font-[600]">3</p>
                  )}
                </div>
                <p className="font-[500] text-[#848895] text-[14px] w-[100px]   text-center leading-[15px] lg:leading-[20px] mt-[5px] lg:mt-0 lg:text-[16px]">
                  Review & Submit
                </p>
              </div>
            </div>
          </div>
          <div className="hidden w-full lg:flex flex-row lg:flex-col mt-[20px] items-start justify-start">
            <div className="flex-1 flex flex-row lg:flex-col lg:space-y-[10px] items-start">
              <div className="flex flex-col lg:flex-row items-center lg:space-x-[5px]">
                <div
                  className={`${tab > 0 ? "bg-[#28C76B]" : "border-[#8949FF] bg-[#291254]"
                    } h-[40px] w-[40px] border rounded-full flex items-center justify-center`}
                >
                  {tab > 0 ? (
                    <FaCheck className="text-white text-[20px]" />
                  ) : (
                    <p className="text-white text-[20px] font-[600]">1</p>
                  )}
                </div>
                <p className="font-[500] text-[#848895] text-[12px] text-center leading-[15px] lg:leading-[20px] mt-[5px] lg:mt-0 lg:text-[16px]">
                  Token Information
                </p>
              </div>
              <div className="w-full lg:w-[40px] min-h-full flex justify-center items-center">
                <div
                  className={` ${tab > 0 ? "border-[#28C76B]" : "border-[#5325A9] "
                    } w-full lg:w-fit  lg:h-[150px] border border-dotted"`}
                ></div>
              </div>
            </div>
            <div className="flex-1  flex flex-vrow lg:flex-col lg:mt-[20px] space-y-[10px] items-start">
              <div className="w-full flex flex-col lg:flex-row items-center space-x-[5px]">
                <div
                  className={`${tab > 1 ? "bg-[#28C76B]" : "border-[#8949FF] bg-[#291254]"
                    } h-[40px] w-[40px] border rounded-full flex items-center justify-center`}
                >
                  {tab > 1 ? (
                    <FaCheck className="text-white text-[20px]" />
                  ) : (
                    <p className="text-white text-[20px] font-[600]">2</p>
                  )}
                </div>
                <p className="font-[500] text-[#848895] text-[12px] text-center leading-[15px] lg:leading-[20px] mt-[5px] lg:mt-0 lg:text-[16px]">
                  Staking Information
                </p>
              </div>
              <div className="w-[40px] flex justify-center items-center">
                <div className="w-full lg:w-[40px] min-h-full flex justify-center items-center">
                  <div
                    className={` ${tab > 1 ? "border-[#28C76B]" : "border-[#5325A9] "
                      } w-full lg:w-fit  lg:h-[150px] border border-dotted"`}
                  ></div>
                </div>{" "}
              </div>
            </div>
            <div className="flex flex-col mt-[20px] items-center">
              <div className="flex items-center space-x-[5px]">
                <div
                  className={`${tab > 2 ? "bg-[#28C76B]" : "border-[#8949FF] bg-[#291254]"
                    } h-[40px] w-[40px] border rounded-full flex items-center justify-center`}
                >
                  {tab > 2 ? (
                    <FaCheck className="text-white text-[20px]" />
                  ) : (
                    <p className="text-white text-[20px] font-[600]">3</p>
                  )}
                </div>
                <p className="font-[500] text-[#848895] text-[12px] text-center leading-[15px] lg:leading-[20px] mt-[5px] lg:mt-0 lg:text-[16px]">
                  Review & Submit
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-full lg:w-[70%]  bg-[#17043B] p-[20px] lg:p-[40px] flex flex-col items-center justify-center rounded-[16px] space-y-[20px] lg:space-y-[80px]">
          <div className="flex items-center justify-between w-full">
            {tab > 0 && (
              <div className="cursor-pointer" onClick={() => setTab(tab - 1)}>back</div>)}
            <p className="text-[20px] lg:text-[36px] font-[500] grow text-center">
              {tab === 0
                ? " Enter token addresses for Staking and reward"
                : tab === 1
                  ? "Staking Information"
                  : "Review Information"}
            </p>
          </div>
          {tab === 0 && (
            <div className="flex flex-col w-full space-y-[20px] lg:space-y-[80px]">
              <div className="w-full">
                <p>Staking Token (CA)</p>
                <input
                  value={stakingTokenAddress}
                  onChange={(e) =>
                    setPoolData({ ...poolData, stakingTokenAddress: e.target.value as `0x${string}` })
                  }
                  type="text"
                  className="mt-[8px] outline-none px-[10px] rounded-[8px] h-[50px] w-full bg-[#291254]"
                />
              </div>
              <div className="w-full">
                <p>Reward Token Address</p>
                <input
                  value={rewardTokenAddress}
                  onChange={(e) =>
                    setPoolData({ ...poolData, rewardTokenAddress: e.target.value as `0x${string}` })
                  }
                  type="text"
                  className="mt-[8px] outline-none px-[10px] rounded-[8px] h-[50px] w-full bg-[#291254]"
                />
              </div>
            </div>
          )}
          {tab === 1 && (
            <div className="flex flex-col w-full space-y-[40px]">
              <div className="w-full">
                <p>Stake Fee (%)</p>
                <input
                  value={stakeFeePercentage}
                  onChange={(e) =>
                    setPoolData({ ...poolData, stakeFeePercentage: Number(e.target.value) })
                  }
                  type="number"
                  className="mt-[8px] outline-none px-[10px] rounded-[8px] h-[50px] w-full bg-[#291254]"
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="w-full">
                <p>Withdrawal Fee (%)</p>
                <input
                  value={withdrawalFeePercentage}
                  onChange={(e) =>
                    setPoolData({ ...poolData, withdrawalFeePercentage: Number(e.target.value) })
                  }
                  type="number"
                  className="mt-[8px] outline-none px-[10px] rounded-[8px] h-[50px] w-full bg-[#291254]"
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="w-full">
                <p>APY Rate (%)</p>
                <input
                  value={apyRate}
                  onChange={(e) =>
                    setPoolData({ ...poolData, apyRate: Number(e.target.value) })
                  }
                  type="number"
                  className="mt-[8px] outline-none px-[10px] rounded-[8px] h-[50px] w-full bg-[#291254]"
                />
              </div>
              <div className="w-full">
                <p>Withdrawal Intervals (No. of Days) </p>
                <input
                  value={withdrawalIntervals}
                  onChange={(e) =>
                    setPoolData({ ...poolData, withdrawalIntervals: Number(e.target.value) })
                  }
                  type="number"
                  className="mt-[8px] outline-none px-[10px] rounded-[8px] h-[50px] w-full bg-[#291254]"
                />
              </div>
            </div>
          )}
          {tab === 2 && (
            <div className="flex flex-col w-full space-y-[40px]">
              <div className="space-y-[20px]">
                <div className="flex flex-col space-y-[10px] p-[20px] rounded-[8px] bg-[#291254]">
                  <h3 className="text-[18px] font-[500]">Pool Owner & Fee Receiver</h3>
                  <p className="text-[#848895] break-all">{user?.wallet?.address}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
                  <div className="flex flex-col space-y-[10px] p-[20px] rounded-[8px] bg-[#291254]">
                    <h3 className="text-[18px] font-[500]">Staking Token</h3>
                    <p className="text-[#848895]">{stakingSymbol}</p>
                  </div>
                  <div className="flex flex-col space-y-[10px] p-[20px] rounded-[8px] bg-[#291254]">
                    <h3 className="text-[18px] font-[500]">Reward Token</h3>
                    <p className="text-[#848895]">{rewardSymbol}</p>
                  </div>
                  <div className="flex flex-col space-y-[10px] p-[20px] rounded-[8px] bg-[#291254]">
                    <h3 className="text-[18px] font-[500]">Stake Fee</h3>
                    <p className="text-[#848895]">{poolData.stakeFeePercentage}%</p>
                  </div>
                  <div className="flex flex-col space-y-[10px] p-[20px] rounded-[8px] bg-[#291254]">
                    <h3 className="text-[18px] font-[500]">Withdrawal Fee</h3>
                    <p className="text-[#848895]">{poolData.withdrawalFeePercentage}%</p>
                  </div>
                  <div className="flex flex-col space-y-[10px] p-[20px] rounded-[8px] bg-[#291254]">
                    <h3 className="text-[18px] font-[500]">APY Rate</h3>
                    <p className="text-[#848895]">{poolData.apyRate}%</p>
                  </div>
                  <div className="flex flex-col space-y-[10px] p-[20px] rounded-[8px] bg-[#291254]">
                    <h3 className="text-[18px] font-[500]">Withdrawal Intervals</h3>
                    <p className="text-[#848895]">{poolData.withdrawalIntervals} Days</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="w-full">{renderButton()}</div>
        </div>
      </div>
    </div>
  );
}

export default PoolForm;
