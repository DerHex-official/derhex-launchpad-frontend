/* eslint-disable @typescript-eslint/no-explicit-any */
// import React from 'react'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GiveawayCardCompleted from "./StatusCard";
import { useGiveawaysData } from "../../context/GiveawaysDataContext";
import { isBefore } from "date-fns";
import CurrentChain from "../Presale/CurrentChain";
import { useChain } from "../../context/ChainContext";

function CompletedGiveaways() {
    const { data } = useGiveawaysData();
    const [filteredGiveaways, setFilteredGiveaways] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const navigate = useNavigate();
    const { selectedChain } = useChain();

    useEffect(() => {
        if (data) {
            const currentTime = Date.now();
            const filtered = data.filter((giveaway: any) => {
                const endTime = Number(giveaway.whitelistEndTime) * 1000;
                return !isBefore(currentTime, endTime);
            }).filter((giveaway: any) =>
                giveaway.giveawayInfo?.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                giveaway.airdropToken?.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredGiveaways(filtered);
            setCurrentPage(1); // Reset to first page when search changes
        }
    }, [data, searchTerm]);

    // Get current items
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredGiveaways.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredGiveaways.length / itemsPerPage);

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
            // Show first page, last page, current page, and one page before and after current
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
                    Past Deals
                </h1>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search Project"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-[300px] px-4 py-2 bg-[#1A1A1A] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                    />
                    <svg
                        className="absolute right-3 top-2.5 text-gray-400"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
            </div>

            <div className="w-full bg-[#0D0D0D] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-gray-800">
                                <th className="p-4 text-gray-400 font-normal">Project</th>
                                <th className="p-4 text-gray-400 font-normal">Total Reward</th>
                                <th className="p-4 text-gray-400 font-normal">Vesting Duration</th>
                                <th className="p-4 text-gray-400 font-normal">Ended</th>
                                <th className="p-4 text-gray-400 font-normal">Chain</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((giveaway: any, index: number) => (
                                    <tr
                                        key={index}
                                        onClick={() => navigate(`/deals/giveaways/${giveaway?.giveawayInfo?.projectName.toLowerCase()}`)}
                                        className="border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={giveaway.giveawayInfo?.images?.logo}
                                                    alt={giveaway.giveawayInfo?.projectName}
                                                    className="w-8 h-8 rounded-full"
                                                />
                                                <div>
                                                    <p className="font-medium text-[#FAFAFA]">
                                                        {giveaway.giveawayInfo?.projectName}
                                                    </p>
                                                    <p className="text-sm text-[#ACBBCC]">
                                                        {giveaway.airdropToken?.symbol}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-[#FAFAFA]">
                                            {giveaway.giveawayInfo?.totalReward.toLocaleString()} {giveaway.airdropToken?.symbol}
                                        </td>
                                        <td className="p-4 text-[#ACBBCC]">
                                            {giveaway.linearVestingEndTime && giveaway.linearVestingEndTime > 0
                                                ? `${Math.floor((giveaway.linearVestingEndTime - giveaway.startTime) / 86400)} days`
                                                : "No vesting"
                                            }
                                        </td>
                                        <td className="p-4 text-[#FAFAFA]">
                                            {new Date(giveaway.whitelistEndTime * 1000).toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-4">
                                            <CurrentChain chainId={giveaway.chainId || selectedChain} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-[#ACBBCC]">
                                        No completed giveaways at the moment
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredGiveaways.length > itemsPerPage && <Pagination />}
        </div>
    );
}

export default CompletedGiveaways;
