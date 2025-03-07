// import React from 'react'

import { useNavigate } from "react-router-dom";

interface SaleCardProps {
  img: string;
  projectName: string;
  projectDescription: string;
  saleStartTime: number;
  whitelistStatus: boolean;
}

function SaleCard() {
  const navigation = useNavigate();
  return (
    <div className=" rounded-[10px] overflow-hidden relative bg-[#27272A]">
      <div className="h-[150px] w-full border-b">
        <img
          src="/ido-image.svg"
          className="h-full w-full object-cover"
          alt=""
        />
      </div>

      <div className="absolute top-[8.8rem] w-[80px] left-0 h-[25px] bg-[#291254] z-0">

      </div>
      <div className="h-[88px] w-[88px] rounded-full absolute top-[100px] left-[20px] z-20  border-[#291254] border-[7px]">
        <img src="https://sonicscan.org/assets/sonic/images/svg/logos/token-light.svg" className="h-full w-full" alt="" />
      </div>
      <div className="w-full">
        <div className=" text-white w-full items-center flex justify-end">
          <p className="bg-[#291254] uppercase text-[14px] p-[5px_20px] rounded-bl-[5px]">
            Refundable ido
          </p>
        </div>
        <div className="p-[10px_20px] mt-[10px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[28px] font-[500] text-[#FAFAFA]">
                XYZ Protocol
              </p>
              <p className="text-[#A1A1AA]">A DeFi protocol for lending</p>
            </div>
            <div className="h-[49px] w-[49px]  rounded-full">
              <img src="https://sonicscan.org/assets/sonic/images/svg/logos/token-light.svg" alt="" />
            </div>
          </div>
          <div className="mt-[10px] flex flex-col w-full space-y-[5px]">
            <div className="flex space-x-[10px] items-center justify-between ">
              <p className="text-[#ACBBCC] flex-1 text-start text-[14px]">
                Token Sale Date
              </p>
              <div className="bg-primary w-[64px]  h-[2px]" />
              <p className="text-[14px] flex-1 text-end text-[#FAFAFA]">
                Oct 20, 2024
              </p>
            </div>
            <div className="flex space-x-[10px] items-center justify-between ">
              <p className="text-[#ACBBCC] text-start flex-1 text-[14px]">
                Sale Starts In
              </p>
              <div className="bg-primary w-[64px] h-[2px]" />
              <p className="text-[14px] flex-1 text-end text-[#FAFAFA]">
                3D 4H 21M
              </p>
            </div>
            <div className="flex space-x-[10px] items-center justify-between ">
              <p className="text-[#ACBBCC] flex-1 text-start text-[14px]">
                Whitelist Status
              </p>
              <div className="bg-primary w-[64px]  h-[2px]" />
              <p className="text-[14px] flex-1 text-end text-[#FAFAFA]">
                Whitelist Open
              </p>
            </div>
          </div>
        </div>
        <div onClick={() => navigation('/launchpad/dbb2ef')} className="bg-[#5325A9] mt-[20px] text-white h-[35px] uppercase flex items-center justify-center cursor-pointer">
          Join Whitelist
        </div>
      </div>
    </div>
  );
}

export default SaleCard;
