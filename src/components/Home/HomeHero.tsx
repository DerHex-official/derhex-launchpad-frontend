// import React from 'react'
import { FaArrowCircleRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const chains: string[] = [
  "/icons/blockchain/eth.svg",
  "/icons/blockchain/binance.svg",
  "/icons/blockchain/polygon.svg",
  "/icons/blockchain/avalanche.svg",
  "/icons/blockchain/sonic.svg"
]

function HomeHero() {
  return (
    <div className="relative overflow-hidden hero-bg font-space">
      {/* <img src="/der-rows.svg" className=" w-full h-[400px]" alt="" /> */}
      <div className="h-[400px] w-[400px] top-0 absolute rounded-full left-[-10%] blur-[40px] bg-[#8949FF33]"></div>
      <div className="h-[500px] w-[500px] top-0 absolute rounded-full right-[-10%] blur-[40px] bg-[#8949FF33]"></div>
      <div className=" text-white min-w-full  items-center grid lg:grid-cols-2 p-[40px_20px] lg:p-[40px]">
        <div>
          <p className="text-[40px] lg:text-[70px] font-[700] leading-[45px] lg:leading-[75px]">The Future of Token <br className="hidden lg:block" /> Launches</p>
          <p className="text-[18px] lg:text-[22px] leading-[25px] lg:leading-[27px] mt-[5px] lg:mt-[10px]">Discover, Invest, and Empower the Next <br className="hidden lg:block" /> Big Blockchain Giants – Join Early, Earn Rewards, Shape the Future</p>
          <div className="flex flex-wrap gap-3">
            <Link to="#upcomingido" className="border-2 border-primary hover:bg-primary transition-all duration-300 p-[8px_20px] mt-[20px] font-[500] text-[20px] text-white rounded-full flex items-center space-x-[5px]">
              <span>Upcoming IDOs</span>
              <FaArrowCircleRight className="text-white ml-2" />
            </Link>
            <Link to="/lock-stake" className="border-2 border-primary hover:bg-primary transition-all duration-300 p-[8px_20px] mt-[20px] font-[500] text-[20px] text-white rounded-full flex items-center space-x-[5px]">
              <span>Stake $DRX</span>
              <FaArrowCircleRight className="text-white ml-2" />
            </Link>
            <Link to="https://t.me/+SZiyw7ZP9gliM2Fk" target="_blank" className="border-2 border-primary hover:bg-primary transition-all duration-300 p-[8px_20px] mt-[20px] font-[500] text-[20px] text-white rounded-full flex items-center space-x-[5px]">
              <span>Get Notified</span>
              <FaArrowCircleRight className="text-white ml-2" />
            </Link>
          </div>
          <div className="flex items-center space-x-[10px] mt-[20px] border-2 border-primary max-w-fit p-3 rounded-full hover:cursor-pointer duration-300 transition-all hover:bg-primary">
            <div className="flex items-center -space-x-1.5">
              {chains.map((chain, index) => {
                return (
                  <img
                    src={chain}
                    alt=""
                    key={index}
                    className="w-[25px] h-[25px] object-contain hover:scale-110 transition-transform duration-200 filter brightness-0 invert p-1"
                  />
                )
              })}
            </div>
            <p className="text-xl">Supported Blockchains</p>
          </div>
        </div>
        <div className="mt-[40px] lg:mt-0 flex items-center justify-end">
          <img src="/hero-der.svg" alt="" />
        </div>
      </div>
    </div>
  )
}

export default HomeHero
