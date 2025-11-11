import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBondsData } from "../../context/BondsDataContext";
import { isBefore } from "date-fns";
import { format } from "date-fns";
import CurrentChain from "../Presale/CurrentChain";

function PastBonds() {
  const { data } = useBondsData();
  const [filteredBonds, setFilteredBonds] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (data && Array.isArray(data)) {
        const currentTime = Date.now();
        // Add validation to ensure we only process valid bond objects
        const filtered = data.filter((bond: any) => {
          // Check if bond is a valid object with required properties
          if (!bond || typeof bond !== 'object' || bond.saleEndTime === undefined) {
            return false;
          }

          try {
            const endTime = Number(bond.saleEndTime) * 1000;
            return !isBefore(currentTime, endTime);
          } catch (err) {
            console.error('Error processing bond end time:', err);
            return false;
          }
        });
        setFilteredBonds(filtered);
      } else {
        // If data is not an array, set filtered bonds to empty array
        setFilteredBonds([]);
      }
    } catch (error) {
      console.error('Error filtering bonds:', error);
      setFilteredBonds([]);
    }
  }, [data]);

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBonds.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBonds.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const PaginationButton = ({ page, isActive }: { page: number, isActive: boolean }) => (
    <button
      onClick={() => paginate(page)}
      className={`px-3 py-1 mx-1 rounded ${isActive
        ? 'bg-primary text-white'
        : 'bg-[#1A1A1A] text-gray-400 hover:bg-primary/20'
        }`}
    >
      {page}
    </button>
  );

  const Pagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        i === currentPage ||
        i === currentPage - 1 ||
        i === currentPage + 1
      ) {
        pages.push(
          <PaginationButton
            key={i}
            page={i}
            isActive={currentPage === i}
          />
        );
      } else if (
        i === currentPage - 2 ||
        i === currentPage + 2
      ) {
        pages.push(
          <span key={i} className="px-2 text-gray-400">...</span>
        );
      }
    }
    return (
      <div className="flex items-center justify-center mt-6 space-x-2">
        <button
          onClick={() => paginate(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-4 py-1 text-gray-400 bg-[#1A1A1A] rounded hover:bg-primary/20 disabled:opacity-50 disabled:hover:bg-[#1A1A1A]"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-1 text-gray-400 bg-[#1A1A1A] rounded hover:bg-primary/20 disabled:opacity-50 disabled:hover:bg-[#1A1A1A]"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="font-space flex flex-col p-[40px_20px] lg:p-[40px]">
      <div className="flex flex-col items-start text-white mb-8">
        <h1 className="text-[32px] lg:text-[56px] font-[700] leading-[36px] lg:leading-[60px]">
          Past Bonds
        </h1>
      </div>

      <div className="w-full bg-[#0D0D0D] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-800">
                <th className="p-4 text-gray-400 font-normal">Project</th>
                <th className="p-4 text-gray-400 font-normal">Raised</th>
                <th className="p-4 text-gray-400 font-normal">Discount</th>
                <th className="p-4 text-gray-400 font-normal">Ended</th>
                <th className="p-4 text-gray-400 font-normal">Chain</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((bond: any, index: number) => {
                  // Safely navigate properties with optional chaining and fallbacks
                  const projectName = bond?.bondInfo?.projectName || 'Unknown Project';
                  const projectUrl = bond?.bondInfo?.projectName?.toLowerCase() || 'unknown';
                  const tokenSymbol = bond?.saleToken?.symbol || 'N/A';
                  const logoUrl = bond?.bondInfo?.images?.logo || '';

                  // Safely format numbers with fallbacks
                  let totalSoldFormatted = 'N/A';
                  if (bond?.totalSold !== undefined) {
                    try {
                      totalSoldFormatted = `${parseFloat(bond.totalSold).toLocaleString()} ${tokenSymbol}`;
                    } catch (err) {
                      console.error('Error formatting totalSold:', err);
                    }
                  }

                  // Safely format discount percentages
                  let discountFormatted = 'N/A';
                  if (bond?.initialDiscountPercentage !== undefined && bond?.finalDiscountPercentage !== undefined) {
                    try {
                      discountFormatted = `${(bond.initialDiscountPercentage).toFixed()}% to ${(bond.finalDiscountPercentage).toFixed()}%`;
                    } catch (err) {
                      console.error('Error formatting discount percentages:', err);
                    }
                  }

                  // Safely format end date
                  let endDateFormatted = 'N/A';
                  if (bond?.saleEndTime) {
                    try {
                      endDateFormatted = format(new Date(bond.saleEndTime * 1000), "dd MMM, HH:mm");
                    } catch (err) {
                      console.error('Error formatting end date:', err);
                    }
                  }

                  return (
                    <tr
                      key={index}
                      onClick={() => navigate(`/deals/bonds/${projectUrl}`)}
                      className="border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={projectName}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                // Fallback for broken images
                                (e.target as HTMLImageElement).src = 'https://placehold.co/32x32?text=?';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white">?</div>
                          )}
                          <div>
                            <p className="font-medium text-[#FAFAFA]">
                              {projectName}
                            </p>
                            <p className="text-sm text-[#ACBBCC]">
                              {tokenSymbol}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[#FAFAFA]">
                        {totalSoldFormatted}
                      </td>
                      <td className="p-4 text-[#ACBBCC]">
                        {discountFormatted}
                      </td>
                      <td className="p-4 text-[#FAFAFA]">
                        {endDateFormatted}
                      </td>
                      <td className="p-4">
                        <CurrentChain chainId={bond?.chainId || "11155931"} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-[#ACBBCC]">
                    No completed bonds at the moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredBonds.length > itemsPerPage && <Pagination />}
    </div>
  );
}

export default PastBonds;
