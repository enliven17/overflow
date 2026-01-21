# Implementation Plan: Overflow - BTC Price Prediction Game

## Overview

This implementation plan breaks down the Overflow dApp into discrete, incremental coding tasks. The approach follows a bottom-up strategy: smart contracts first (core game logic), then frontend infrastructure (wallet, state management), followed by UI components, and finally integration and testing. Each task builds on previous work, ensuring no orphaned code.

## Tasks

- [x] 1. Set up project structure and development environment
  - Create Next.js project with TypeScript and Tailwind CSS
  - Set up Flow emulator and CLI tools
  - Create Cadence contract directory structure
  - Configure FCL for emulator connection
  - Set up testing frameworks (Jest, Cadence Testing Framework)
  - Create environment configuration files (.env.local)
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 2. Implement mock oracle contract
  - [x] 2.1 Create MockPriceOracle.cdc contract
    - Implement IPriceOracle interface
    - Add admin-controlled price update function
    - Implement price freshness validation (60-second window)
    - Add PriceData struct with price, timestamp, confidence
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 2.2 Write property tests for oracle
    - **Property 5: Oracle Price Freshness Validation**
    - **Validates: Requirements 5.3, 5.4**
  
  - [ ]* 2.3 Write unit tests for oracle edge cases
    - Test exactly 60 seconds old price
    - Test oracle returning zero price
    - _Requirements: 5.3_

- [x] 3. Implement core smart contract structures and resources
  - [x] 3.1 Create OverflowGame.cdc contract skeleton
    - Define TargetCell struct with id, priceChange, direction, timeframe
    - Define Direction enum (UP, DOWN)
    - Define BetResult struct
    - Define BetStatus enum
    - _Requirements: 4.2, 6.1_
  
  - [x] 3.2 Implement Bet resource
    - Add all required fields (id, player, amount, targetCell, multiplier, startPrice, startTime, endTime, settled)
    - Implement init function
    - Add getter functions for bet data
    - _Requirements: 4.2, 10.1_
  
  - [x] 3.3 Implement Treasury resource
    - Create FlowToken.Vault storage
    - Implement deposit function
    - Implement withdraw function (admin only)
    - Implement getBalance function
    - _Requirements: 7.3_

- [x] 4. Implement bet placement logic
  - [x] 4.1 Create placeBet function
    - Accept FlowToken.Vault payment
    - Query oracle for start price
    - Create Bet resource with all fields
    - Calculate end time (start + 30 seconds)
    - Store bet in contract storage
    - Emit BetPlaced event
    - Return bet ID
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 10.1_
  
  - [ ]* 4.2 Write property tests for bet placement
    - **Property 1: Bet Amount Validation**
    - **Property 2: Active Round Prevention**
    - **Property 3: Bet Data Persistence**
    - **Property 4: Transaction Reversion on Failure**
    - **Property 18: Round End Time Calculation**
    - **Validates: Requirements 3.2, 3.5, 4.2, 4.4, 4.5, 10.1, 12.3, 13.3**
  
  - [ ]* 4.3 Write unit tests for bet placement edge cases
    - Test zero bet amount
    - Test negative bet amount
    - Test maximum bet amount
    - Test double-betting prevention
    - _Requirements: 4.4, 4.5_

- [x] 5. Implement round settlement and win/loss determination
  - [x] 5.1 Create settleRound function
    - Validate round end time has passed
    - Validate caller is bet owner
    - Query oracle for end price
    - Calculate price difference
    - Determine win/loss based on target
    - Update bet.settled flag
    - Emit RoundSettled event
    - Return BetResult
    - _Requirements: 5.2, 6.1, 6.2, 6.3, 6.4, 6.5, 10.2, 10.3, 13.1_
  
  - [ ]* 5.2 Write property tests for settlement
    - **Property 7: Price Movement Calculation**
    - **Property 8: Bet Outcome Determination**
    - **Property 19: Early Settlement Prevention**
    - **Property 20: Settlement After End Time**
    - **Property 31: Bet Owner Authorization**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 10.2, 10.3, 13.1**
  
  - [ ]* 5.3 Write unit tests for settlement edge cases
    - Test exact price match
    - Test off-by-one price difference
    - Test zero price change
    - Test settlement exactly at end time
    - _Requirements: 6.3, 6.4, 10.3_

