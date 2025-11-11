import React from "react";

import { Link, useLocation } from "react-router-dom";
import { IoWalletSharp } from "react-icons/io5";
import { HiMenuAlt3 } from "react-icons/hi";
import { LuPlus } from "react-icons/lu";
import { usePrivy } from "@privy-io/react-auth";
import toast from "react-hot-toast";
import ChainSelector from "../ChainSelector";

function Navbar() {
  const [show, setShow] = React.useState(false);
  const { login, authenticated, logout, user } = usePrivy();
  const location = useLocation();
  // const { connect, isConnecting, error } = useConnect();
  const links = [
    {
      title: "Launchpad",
      link: "/",
    },
    {
      title: "Deals",
      children: [
        {
          title: "IDO",
          link: "/explore/ido",
        },
        {
          title: "Giveaways",
          link: "/deals/giveaways",
        },
        {
          title: "Bonds",
          link: "/deals/bonds",
        },
        {
          title: "OTC Trading",
          link: "https://otc.derhex.com",
          external: true,
        },
      ],
    },
    {
      title: "Staking & Farming",
      link: "/staking-pool",
    },
    {
      title: "Governance",
      link: "/governance",
    },
    {
      title: "Dashboard",
      link: "/dashboard",
    },
    {
      title: "Lock & Stake",
      link: "/lock-stake",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.includes(path);
  };

  function handleWalletConnect() {
    if (authenticated) {
      logout();
      toast("Successfully logged out wallet");
      return;
    }

    login();
  }

  return (
    <div className="flex items-center font-space relative justify-between p-0  xl:p-[20px_40px] text-white">
      <div className="pl-[20px] py-[15px] xl:p-0">
        <Link to="/">
          <img src="/derhex-logo-sm.svg" className="hidden lg:block" alt="" />
          <img src="/der-mob.svg" className="block lg:hidden" alt="" />
        </Link>
      </div>
      <div className="hidden xl:flex items-center text-[#848895] space-x-[20px]">
        {/* {links.map((link, index) => (
          <Link
            to={link.link}
            key={index}
            className={`relative hover:text-white transition-colors duration-200 ${isActive(link.link)
              ? "text-white after:absolute after:left-0 after:bottom-[-2px] after:w-full after:h-[2px] after:bg-primary after:shadow-[0_0_8px_2px_rgba(83,37,169,0.8)]"
              : ""
              }`}
          >
            {link.title}
          </Link>
        ))} */}
        {links.map((link, index) => (
          <div key={index} className="relative group">
            {link.children ? (
              <>
                <button
                  className={`relative hover:text-white transition-colors duration-200 flex items-center space-x-1 ${link.children.some((child) => isActive(child.link)) || location.pathname.includes('/deals')
                    ? "text-white"
                    : ""
                    }`}
                >
                  <span>{link.title}</span>
                  <svg
                    className="w-4 h-4 mt-0.5 transition-transform duration-200 group-hover:rotate-180"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-[280px] bg-[#0D0D0D] rounded-xl shadow-xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-10 transform translate-y-1 group-hover:translate-y-0 border border-gray-800/50">
                  {link.children.map((child, i) => {
                    return child.external ? (
                      <a
                        key={i}
                        href={child.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 hover:bg-white/5 transition-colors"
                      >
                        {child.title === "Giveaways" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16q-.825 0-1.412-.587T10 14t.588-1.412T12 12t1.413.588T14 14t-.587 1.413T12 16M7.375 7h9.25L17.9 4.45q.25-.5-.038-.975T17 3H7q-.575 0-.862.475T6.1 4.45zM8.4 21h7.2q2.25 0 3.825-1.562T21 15.6q0-.95-.325-1.85t-.925-1.625L17.15 9H6.85l-2.6 3.125q-.6.725-.925 1.625T3 15.6q0 2.275 1.563 3.838T8.4 21" /></svg>
                        )}
                        {child.title === "Bonds" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M15 16h3q.425 0 .713-.288T19 15V9q0-.425-.288-.712T18 8h-3q-.425 0-.712.288T14 9v6q0 .425.288.713T15 16m1-2v-4h1v4zm-7 2h3q.425 0 .713-.288T13 15V9q0-.425-.288-.712T12 8H9q-.425 0-.712.288T8 9v6q0 .425.288.713T9 16m1-2v-4h1v4zm-5 2h2V8H5zm-3 4V4h20v16z" /></svg>
                        )}
                        {child.title === "IDO" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="m2.45 10.575l4.2-4.2q.35-.35.825-.5t.975-.05l1.3.275Q8.4 7.7 7.625 9t-1.5 3.15zm5.125 2.275q.575-1.8 1.563-3.4t2.387-3q2.2-2.2 5.025-3.287t5.275-.663q.425 2.45-.65 5.275T17.9 12.8q-1.375 1.375-3 2.388t-3.425 1.587zm6.9-3q.575.575 1.413.575T17.3 9.85t.575-1.412t-.575-1.413t-1.412-.575t-1.413.575t-.575 1.413t.575 1.412m-.7 12.025l-1.6-3.675q1.85-.725 3.163-1.5t2.912-2.125l.25 1.3q.1.5-.05.988t-.5.837zM4.05 16.05q.875-.875 2.125-.888t2.125.863t.875 2.125t-.875 2.125q-.625.625-2.087 1.075t-4.038.8q.35-2.575.8-4.025T4.05 16.05" /></svg>
                        )}
                        {child.title === "OTC Trading" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M6 20q-.825 0-1.412-.587T4 18v-2h2v2h12v-2h2v2q0 .825-.587 1.413T18 20zm5-4V7.825L9.4 9.4L8 8l4-4l4 4l-1.4 1.4l-1.6-1.575V16z"/></svg>
                        )}
                        <div>
                          <p className="font-medium text-white flex items-center gap-1">
                            {child.title}
                            {child.external && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" className="opacity-60">
                                <path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h14v-7h2v7q0 .825-.587 1.413T19 21zm4.7-5.3l-1.4-1.4L17.6 5H14V3h7v7h-2V6.4z"/>
                              </svg>
                            )}
                          </p>
                          <p className="text-sm text-gray-400">
                            {child.title === "Giveaways"
                              ? "Join campaigns and earn free tokens"
                              : child.title === "IDO"
                              ? "Participate in token launches with exclusive early access"
                              : child.title === "Bonds"
                              ? "Get exchange-listed tokens at a discount"
                              : "Trade large volumes with minimal slippage"}
                          </p>
                        </div>
                      </a>
                    ) : (
                      <Link
                        key={i}
                        to={child.link}
                        className="flex items-center space-x-3 p-4 hover:bg-white/5 transition-colors"
                      >
                        {child.title === "Giveaways" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16q-.825 0-1.412-.587T10 14t.588-1.412T12 12t1.413.588T14 14t-.587 1.413T12 16M7.375 7h9.25L17.9 4.45q.25-.5-.038-.975T17 3H7q-.575 0-.862.475T6.1 4.45zM8.4 21h7.2q2.25 0 3.825-1.562T21 15.6q0-.95-.325-1.85t-.925-1.625L17.15 9H6.85l-2.6 3.125q-.6.725-.925 1.625T3 15.6q0 2.275 1.563 3.838T8.4 21" /></svg>
                        )}
                        {child.title === "Bonds" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M15 16h3q.425 0 .713-.288T19 15V9q0-.425-.288-.712T18 8h-3q-.425 0-.712.288T14 9v6q0 .425.288.713T15 16m1-2v-4h1v4zm-7 2h3q.425 0 .713-.288T13 15V9q0-.425-.288-.712T12 8H9q-.425 0-.712.288T8 9v6q0 .425.288.713T9 16m1-2v-4h1v4zm-5 2h2V8H5zm-3 4V4h20v16z" /></svg>
                        )}
                        {child.title === "IDO" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="m2.45 10.575l4.2-4.2q.35-.35.825-.5t.975-.05l1.3.275Q8.4 7.7 7.625 9t-1.5 3.15zm5.125 2.275q.575-1.8 1.563-3.4t2.387-3q2.2-2.2 5.025-3.287t5.275-.663q.425 2.45-.65 5.275T17.9 12.8q-1.375 1.375-3 2.388t-3.425 1.587zm6.9-3q.575.575 1.413.575T17.3 9.85t.575-1.412t-.575-1.413t-1.412-.575t-1.413.575t-.575 1.413t.575 1.412m-.7 12.025l-1.6-3.675q1.85-.725 3.163-1.5t2.912-2.125l.25 1.3q.1.5-.05.988t-.5.837zM4.05 16.05q.875-.875 2.125-.888t2.125.863t.875 2.125t-.875 2.125q-.625.625-2.087 1.075t-4.038.8q.35-2.575.8-4.025T4.05 16.05" /></svg>
                        )}
                        {child.title === "OTC Trading" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M6 20q-.825 0-1.412-.587T4 18v-2h2v2h12v-2h2v2q0 .825-.587 1.413T18 20zm5-4V7.825L9.4 9.4L8 8l4-4l4 4l-1.4 1.4l-1.6-1.575V16z"/></svg>
                        )}
                        <div>
                          <p className="font-medium text-white flex items-center gap-1">
                            {child.title}
                            {child.external && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" className="opacity-60">
                                <path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h14v-7h2v7q0 .825-.587 1.413T19 21zm4.7-5.3l-1.4-1.4L17.6 5H14V3h7v7h-2V6.4z"/>
                              </svg>
                            )}
                          </p>
                          <p className="text-sm text-gray-400">
                            {child.title === "Giveaways"
                              ? "Join campaigns and earn free tokens"
                              : child.title === "IDO"
                              ? "Participate in token launches with exclusive early access"
                              : child.title === "Bonds"
                              ? "Get exchange-listed tokens at a discount"
                              : "Trade large volumes with minimal slippage"}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <Link
                to={link.link}
                className={`relative hover:text-white transition-colors duration-200 ${isActive(link.link)
                  ? "text-white after:absolute after:left-0 after:bottom-[-2px] after:w-full after:h-[2px] after:bg-primary after:shadow-[0_0_8px_2px_rgba(83,37,169,0.8)]"
                  : ""
                  }`}
              >
                {link.title}
              </Link>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-[10px] lg:space-x-[20px] pr-[20px] py-[15px] lg:p-0">
        {/* Chain Selector */}
        <div className="hidden xl:block">
          <ChainSelector />
        </div>

        <button
          className="relative px-6 py-2 font-[500] text-white flex items-center space-x-[5px] overflow-hidden group"
          onClick={handleWalletConnect}
        >
          <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
          <span className="absolute inset-[2px] bg-black transition-all duration-300 clip-path-polygon"></span>
          <span className="relative flex items-center space-x-[5px]">
            <IoWalletSharp className="text-[12px] lg:text-[16px]" />
            {authenticated ? (
              <span className="truncate max-w-[100px]">
                {user?.wallet?.address}
              </span>
            ) : (
              <p className="text-[12px] lg:text-[16px]">Connect Wallet</p>
            )}
          </span>
        </button>

        <button onClick={() => setShow(!show)} className="xl:hidden">
          <HiMenuAlt3 className="text-[30px]" />
        </button>
      </div>
      <div
        className={`${show ? "left-0" : "left-[-100%]"
          } fixed top-0 min-h-screen h-screen z-30 bg-black text-primary w-full p-[20px] transition-all duration-300`}
      >
        <div className="flex items-center justify-end">
          <button
            className="h-[40px] w-[40px] flex items-center justify-center"
            onClick={() => setShow(!show)}
          >
            <LuPlus className="text-[30px] rotate-45" />
          </button>
        </div>
        <div className="flex flex-col mt-[20px] items-start space-y-[20px] text-[#848895] ">
          {/* Chain Selector for Mobile */}
          <div className="w-full mb-4">
            <p className="text-[20px] font-[600] text-white mb-3">Select Chain</p>
            <ChainSelector />
          </div>

          {links.map((link, index) => (
            <div key={index} className="w-full">
              {link.children ? (
                <div className="flex flex-col space-y-[10px]">
                  <p className="text-[20px] font-[600] text-white">
                    {link.title}
                  </p>
                  {link.children.map((child, i) => {
                    if (child.external) {
                      return (
                        <a
                          href={child.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShow(false)}
                          className="ml-4 text-[18px] font-[500] text-primary flex items-center gap-1"
                          key={i}
                        >
                          {child.title}
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" className="opacity-60">
                            <path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h14v-7h2v7q0 .825-.587 1.413T19 21zm4.7-5.3l-1.4-1.4L17.6 5H14V3h7v7h-2V6.4z"/>
                          </svg>
                        </a>
                      );
                    }
                    return (
                      <Link
                        onClick={() => setShow(false)}
                        className={`ml-4 text-[18px] font-[500] ${isActive(child.link) ? "text-white" : "text-primary"
                          }`}
                        to={child.link}
                        key={i}
                      >
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Link
                  onClick={() => setShow(false)}
                  className={`text-[20px] font-[500] ${isActive(link.link) ? "text-white" : "text-primary"
                    }`}
                  to={link.link}
                >
                  {link.title}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
