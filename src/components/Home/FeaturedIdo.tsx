// import React from 'react'
import { useEffect, useState } from "react";
import SaleCard from "../Global/SaleCard";
import { usePresalesData } from "../../context/PresalesDataContext";
import { isBefore } from "date-fns";

function FeaturedIdo() {
  const { data } = usePresalesData();
  const [filteredSales, setFilteredSales] = useState<[]>([]);

  useEffect(() => {
    if (data) {
      const currentTime = Date.now();
      const filtered = data.filter((presale: any) => {
        // const startTime = Number(presale.startTime) * 1000;
        const endTime = (Number(presale.endTime) + Number(presale.withdrawDelay)) * 1000;
        return isBefore(currentTime, endTime) // Show presales that haven't ended yet
      });
      setFilteredSales(filtered);
    }
  }, [data]);

  return (
    <div className="font-space flex flex-col p-[40px_20px] lg:p-[40px]" id="upcomingido">
      <div className="flex flex-col items-start text-white">
        <p className="text-[32px] lg:text-[56px] font-[700] leading-[36px] lg:leading-[60px]">Featured Upcoming &<br /> Ongoing IDO Sales</p>
        <p className="text-[14px] lg:text-[19px] text-[#A1A1AA]">
          Don't Miss Out on the Next Big Project!
        </p>
      </div>
      <div className="w-full mx-auto">
        <div className="grid gap-[40px] sm:grid-cols-2 md:grid-cols-3  xl:grid-cols-4 mt-[40px]">
          {filteredSales.length > 0 ? (
            filteredSales.map((presale: any, index: any) => (
              <SaleCard key={index} presale={presale} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400">
              No upcoming or active IDOs at the moment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeaturedIdo;