- [x] 6. Implement payout processing
  - [x] 6.1 Add payout logic to settleRound
    - Calculate payout (amount * multiplier) for wins
    - Transfer payout from escrow to player for wins
    - Transfer bet amount to treasury for losses
    - Emit PayoutTransferred event
    - Handle transfer failures with retry mechanism
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 6.2 Implement claimPayout function for retry
    - Allow users to retry failed payouts
    - Validate bet is settled and won
    - Validate payout not already claimed
    - Transfer payout to player
    - _Requirements: 7.5_
  
  - [ ]* 6.3 Write property tests for payouts
    - **Property 9: Payout Calculation and Transfer**
    - **Property 10: Payout Retry on Failure**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**
  
  - [ ]* 6.4 Write unit tests for payout edge cases
    - Test maximum payout
    - Test minimum payout
    - Test failed transfer retry
    - _Requirements: 7.5_

- [x] 7. Implement contract query functions and admin features
  - [x] 7.1 Create public query functions
    - getBetStatus(betId) - returns bet details
    - getTargetCells() - returns available targets with multipliers
    - getUserActiveBet(address) - returns active bet for user
    - _Requirements: 3.1, 3.5_
  
  - [x] 7.2 Implement Admin resource
    - Create Admin resource with capability-based access
    - Add updateOracleAddress function
    - Add withdrawTreasury function
    - Add pauseGame/resumeGame functions
    - _Requirements: 13.4_
  
  - [ ]* 7.3 Write property tests for access control
    - **Property 32: Administrative Access Control**
    - **Validates: Requirements 13.4**
  
  - [ ]* 7.4 Write property test for event emission
    - **Property 33: State Change Event Emission**
    - **Validates: Requirements 4.3, 6.5, 7.4, 13.5**

- [x] 8. Checkpoint - Deploy and test contracts on emulator
  - Deploy MockPriceOracle contract to emulator
  - Deploy OverflowGame contract to emulator
  - Run all contract tests
  - Manually test bet flow using Flow CLI
  - Ensure all tests pass, ask the user if questions arise

- [x] 9. Set up Next.js frontend infrastructure
  - [x] 9.1 Create type definitions
    - Create types/game.ts with TargetCell, ActiveRound, BetRecord interfaces
    - Create types/bet.ts with bet-related types
    - Create types/flow.ts with Flow-specific types
    - _Requirements: 14.2_
  
  - [x] 9.2 Configure FCL and Flow connection
    - Create lib/flow/config.ts with network configurations
    - Implement configureFlow function for emulator/testnet/mainnet
    - Set up FCL configuration with access nodes and discovery wallet
    - _Requirements: 1.1, 15.1, 15.5_
  
  - [x] 9.3 Create transaction and script templates
    - Create lib/flow/transactions.ts with placeBetTransaction and settleRoundTransaction
    - Create lib/flow/scripts.ts with getBalanceScript, getBetStatusScript, getTargetCellsScript
    - _Requirements: 3.4, 4.1_
  
  - [x] 9.4 Implement event listeners
    - Create lib/flow/events.ts with subscribeToBetEvents function
    - Set up listeners for BetPlaced and RoundSettled events
    - _Requirements: 9.3, 14.3_

