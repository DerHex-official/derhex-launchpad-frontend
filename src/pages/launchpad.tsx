// import React from 'react'
import Subscribe from '../components/Global/Subscribe'
import Access from '../components/Launchpad/Access'
import Funded from '../components/Launchpad/Funded'
import HowTo from '../components/Launchpad/HowTo'
import LaunchHero from '../components/Launchpad/LaunchHero'
import Multichain from '../components/Launchpad/Multichain'
import Secure from '../components/Launchpad/Secure'
import StakingBadge from '../components/Launchpad/StakingBadge'
import Trusted from '../components/Launchpad/Trusted'
// import UpcomingIdo from '../components/Launchpad/UpcomingIdo'
import FeaturedIdo from '../components/Home/FeaturedIdo'
import Layout from '../layout'
import CompletedIDO from '../components/Home/CompletedIDO'
import FAQ from '../components/Home/FAQ'
import { usePageTitle } from '../hooks/utils'
import { PresalesDataProvider, usePresalesData } from '../context/PresalesDataContext'
import { Preloader, ThreeDots } from 'react-preloader-icon'

function PresalesContent() {
  const { loading, error } = usePresalesData();

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
        <p className="text-white mt-4 text-lg">Loading presales data...</p>
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
          We're having trouble loading the presales. Please try refreshing the page or check back later.
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
      <FeaturedIdo />
      <CompletedIDO />
    </>
  );
}

function Launchpad() {
  usePageTitle("Discover and Invest in Early-Stage Blockchain Projects")
  return (
    <Layout>
      <LaunchHero />
      <HowTo />
      <StakingBadge />
      {/* <Trusted /> */}
      <Secure />
      {/* <Funded/> */}
      {/* Wrap presale components in provider to share data */}
      <PresalesDataProvider>
        <PresalesContent />
      </PresalesDataProvider>
      <Access />
      {/* <Multichain/> */}
      <FAQ />
      <Subscribe />
    </Layout>
  )
}

export default Launchpad