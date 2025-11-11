import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBondsData } from '../../context/BondsDataContext';
import { useChain } from '../../context/ChainContext';
import { CHAIN_ID } from '../../utils/source';
import { differenceInDays, format } from 'date-fns';

function FeaturedBonds() {
    const { selectedChain } = useChain();
    const { data, refetch } = useBondsData();
    const [featuredBond, setFeaturedBond] = useState<any>(null);
    const navigate = useNavigate();

    // Log the current chain when the component renders
    useEffect(() => {
        console.log(`FeaturedBonds: Rendering with chain ${selectedChain} (Global: ${CHAIN_ID})`);

        // Force a refetch when the chain changes
        console.log(`FeaturedBonds: Chain changed, refetching data...`);
        refetch();
    }, [selectedChain, CHAIN_ID, refetch]);

    // Select the most recent upcoming bond as the featured bond
    useEffect(() => {
        if (data && Array.isArray(data) && data.length > 0) {
            try {
                // Sort bonds by start time, most recent first
                const sortedBonds = [...data].sort((a, b) => b.saleStartTime - a.saleStartTime);

                // Find the first bond that has metadata and take it as featured
                const featured = sortedBonds.find(bond => {
                    return bond && bond.bondInfo && bond.metadataURI &&
                           bond.initialDiscountPercentage !== undefined &&
                           bond.finalDiscountPercentage !== undefined;
                });

                if (featured) {
                    console.log('Found featured bond:', featured.bondInfo?.projectName);
                    setFeaturedBond(featured);
                } else {
                    console.log('No suitable bond found for featuring');
                    setFeaturedBond(null);
                }
            } catch (error) {
                console.error('Error processing bond data:', error);
                setFeaturedBond(null);
            }
        } else {
            console.log('No bond data available');
            setFeaturedBond(null);
        }
    }, [data]);

    // Don't show the featured section if there's no featured bond
    if (!featuredBond) {
        return null;
    }

    return (
        <div className='text-white p-[40px_20px] lg:p-[40px] flex items-center justify-center font-space shadow'>
            <div className='border w-[75%] h-full grid grid-cols-6'>
                <div className='w-full min-h-full relative h-full col-span-4'
                >
                    <div className="bg-black bg-opacity-50 flex flex-col items-center justify-center p-6 h-full text-center" style={
                        featuredBond?.bondInfo?.images?.bg ? {
                            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${featuredBond?.bondInfo?.images?.bg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            height: "100%",
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        } : {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }
                    }>
                        <div className="max-w-[600px]">
                            <img
                                src={featuredBond?.bondInfo?.images?.logo}
                                alt={featuredBond?.bondInfo?.projectName}
                                className="w-24 h-24 rounded-full mb-6 mx-auto"
                            />
                            <h2 className="text-4xl font-bold mb-4">{featuredBond?.bondInfo?.projectName}</h2>
                            <p className="text-gray-200 text-lg leading-relaxed">{featuredBond?.bondInfo?.description}</p>
                        </div>
                    </div>
                </div>
                <div className='w-full col-span-2 h-full p-[20px] bg-[#111115]'>
                    <p className='font-[600] text-[25px]'>FEATURED BOND</p>
                    <p className="mt-2 line-clamp-2">{featuredBond?.bondInfo?.description}</p>
                    <div className='mt-[15px]'>
                        <p className='font-[500] text-[20px]'>Discount Rate</p>
                        <p>{(featuredBond.initialDiscountPercentage).toFixed()}% to {(featuredBond.finalDiscountPercentage).toFixed()}%</p>
                    </div>
                    <div className='mt-[15px]'>
                        <p className='font-[500] text-[20px]'>Vesting Duration</p>
                        <p>
                            {featuredBond.linearVestingEndTime && featuredBond.linearVestingEndTime > 0 ? (
                                differenceInDays(new Date(featuredBond.linearVestingEndTime * 1000), new Date(featuredBond.withdrawTime * 1000))
                            ) : (
                                0
                            )} days
                        </p>
                    </div>
                    <div className='mt-[15px]'>
                        <p className='font-[500] text-[20px]'>Start-End Time</p>
                        <p>
                            {format(new Date(featuredBond.saleStartTime * 1000), "dd MMM")} - {format(new Date(featuredBond.saleEndTime * 1000), "dd MMM")}
                        </p>
                    </div>
                    <button
                        className='h-[40px] font-[600] border-primary w-full mt-[20px] border-[2px] hover:bg-primary hover:text-white transition-colors duration-300'
                        onClick={() => navigate(`/deals/bonds/${featuredBond?.bondInfo?.projectName.toLowerCase()}`)}
                    >
                        Bond Page
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FeaturedBonds;