- [x] 10. Implement Zustand state management
  - [x] 10.1 Create wallet state slice
    - Create lib/store/walletSlice.ts
    - Implement connect, disconnect, refreshBalance actions
    - Add address, balance, isConnected, isConnecting state
    - Implement localStorage persistence for session
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 14.2, 14.4_
  
  - [ ]* 10.2 Write property tests for wallet state
    - **Property 14: Wallet Session Restoration**
    - **Property 15: Authentication Flow Triggering**
    - **Property 16: Authentication Success Handling**
    - **Property 17: Authentication Failure Handling**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 14.4**
  
  - [x] 10.3 Create game state slice
    - Create lib/store/gameSlice.ts
    - Implement placeBet, settleRound, updatePrice actions
    - Add currentPrice, priceHistory, activeRound, targetCells state
    - Implement rolling time window for price history (5 minutes)
    - _Requirements: 2.4, 3.3, 14.2_
  
  - [ ]* 10.4 Write property tests for game state
    - **Property 11: Rolling Time Window**
    - **Property 12: Target Cell Selection and Payout Display**
    - **Property 13: Transaction Initiation**
    - **Validates: Requirements 2.4, 3.3, 3.4**
  
  - [x] 10.5 Create history state slice
    - Create lib/store/historySlice.ts
    - Implement fetchHistory, addBet actions
    - Add bets array and isLoading state
    - Implement localStorage persistence for recent bets
    - _Requirements: 9.1, 9.3, 14.2_
  
  - [ ]* 10.6 Write property tests for history state
    - **Property 23: Bet History Calculation**
    - **Property 24: Bet History Filtering**
    - **Property 26: Blockchain Event Fetching**
    - **Validates: Requirements 9.3, 9.4, 9.5**
  
  - [x] 10.7 Set up main store
    - Create lib/store/index.ts
    - Combine all slices into single store
    - Set up event subscription to update state
    - _Requirements: 14.2, 14.3_
  
  - [ ]* 10.8 Write property test for event synchronization
    - **Property 34: Blockchain Event State Synchronization**
    - **Validates: Requirements 14.3**

