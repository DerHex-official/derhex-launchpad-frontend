import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBondsData } from "../../context/BondsDataContext";
import { isBefore } from "date-fns";
import { FaDiscord, FaGlobe, FaTelegram, FaTwitter } from "react-icons/fa6";
import { differenceInDays } from "date-fns";
import CurrentChain from "../Presale/CurrentChain";
import { useWallets } from "@privy-io/react-auth";
import { usePrivy } from "@privy-io/react-auth";

function CountdownTimer({ time, endTime }: { time: number, endTime: number }) {
  const calculateTimeLeft = () => {
    const targetTime = parseInt(time.toString()) * 1000;
    const now = Date.now();

    if (targetTime <= now) {
      return { days: 0, hours: 0, minutes: 0 };
    }

    const days = Math.floor((targetTime - now) / (1000 * 60 * 60 * 24));
    const hours = Math.floor(((targetTime - now) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor(((targetTime - now) % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [time]);

  const startTimeUnix = time * 1000;
  const endTimeUnix = endTime * 1000;
  const now = Date.now();

  if (isBefore(new Date(startTimeUnix), new Date()) && isBefore(new Date(endTimeUnix), new Date())) {
    return <p className='text-white'>Bond Sale Ended</p>
  }

  if (isBefore(new Date(startTimeUnix), new Date()) && !isBefore(new Date(endTimeUnix), new Date())) {
    return <p className='text-white'>Bond Sale Live</p>
  }

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) {
    return <p className='text-white'>Bond Sale Starting</p>;
  }

  return (
    <p className='text-white'>
      {timeLeft.days}D {timeLeft.hours}H {timeLeft.minutes}M
    </p>
  );
}

function BondCard({ bond }: { bond: any }) {
  const navigate = useNavigate();
  const [currentChain, setCurrentChain] = useState<string>("56");
  const { wallets } = useWallets();
  const { authenticated } = usePrivy();

  useEffect(() => {
    if (authenticated && wallets.length !== 0) {
      const wallet = wallets[0];
      const info = wallet.chainId;
      const id = info.split(":")[1];
      setCurrentChain(id);
    }
  }, [authenticated, wallets]);

  if (!bond) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  console.log(bond)

  const totalSold = parseFloat(bond.totalSold || "0");
  const bondSize = parseFloat(bond.bondSize || "0");
  const progress = (totalSold / bondSize) * 100;

  return (
    <div
      className="overflow-hidden relative bg-[#111115] border border-primary/20 transition-all hover:scale-[1.01] duration-300 hover:cursor-pointer shadow-[0_0_15px_2px_rgba(83,37,169,0.3)] hover:shadow-[0_0_25px_5px_rgba(83,37,169,0.5)]"
      onClick={() => navigate(`/deals/bonds/${bond?.bondInfo?.projectName.toLowerCase()}`)}
    >
      <div className="h-[150px] w-full border-b relative">
        <img
          src={bond?.bondInfo?.images?.bg}
          className="h-full w-full object-cover"
          alt={bond?.bondInfo?.projectName}
        />
        <div className="absolute top-0 right-0 bg-[#291254] px-4 py-1 text-white">
          {bond.isPrivateBond ? "Private Bond" : "Public Bond"}
        </div>
      </div>

      <div className="h-[80px] w-[80px] absolute top-[110px] left-[20px] z-20 border-[#291254] border-[7px] bg-black p-3">
        <img src={bond?.bondInfo?.images?.logo} className="h-full w-full object-contain" alt="" />
      </div>

      <div className="w-full">
        <div className="text-white w-full items-center flex justify-end">
          <div className="bg-[#291254] uppercase p-2">
            <CurrentChain chainId={currentChain} />
          </div>
        </div>

        <div className="p-[20px] mt-[10px] text-[#FAFAFA]">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-[28px] font-[500]">
              {bond?.bondInfo?.projectName || "Unknown Project"}
            </p>
            <p className="line-clamp-2">
              {bond?.bondInfo?.description || "No description available"}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#ACBBCC]">Discount Rate</span>
                <span className="text-white">
                  {(bond.initialDiscountPercentage).toFixed()}% to {(bond.finalDiscountPercentage).toFixed()}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#ACBBCC]">Vesting Duration</span>
                <span className="text-white">
                  {bond.linearVestingEndTime && bond.linearVestingEndTime > 0 ? (
                    differenceInDays(new Date(bond.linearVestingEndTime * 1000), new Date(bond.withdrawTime * 1000))
                  ) : (
                    0
                  )} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#ACBBCC]">Status</span>
                <CountdownTimer
                  time={bond.saleStartTime}
                  endTime={bond.saleEndTime}
                />
              </div>

              <div className="flex justify-center gap-x-3 mt-3">
                {bond?.bondInfo?.website && (
                  <Link to={bond.bondInfo.website} target="_blank" rel="noopener noreferrer">
                    <FaGlobe size={20} />
                  </Link>
                )}
                {bond?.bondInfo?.socials?.twitter && (
                  <Link to={bond.bondInfo.socials.twitter} target="_blank" rel="noopener noreferrer">
                    <FaTwitter size={20} />
                  </Link>
                )}
                {bond?.bondInfo?.socials?.telegram && (
                  <Link to={bond.bondInfo.socials.telegram} target="_blank" rel="noopener noreferrer">
                    <FaTelegram size={20} />
                  </Link>
                )}
                {bond?.bondInfo?.socials?.discord && (
                  <Link to={bond.bondInfo.socials.discord} target="_blank" rel="noopener noreferrer">
                    <FaDiscord size={20} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveAndUpcoming() {
  const { data } = useBondsData();
  const [filteredBonds, setFilteredBonds] = useState<any[]>([]);

  useEffect(() => {
    if (data) {
      const currentTime = Date.now();
      const filtered = data.filter((bond: any) => {
        const endTime = Number(bond.saleEndTime) * 1000;
        return isBefore(currentTime, endTime);
      });
      setFilteredBonds(filtered);
    }
  }, [data]);

  return (
    <div className="font-space flex flex-col p-[40px_20px] lg:p-[40px]">
      <div className="flex flex-col items-start text-white">
        <p className="text-[32px] lg:text-[56px] font-[700] leading-[36px] lg:leading-[60px]">
          Live & Upcoming<br />Bond Campaigns
        </p>
      </div>
      <div className="w-full mx-auto">
        <div className="grid gap-[40px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-[40px]">
          {filteredBonds.length > 0 ? (
            filteredBonds.map((bond: any, index: number) => (
              <BondCard key={index} bond={bond} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 py-10">
              No upcoming bonds at the moment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveAndUpcoming;