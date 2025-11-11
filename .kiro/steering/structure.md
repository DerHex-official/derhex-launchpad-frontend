# Project Structure

## Directory Organization

```
src/
├── components/       # Reusable UI components organized by feature
├── pages/           # Route-level page components
├── context/         # React Context providers for global state
├── hooks/           # Custom React hooks
├── config/          # Configuration files (chains, wagmi, privy)
├── utils/           # Utility functions and helpers
├── graphql/         # GraphQL client and queries
├── abis/            # Smart contract ABIs (JSON + TypeScript)
├── services/        # External service integrations
├── layout/          # Layout wrapper components
├── assets/          # Static assets (images, SVGs)
├── App.tsx          # Main app component with routing
├── main.tsx         # Application entry point
└── index.css        # Global styles and Tailwind imports
```

## Component Organization

Components are organized by feature domain:

- `components/Bonds/` - Bond-related UI components
- `components/Giveaways/` - Giveaway/airdrop components
- `components/Presale/` - IDO/presale components
- `components/Staking/` - Staking pool components
- `components/Governance/` - Voting and governance UI
- `components/Global/` - Shared components (Navbar, Footer, Cards, Modals)
- `components/Modal/` - Reusable modal components
- `components/Form/` - Form input components
- `components/Dashboard/` - User dashboard components

## Routing Structure

Routes follow a hierarchical pattern:

```
/                           # Home page
/launchpad                  # Launchpad overview
/deals/launchpad/:id        # Individual IDO details
/deals/bonds                # Bonds listing
/deals/bonds/:id            # Bond details
/deals/giveaways            # Giveaways listing
/deals/giveaways/:id        # Giveaway details
/staking-pool               # Staking pools
/staking-pool/:id           # Individual pool
/governance                 # Governance/voting
/dashboard                  # User dashboard
/admin/dashboard            # Admin panel
/admin/dashboard/presales   # Admin presale management
/admin/dashboard/bonds      # Admin bond management
/admin/dashboard/giveaways  # Admin giveaway management
```

## Context Providers

Global state managed through React Context:

- `ChainContext` - Selected blockchain network and public client
- `PresalesDataContext` - Presale/IDO data across the app
- `BondsDataContext` - Bond data and state
- `GiveawaysDataContext` - Giveaway/airdrop data

## Custom Hooks

### Web3 Hooks (`hooks/web3/`)
- `usePresale` - Fetch and manage presale data
- `useBond` - Bond contract interactions
- `useBondUser` - User-specific bond data
- `useGiveaway` - Giveaway contract interactions
- `useVoting` - Voting/governance functionality
- `useLockStake` - Lock staking operations
- `useGetPriceCoinGecko` - Token price fetching

### Utility Hooks (`hooks/`)
- `useChainSync` - Sync global chain ID with context
- `useNetworkCheck` - Network validation and switching

## Web3 Utilities (`utils/web3/`)

- `presale.ts` - Presale contract read/write functions
- `bond.ts` - Bond contract interactions
- `giveaway.ts` - Giveaway contract operations
- `voting.ts` - Voting contract functions
- `stakeLock.ts` - Lock staking utilities
- `actions.ts` - Common contract actions
- `client.ts` - Web3 client configuration

## Configuration Files

- `config/index.ts` - Wagmi and Privy configuration
- `config/chain/index.ts` - Chain definitions (Base Sepolia, Sonic, Rise)
- `config/publicClient.ts` - Viem public client setup
- `utils/CA.ts` - Contract addresses by chain

## Naming Conventions

- **Components**: PascalCase (e.g., `BondCard.tsx`, `StakeHero.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `usePresale`, `useChainSync`)
- **Utils**: camelCase (e.g., `timeFormatter.ts`, `tools.ts`)
- **Context**: PascalCase with `Context` suffix (e.g., `ChainContext`)
- **Types**: PascalCase interfaces/types

## File Patterns

- Index files (`index.ts`, `index.tsx`) for cleaner imports
- Co-located components in feature folders
- Separate files for complex components
- ABIs stored as JSON with optional TypeScript wrappers
