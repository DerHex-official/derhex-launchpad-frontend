import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import Layout from '../../layout'
import Hero from '../../components/Bonds/Hero'
import FeaturedBonds from '../../components/Bonds/Featured'
import LiveAndUpcoming from '../../components/Bonds/LiveAndUpcoming'
import PastBonds from '../../components/Bonds/PastBonds'
import { usePageTitleBonds } from '../../hooks/utils/index.tsx';
import { BondsDataProvider, useBondsData } from '../../context/BondsDataContext'
import { Preloader, ThreeDots } from 'react-preloader-icon'

function BondsContent() {
  const { loading, error } = useBondsData();

  // Show single loading state for all components
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] p-[40px_20px] lg:p-[40px]">
        <Preloader
          use={ThreeDots}
          size={60}
          strokeWidth={6}
          strokeColor="#5325A9"
          duration={2000}
        />
        <p className="text-white mt-4 text-lg">Loading bonds data...</p>
      </div>
    );
  }

  // Show error state if there's an error
  if (error.message) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center min-h-[400px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-red-500 text-xl font-medium">Oops! Something went wrong</h3>
        <p className="text-gray-400 max-w-md">
          We're having trouble loading the bonds. Please try refreshing the page or check back later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // Once loaded, show all components
  return (
    <>
      <FeaturedBonds />
      <LiveAndUpcoming />
      <PastBonds />
    </>
  );
}

function Bonds() {
  usePageTitleBonds("Explore & Invest in Bonds")
  return (
    <Layout>
      {/* Wrap all bond components in a single provider to share data */}
      <BondsDataProvider>
        {/* <Hero/> */}
        <BondsContent />
      </BondsDataProvider>
    </Layout>
  )
}

export default Bonds