- [x] 11. Create reusable UI components
  - [x] 11.1 Create base UI components
    - Create components/ui/Button.tsx with cyberpunk styling
    - Create components/ui/Card.tsx with dark theme
    - Create components/ui/Modal.tsx for dialogs
    - Use Tailwind CSS with neon pink (#FF006E) and black (#0a0a0a)
    - _Requirements: 11.1, 11.2_
  
  - [x] 11.2 Create wallet components
    - Create components/wallet/WalletConnect.tsx with connect button
    - Create components/wallet/WalletInfo.tsx with address and balance display
    - Integrate with wallet state slice
    - _Requirements: 1.1, 1.3, 11.5_
  
  - [ ]* 11.3 Write unit tests for wallet components
    - Test wallet connection button renders
    - Test wallet info displays address and balance
    - Test error handling for failed connection
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 12. Implement live chart component
  - [x] 12.1 Create LiveChart component
    - Create components/game/LiveChart.tsx
    - Integrate Recharts or Lightweight Charts library
    - Implement line chart with BTC price on Y-axis, time on X-axis
    - Use neon pink (#FF006E) for line color
    - Implement smooth line animation for new price points
    - Add target cell overlays on chart
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 12.2 Implement chart data management
    - Connect to game state priceHistory
    - Implement rolling 5-minute window
    - Update chart every second with new price
    - _Requirements: 2.4, 2.5_
  
  - [ ]* 12.3 Write property test for chart
    - **Property 11: Rolling Time Window** (if not covered in state tests)
    - **Validates: Requirements 2.4**
  
  - [ ]* 12.4 Write unit tests for chart edge cases
    - Test with empty data
    - Test with single data point
    - Test with large dataset
    - _Requirements: 2.1_

- [x] 13. Implement betting interface components
  - [x] 13.1 Create TargetGrid component
    - Create components/game/TargetGrid.tsx
    - Display grid of target cells with multipliers
    - Implement cell selection with highlighting
    - Show potential payout on selection
    - Disable grid when round is active
    - _Requirements: 3.1, 3.3, 3.5_
  
  - [x] 13.2 Create BetControls component
    - Create components/game/BetControls.tsx
    - Add bet amount input with validation
    - Show wallet balance
    - Show potential payout
    - Add confirm bet button
    - Implement bet placement transaction
    - _Requirements: 3.2, 3.4, 11.5_
  
  - [ ]* 13.3 Write property tests for betting interface
    - **Property 1: Bet Amount Validation** (frontend validation)
    - **Property 12: Target Cell Selection and Payout Display**
    - **Property 13: Transaction Initiation**
    - **Validates: Requirements 3.2, 3.3, 3.4, 12.3**
  
  - [ ]* 13.4 Write unit tests for betting controls
    - Test bet amount validation
    - Test insufficient balance error
    - Test target selection
    - _Requirements: 3.2, 12.3_

- [x] 14. Implement active round display and timer
  - [x] 14.1 Create ActiveRound component
    - Create components/game/ActiveRound.tsx
    - Display current bet details (amount, target, potential payout)
    - Show start price and current price
    - Show price change indicator
    - Display round status (active, settling, settled)
    - _Requirements: 8.5, 11.5_
  
  - [x] 14.2 Create RoundTimer component
    - Create components/game/RoundTimer.tsx
    - Display countdown timer showing seconds remaining
    - Update every second
    - Trigger settlement when timer reaches zero
    - Show manual settlement option after 5-minute timeout
    - _Requirements: 8.5, 10.4, 10.5_
  
  - [ ]* 14.3 Write property tests for timer
    - **Property 21: Countdown Timer Accuracy**
    - **Property 22: Manual Settlement After Timeout**
    - **Validates: Requirements 8.5, 10.4, 10.5**
  
  - [ ]* 14.4 Write unit tests for active round display
    - Test round details display
    - Test timer countdown
    - Test settlement trigger
    - _Requirements: 8.5, 10.4_

- [x] 15. Implement bet history components
  - [x] 15.1 Create BetHistory component
    - Create components/history/BetHistory.tsx
    - Display list of recent bets
    - Show timestamp, amount, target, outcome for each bet
    - Implement filtering by outcome (wins, losses, active)
    - Display total wins, losses, net profit/loss
    - _Requirements: 9.1, 9.4, 9.5_
  
  - [x] 15.2 Create BetCard component
    - Create components/history/BetCard.tsx
    - Display individual bet summary
    - Implement click to show detailed view
    - Show start price, end price, actual movement in detail view
    - _Requirements: 9.2_
  
  - [ ]* 15.3 Write property tests for bet history
    - **Property 23: Bet History Calculation**
    - **Property 24: Bet History Filtering**
    - **Property 25: Historical Bet Details**
    - **Validates: Requirements 9.2, 9.4, 9.5**
  
  - [ ]* 15.4 Write unit tests for bet history
    - Test with empty history
    - Test with mixed outcomes
    - Test filtering
    - _Requirements: 9.5_

- [x] 16. Implement error handling and user feedback
  - [x] 16.1 Create error display components
    - Create toast notification system for transient errors
    - Create modal dialog for critical errors
    - Create inline validation message components
    - Create banner warning component for system issues
    - _Requirements: 12.1, 12.2_
  
  - [x] 16.2 Implement error handling in state slices
    - Add error handling to wallet slice (connection failures)
    - Add error handling to game slice (transaction failures, oracle unavailable)
    - Add error handling to history slice (fetch failures)
    - Implement retry mechanisms
    - _Requirements: 1.4, 12.1, 12.2, 12.5_
  
  - [x] 16.3 Add loading states
    - Implement loading indicators for wallet connection
    - Implement loading indicators for transactions
    - Implement loading indicators for bet history fetching
    - _Requirements: 12.4_
  
  - [ ]* 16.4 Write property tests for error handling
    - **Property 27: Transaction Error Display**
    - **Property 28: Oracle Unavailability Handling**
    - **Property 29: Loading State Display**
    - **Property 30: Transaction Retry Availability**
    - **Validates: Requirements 12.1, 12.2, 12.4, 12.5**
  
  - [ ]* 16.5 Write unit tests for error scenarios
    - Test each error type
    - Test retry functionality
    - Test loading states
    - _Requirements: 12.1, 12.5_

- [x] 17. Create main game board and layout
  - [x] 17.1 Create GameBoard component
    - Create components/game/GameBoard.tsx
    - Implement split-screen layout (chart left, controls right)
    - Integrate LiveChart, TargetGrid, BetControls, ActiveRound components
    - Apply cyberpunk theme with dark background and neon accents
    - _Requirements: 11.3, 11.1, 11.2_
  
  - [x] 17.2 Create main page
    - Update app/page.tsx
    - Add WalletConnect in header
    - Add GameBoard as main content
    - Add BetHistory in sidebar or bottom section
    - Ensure responsive design with Tailwind CSS
    - _Requirements: 11.3, 11.4_
  
  - [x] 17.3 Create root layout with providers
    - Update app/layout.tsx
    - Add Zustand store provider
    - Add FCL configuration
    - Add global styles for cyberpunk theme
    - _Requirements: 11.1, 11.2, 14.1_

- [x] 18. Implement price feed simulation for testing
  - [x] 18.1 Create mock price feed service
    - Create lib/utils/mockPriceFeed.ts
    - Generate realistic BTC price movements
    - Update price every second
    - Allow manual price updates for testing
    - _Requirements: 15.3_
  
  - [x] 18.2 Integrate mock price feed with game state
    - Connect mock feed to updatePrice action
    - Start feed when app loads in emulator mode
    - Stop feed when switching to testnet/mainnet
    - _Requirements: 15.3_

- [x] 19. Implement network configuration switching
  - [x] 19.1 Create network selector component
    - Create components/NetworkSelector.tsx
    - Add dropdown to select emulator/testnet/mainnet
    - Apply selected configuration
    - Show current network in UI
    - _Requirements: 15.5_
  
  - [ ]* 19.2 Write property test for network switching
    - **Property 35: Network Configuration Switching**
    - **Validates: Requirements 15.5**
  
  - [ ]* 19.3 Write unit tests for network configuration
    - Test each network configuration
    - Test switching between networks
    - _Requirements: 15.5_

- [x] 20. Checkpoint - Integration testing
  - Test complete bet flow end-to-end on emulator
  - Test wallet connection with multiple providers
  - Test error scenarios (oracle down, insufficient balance)
  - Test bet history accuracy
  - Verify all animations and transitions work
  - Ensure all tests pass, ask the user if questions arise

- [x] 21. Add visual feedback and animations
  - [x] 21.1 Implement win/loss animations
    - Add WIN animation with payout amount display
    - Add LOSS animation with message
    - Add target hit animation on chart
    - Use CSS transitions and animations
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 21.2 Add smooth transitions
    - Add transitions for state changes
    - Add hover effects on interactive elements
    - Add loading animations
    - Ensure smooth chart line animation
    - _Requirements: 8.4_

- [x] 22. Optimize performance
  - [x] 22.1 Optimize chart rendering
    - Use React.memo for LiveChart component
    - Implement efficient data updates
    - Debounce price updates to 1 per second
    - _Requirements: 2.5_
  
  - [x] 22.2 Optimize bet history
    - Implement virtual scrolling for large datasets
    - Use Web Workers for aggregation calculations
    - Cache computed values
    - _Requirements: 9.1_
  
  - [x] 22.3 Optimize state management
    - Implement optimistic UI updates
    - Batch state updates where possible
    - Cache static data (target cells)
    - _Requirements: 14.2_

- [x] 23. Add documentation and deployment scripts
  - [x] 23.1 Create deployment scripts
    - Create scripts/deploy-emulator.sh for emulator deployment
    - Create scripts/deploy-testnet.sh for testnet deployment
    - Add contract deployment instructions
    - _Requirements: 15.2_
  
  - [x] 23.2 Create README documentation
    - Document project setup
    - Document emulator setup and usage
    - Document environment variables
    - Add architecture overview
    - Add testing instructions
    - _Requirements: 15.4_
  
  - [x] 23.3 Add inline code documentation
    - Add JSDoc comments to all public functions
    - Add Cadence doc comments to contract functions
    - Document complex logic and algorithms
    - _Requirements: 15.4_

- [x] 24. Final checkpoint - Complete system test
  - Run all unit tests and property tests
  - Run integration tests on emulator
  - Test on different browsers (Chrome, Firefox, Safari)
  - Test on mobile devices
  - Verify all requirements are met
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: contracts → state → UI → integration
- All code should follow clean code principles and be modular
- Use TypeScript for type safety throughout the frontend
- Use Cadence best practices for smart contract development
