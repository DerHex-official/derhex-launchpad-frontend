import { FaArrowCircleRight } from "react-icons/fa";
import { motion } from "framer-motion";

function OTCCTA() {
  // Generate random price data for chart
  const pricePoints = Array.from({ length: 20 }, (_, i) => ({
    x: i * 20,
    y: 150 + Math.sin(i * 0.5) * 40 + Math.random() * 20,
  }));

  return (
    <div className="p-[40px_20px] lg:p-[40px] font-space">
      <div className="w-full lg:w-[95%] mx-auto rounded-[10px] grid lg:grid-cols-2 gap-[40px] items-center">
        <div className="space-y-[20px]">
          <p className="text-[28px] lg:text-[48px] font-[700] text-white leading-[35px] lg:leading-[55px]">
            Trade <span className="text-primary">Over-The-Counter</span> with DerHex
          </p>
          <p className="text-[16px] lg:text-[18px] text-[#CDCDCD]">
            Access our secure OTC trading desk for large-volume transactions with minimal slippage.
            Perfect for institutional investors and high-net-worth individuals seeking privacy,
            competitive pricing, and personalized service for their crypto trades.
          </p>
          <a
            href="https://otc.derhex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="relative px-6 py-2 font-[500] text-[16px] lg:text-[18px] text-white flex items-center space-x-[5px] overflow-hidden group w-fit"
          >
            <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
            <span className="absolute inset-[2px] bg-black transition-all duration-300 clip-path-polygon"></span>
            <span className="relative flex items-center space-x-[5px]">
              <span>Start OTC Trading</span>
              <FaArrowCircleRight className="text-white ml-2" />
            </span>
          </a>
        </div>
        
        {/* Trading Visualization */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[400px] h-[300px] bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] rounded-2xl border border-primary/20 overflow-hidden p-6">
            
            {/* Animated Price Chart */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none">
                <motion.path
                  d={`M ${pricePoints.map((p, i) => `${p.x},${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Order Book Visualization - Left Side */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 space-y-2">
              {[85, 70, 55, 40, 30].map((width, i) => (
                <motion.div
                  key={`buy-${i}`}
                  className="h-1.5 bg-green-500/30 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${width}px` }}
                  transition={{
                    duration: 1,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 2,
                  }}
                />
              ))}
            </div>

            {/* Order Book Visualization - Right Side */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 space-y-2">
              {[75, 60, 50, 35, 25].map((width, i) => (
                <motion.div
                  key={`sell-${i}`}
                  className="h-1.5 bg-red-500/30 rounded-full ml-auto"
                  initial={{ width: 0 }}
                  animate={{ width: `${width}px` }}
                  transition={{
                    duration: 1,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 2,
                  }}
                />
              ))}
            </div>

            {/* Center Trading Indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <motion.div
                className="relative"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Glowing center circle */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                  <div className="text-center">
                    <div className="text-white text-xs font-bold">OTC</div>
                    <motion.div
                      className="text-green-400 text-lg font-bold"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      ↔
                    </motion.div>
                  </div>
                </div>

                {/* Rotating ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    width: "90px",
                    height: "90px",
                    left: "-5px",
                    top: "-5px",
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
                </motion.div>
              </motion.div>
            </div>

            {/* Liquidity Flow Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 rounded-full bg-primary"
                initial={{
                  x: i % 2 === 0 ? 50 : 350,
                  y: 150,
                  opacity: 0,
                }}
                animate={{
                  x: i % 2 === 0 ? 200 : 200,
                  y: 150,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Price Tickers */}
            <div className="absolute top-4 left-4 space-y-1">
              <motion.div
                className="text-green-400 text-xs font-mono"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                BUY
              </motion.div>
              <motion.div
                className="text-white text-sm font-mono font-bold"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                $42,350
              </motion.div>
            </div>

            <div className="absolute top-4 right-4 space-y-1 text-right">
              <motion.div
                className="text-red-400 text-xs font-mono"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              >
                SELL
              </motion.div>
              <motion.div
                className="text-white text-sm font-mono font-bold"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                $42,355
              </motion.div>
            </div>

            {/* Volume Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
              <div className="text-gray-400 text-xs">24h Volume</div>
              <motion.div
                className="text-primary text-sm font-bold"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                $2.4M
              </motion.div>
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/30 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/30 rounded-br-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OTCCTA;
