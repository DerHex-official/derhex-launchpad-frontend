// import React from 'react'

import Community from "../components/Global/Community"
import Subscribe from "../components/Global/Subscribe"
import FeaturedIdo from "../components/Home/FeaturedIdo"
import Guaranteed from "../components/Home/Guaranteed"
import HomeHero from "../components/Home/HomeHero"
import Unlock from "../components/Home/Unlock"
import Layout from "../layout"
import Trusted from "../components/Launchpad/Trusted"
import HowTo from "../components/Launchpad/HowTo"
import CompletedIDO from "../components/Home/CompletedIDO"
import { usePageTitle } from "../hooks/utils"
import StakingCTA from "../components/Home/StakingCTA"
import BondsCTA from "../components/Home/BondsCTA"
import OTCCTA from "../components/Home/OTCCTA"
import FAQ from "../components/Home/FAQ"
import Access from "../components/Launchpad/Access"
import StakingBadge from "../components/Launchpad/StakingBadge"
import SupportedBy from "../components/Home/SupportedBy"
// import CompletedGiveaways from "../components/Giveaways/CompletedGiveaway"
import LaunchProject from "../components/Launchpad/LaunchProject"
import UpComingGiveaways from "../components/Giveaways/UpComingGiveaway"
import { Link } from "react-router-dom"
import { PresalesDataProvider } from "../context/PresalesDataContext"
import { GiveawaysDataProvider } from "../context/GiveawaysDataContext"

function Home() {
  usePageTitle("Discover and Invest in Early-Stage Blockchain Projects")
  return (
    <Layout>
      <HomeHero />
      <Trusted />
      <SupportedBy />
      {/* <Unlock /> */}
      <HowTo />
      <StakingBadge />
      <OTCCTA />
      {/* Wrap presale components in provider */}
      <PresalesDataProvider>
        <FeaturedIdo />
        <CompletedIDO />
      </PresalesDataProvider>
      <BondsCTA />
      <Guaranteed />
      {/* Wrap giveaway components in provider */}
      <GiveawaysDataProvider>
        <UpComingGiveaways />
      </GiveawaysDataProvider>
      <div className="flex items-center justify-center w-full">
        <Link
          to="/deals/giveaways"
          className="relative text-[#FAFAFA] mt-[50px] p-[8px_20px] w-fit mx-auto overflow-hidden group-button"
        >
          <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
          <span className="absolute inset-[2px] bg-black transition-all duration-300 clip-path-polygon"></span>
          <span className="relative">View All Giveaways</span>
        </Link>
      </div>
      <StakingCTA />
      <LaunchProject />
      {/* <Community /> */}
      <Access />
      <FAQ />
      <Subscribe />
    </Layout>
  )
}

export default Home
