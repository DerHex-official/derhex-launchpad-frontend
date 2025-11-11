import { Link, useNavigate } from 'react-router-dom';
import Layout from '../layout';
import { usePageTitle } from '../hooks/utils';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaHome, FaSearch } from 'react-icons/fa';

function NotFound() {
  usePageTitle('Page Not Found | DerHex');
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100 }
    }
  };

  const glowVariants = {
    initial: { scale: 0.8, opacity: 0.5 },
    animate: {
      scale: 1.2,
      opacity: [0.2, 0.4, 0.2],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  return (
    <Layout>
      <motion.div
        className="min-h-[80vh] flex flex-col items-center justify-center p-[20px] text-center relative overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary rounded-full -z-10"
            variants={glowVariants}
            initial="initial"
            animate="animate"
          />
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm -z-5"></div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-8 max-w-3xl z-10">
          {/* 404 Number with Gradient */}
          <motion.div className="relative" variants={itemVariants}>
            <motion.h1
              className="text-[120px] md:text-[180px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
            >
              404
            </motion.h1>
            <motion.div
              className="absolute inset-0 blur-3xl opacity-20 bg-primary rounded-full -z-10"
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          </motion.div>

          {/* Error Message */}
          <motion.h2
            className="text-[28px] md:text-[42px] text-white font-[600] leading-tight"
            variants={itemVariants}
          >
            Page Not Found
          </motion.h2>

          <motion.p
            className="text-gray-400 max-w-md text-[16px] md:text-[18px]"
            variants={itemVariants}
          >
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </motion.p>

          {/* Search suggestion */}
          <motion.div
            className="w-full max-w-md relative mt-4"
            variants={itemVariants}
          >
            <div className="relative overflow-hidden group">
              <span className="absolute inset-0 w-full h-full bg-primary/30 clip-path-polygon"></span>
              <span className="absolute inset-[2px] bg-[#17043B] transition-all duration-300 clip-path-polygon"></span>
              <div className="relative flex items-center p-2">
                <FaSearch className="text-gray-400 ml-2" />
                <input
                  type="text"
                  placeholder="Try searching for something else..."
                  className="w-full bg-transparent border-none outline-none text-white p-2 placeholder-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}
                />
              </div>
            </div>
          </motion.div>

          {/* Navigation Options */}
          <motion.div
            className="flex flex-col md:flex-row gap-4 mt-6 w-full max-w-md"
            variants={itemVariants}
          >
            {/* Go Back Button */}
            <motion.button
              onClick={() => navigate(-1)}
              className="relative px-6 py-3 text-white font-[500] flex items-center justify-center overflow-hidden group w-full md:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="absolute inset-0 w-full h-full bg-[#291254] clip-path-polygon"></span>
              <span className="absolute inset-[2px] bg-[#12092B] transition-all duration-300 clip-path-polygon"></span>
              <span className="relative flex items-center space-x-2">
                <FaArrowLeft className="text-sm" />
                <span>Go Back</span>
              </span>
            </motion.button>

            {/* Home Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full md:w-auto"
            >
              <Link
                to="/"
                className="relative px-6 py-3 text-white font-[500] flex items-center justify-center overflow-hidden group w-full"
              >
                <span className="absolute inset-0 w-full h-full bg-primary clip-path-polygon"></span>
                <span className="absolute inset-[2px] bg-[#000027] transition-all duration-300 clip-path-polygon"></span>
                <span className="relative flex items-center space-x-2">
                  <FaHome className="text-sm" />
                  <span>Back to Home</span>
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className="mt-8 pt-8 border-t border-gray-800 w-full max-w-md"
            variants={itemVariants}
          >
            <motion.h3
              className="text-white text-lg mb-4"
              variants={itemVariants}
            >
              Popular Destinations
            </motion.h3>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
              variants={itemVariants}
            >
              {[
                { path: "/launchpad", name: "Launchpad" },
                { path: "/staking-pool", name: "Staking" },
                { path: "/giveaways", name: "Giveaways" },
                { path: "/explore", name: "Explore" },
                { path: "/dashboard", name: "Dashboard" },
                { path: "/governance", name: "Governance" }
              ].map((link, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={link.path}
                    className="text-primary hover:text-purple-400 transition-colors block py-2 px-3 rounded-md hover:bg-white/5"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}

export default NotFound;
