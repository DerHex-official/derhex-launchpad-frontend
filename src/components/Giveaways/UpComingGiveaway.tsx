// import React from 'react'
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GiveawayCardCompleted from "./StatusCard/";
import { useGiveawaysData } from "../../context/GiveawaysDataContext";
import { isBefore } from "date-fns";

function UpComingGiveaways() {
    const { data } = useGiveawaysData();
    const [filteredGiveaways, setFilteredGiveaways] = useState<any[]>([]);

    useEffect(() => {
        if (data) {
            const currentTime = Date.now();
            const filtered = data.filter((giveaway: any) => {
                const endTime = (Number(giveaway.whitelistEndTime)) * 1000;
                return isBefore(currentTime, endTime);
            });
            setFilteredGiveaways(filtered);
        }
    }, [data]);

    return (
        <div className="font-space flex flex-col p-[40px_20px] lg:p-[40px]">
            <div className="flex flex-col items-start text-white">
                <p className="text-[32px] lg:text-[56px] font-[700] leading-[36px] lg:leading-[60px]">
                    Upcoming & Ongoing<br />Airdrop Campaigns
                </p>
            </div>
            <div className="w-full mx-auto">
                <div className="grid gap-[40px] grid-cols-3 mt-[40px]">
                    {filteredGiveaways.length > 0 ? (
                        filteredGiveaways.map((giveaway: any, index: number) => (
                            <GiveawayCardCompleted key={index} giveaway={giveaway} />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-400">
                            No upcoming giveaways at the moment
                        </div>
                    )}
                </div>
            </div>
            {/* <Link
                to="/explore"
                className="relative text-[#FAFAFA] mt-[50px] p-[8px_20px] w-fit mx-auto overflow-hidden group-button"
            >
                <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
                <span className="absolute inset-[2px] bg-black transition-all duration-300 clip-path-polygon"></span>
                <span className="relative">View All Airdrops</span>
            </Link> */}
        </div>
    );
}

export default UpComingGiveaways;
