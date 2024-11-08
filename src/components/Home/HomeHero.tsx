// import React from 'react'
import { FaArrowCircleRight } from "react-icons/fa";
function HomeHero() {
  return (
    <div className="relative overflow-hidden hero-bg">
        {/* <img src="/der-rows.svg" className=" w-full h-[400px]" alt="" /> */}
        <div className="h-[400px] w-[400px] top-0 absolute rounded-full left-[-10%] blur-[40px] bg-[#8949FF33]"></div>
        <div className="h-[500px] w-[500px] top-0 absolute rounded-full right-[-10%] blur-[40px] bg-[#8949FF33]"></div>
        <div className=" text-white min-w-full  items-center grid lg:grid-cols-2 p-[40px_20px] lg:p-[40px]">
            <div>
                <p className="text-[40px] lg:text-[70px] font-[700] leading-[45px] lg:leading-[75px]">The Future of Token <br className="hidden lg:block" /> Launches</p>
                <p className="text-[18px] lg:text-[22px] leading-[20px] lg:leading-[27px] mt-[5px] lg:mt-[10px]">Discover, Invest, and Empower the Next <br className="hidden lg:block" /> Big Blockchain Giants – Join Early, Earn Rewards, Shape the Future</p>
                <button className="bg-primary p-[8px_20px] mt-[20px] font-[500] text-[20px] text-white rounded-full flex items-center space-x-[5px]">
                  <span>Upcoming IDOs</span>

                <FaArrowCircleRight className="text-white" />

                </button>
            </div>
            <div className=" flex items-center justify-end">
            <img src="/hero-der.svg" alt="" />
            </div>
        </div>
    </div>
  )
}

export default HomeHero