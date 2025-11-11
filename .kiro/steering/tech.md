# Tech Stack

## Build System & Tooling

- **Build Tool**: Vite 5.4+ with SWC for fast compilation
- **Package Manager**: pnpm (lockfile present)
- **TypeScript**: v5.6.2 with strict type checking
- **Linting**: ESLint 9 with TypeScript ESLint and React plugins

## Frontend Framework

- **React**: 18.3+ with functional components and hooks
- **Routing**: React Router DOM v6
- **Styling**: TailwindCSS 3.4+ with custom configuration
  - Custom fonts: Space Grotesk (primary), Splash
  - Primary color: #7B4EEE (purple)
- **Animation**: Framer Motion for transitions and animations
- **Icons**: React Icons, Heroicons

## Web3 & Blockchain

- **Authentication**: Privy (@privy-io/react-auth) for wallet connection
- **Blockchain Interaction**: 
  - Wagmi 2.14+ for React hooks
  - Viem 2.22+ for low-level blockchain operations
  - Ethers.js 6.13+ for contract interactions
- **Wallet Support**: RainbowKit, Reown AppKit, WalletConnect
- **Smart Contract ABIs**: Located in `src/abis/` directory
  - Presale, Bond, Airdrop, Staking, Voting contracts

## Data Management

- **State Management**: React Context API (ChainContext, PresalesDataContext, BondsDataContext, GiveawaysDataContext)
- **Server State**: TanStack Query (React Query) v5
- **GraphQL**: Apollo Client 3.13+ for subgraph queries
- **HTTP Client**: Axios 1.8+

## UI Components

- **Headless UI**: @headlessui/react for accessible components
- **Notifications**: react-hot-toast for user feedback
- **Markdown**: react-markdown for content rendering
- **Date Handling**: date-fns 4.1+

## Common Commands

```bash
# Development
pnpm dev              # Start dev server with host access
pnpm build            # TypeScript check + production build
pnpm preview          # Preview production build locally
pnpm lint             # Run ESLint

# The dev server runs with --host flag for network access
```

## Environment Variables

Required in `.env` file:
- `VITE_PROJECT_ID`: WalletConnect/Reown project ID
- `VITE_CLIENT_ID`: Privy client ID

## Deployment

- **Platform**: Netlify (netlify.toml present)
- **Build Command**: `pnpm build`
- **Output Directory**: `dist/`
