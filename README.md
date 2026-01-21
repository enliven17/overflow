# Overflow - BTC Price Prediction Game

Overflow is a decentralized real-time BTC price prediction game built on Flow Blockchain where users bet FLOW tokens on Bitcoin price movements.

## Features

- 🎮 Real-time BTC price prediction game
- 💰 Bet FLOW tokens on price movements
- 📊 Live price chart visualization
- 🎯 Multiple betting targets with different multipliers
- ⚡ 30-second rounds with instant payouts
- 🔒 Secure smart contract-based escrow
- 🌐 Oracle-powered price feeds
- 🎨 Cyberpunk-themed UI

## Architecture

The system consists of three main layers:

1. **Smart Contract Layer (Cadence)**: Manages deposits, escrow, oracle integration, and payouts
2. **Frontend Layer (Next.js)**: Provides the user interface with live chart and betting interface
3. **Oracle Layer**: Supplies tamper-proof BTC price feeds

## Prerequisites

- Node.js 18+ and npm
- Flow CLI ([installation guide](https://developers.flow.com/tools/flow-cli/install))
- A Flow wallet (Blocto, Lilico, etc.) for testing

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your network settings.

### 3. Start Flow Emulator

In a separate terminal, start the Flow emulator:

```bash
# Using the provided script
chmod +x scripts/start-emulator.sh
./scripts/start-emulator.sh

# Or directly
flow emulator start --dev-wallet
```

The emulator will start on `http://localhost:8888` and the dev wallet on `http://localhost:8701`.

### 4. Deploy Smart Contracts

Once the emulator is running, deploy the contracts:

```bash
# Using the provided script
chmod +x scripts/deploy-emulator.sh
./scripts/deploy-emulator.sh

# Or using Flow CLI directly
flow project deploy --network=emulator
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
overflow/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main game page
│   └── globals.css        # Global styles
├── cadence/               # Cadence smart contracts
│   ├── contracts/         # Contract source files
│   ├── scripts/           # Query scripts
│   ├── transactions/      # Transaction templates
│   └── tests/             # Contract tests
├── components/            # React components
│   ├── game/             # Game-related components
│   ├── wallet/           # Wallet components
│   ├── history/          # Bet history components
│   └── ui/               # Reusable UI components
├── lib/                   # Library code
│   ├── flow/             # Flow blockchain integration
│   ├── store/            # State management (Zustand)
│   └── utils/            # Utility functions
├── types/                 # TypeScript type definitions
├── scripts/               # Deployment and utility scripts
├── flow.json             # Flow configuration
└── .env.local            # Environment variables
```

## Testing

### Run Frontend Tests

```bash
npm test
```

### Run Contract Tests

```bash
flow test --cover
```

## Network Configuration

The application supports three networks:

- **Emulator**: Local development (default)
- **Testnet**: Flow testnet for testing
- **Mainnet**: Flow mainnet for production

Switch networks by updating `NEXT_PUBLIC_FLOW_NETWORK` in `.env.local`.

## Smart Contracts

### OverflowGame

Main game contract that handles:
- Bet placement and escrow
- Round management
- Win/loss determination
- Payout processing

### MockPriceOracle

Mock oracle for testing that provides BTC price feeds.

## Development Workflow

1. **Start Emulator**: Run the Flow emulator in a separate terminal
2. **Deploy Contracts**: Deploy contracts to the emulator
3. **Start Dev Server**: Run the Next.js development server
4. **Connect Wallet**: Use the dev wallet to connect
5. **Test Features**: Place bets and test the game flow

## Key Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Flow Client Library (FCL)**: Flow blockchain integration
- **Zustand**: State management
- **Jest**: Testing framework
- **Cadence**: Smart contract language

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_FLOW_NETWORK` | Network to connect to | `emulator` |
| `NEXT_PUBLIC_EMULATOR_ACCESS_NODE` | Emulator access node URL | `http://localhost:8888` |
| `NEXT_PUBLIC_EMULATOR_CONTRACT_ADDRESS` | Contract address on emulator | `0xf8d6e0586b0a20c7` |
| `NEXT_PUBLIC_ROUND_DURATION` | Round duration in seconds | `30` |
| `NEXT_PUBLIC_PRICE_UPDATE_INTERVAL` | Price update interval in ms | `1000` |
| `NEXT_PUBLIC_CHART_TIME_WINDOW` | Chart time window in ms | `300000` |

## Contributing

This project follows a task-based implementation plan. See `.kiro/specs/overflow/tasks.md` for the detailed implementation roadmap.

## License

MIT

## Resources

- [Flow Documentation](https://developers.flow.com/)
- [Cadence Language Reference](https://developers.flow.com/build/smart-contracts/cadence)
- [FCL Documentation](https://developers.flow.com/tools/clients/fcl-js)
- [Next.js Documentation](https://nextjs.org/docs)
