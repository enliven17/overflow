# Requirements Document

## Introduction

Overflow is a decentralized real-time BTC price prediction game built on Flow Blockchain where users bet FLOW tokens on Bitcoin price movements. The system provides a gamified interface with live price visualization, grid-based betting targets, and automated smart contract-based payouts using oracle price feeds.

## Glossary

- **Game_System**: The complete Overflow dApp including frontend and smart contracts
- **User**: A player who connects their Flow wallet to place bets
- **Bet**: A wager of FLOW tokens on a specific price target
- **Target_Cell**: A grid cell representing a price movement prediction with an associated multiplier
- **Round**: A time-bounded betting period (e.g., 30 seconds) with start and end prices
- **Oracle**: External price feed service (Pyth Network or Chainlink) providing tamper-proof BTC prices
- **Smart_Contract**: Cadence contract managing deposits, escrow, verification, and payouts
- **Multiplier**: The payout factor (e.g., x2, x3, x10) associated with each target cell
- **Chart_Component**: Live visualization showing real-time BTC price movement
- **Wallet**: Flow blockchain wallet (Blocto, Lilico, etc.) for authentication and transactions
- **Treasury**: Smart contract holding pool for lost bets and payout reserves

## Requirements

### Requirement 1: Wallet Connection and Authentication

**User Story:** As a user, I want to connect my Flow wallet to the dApp, so that I can authenticate and place bets with my FLOW tokens.

#### Acceptance Criteria

1. WHEN a user visits the application, THE Game_System SHALL display a wallet connection button
2. WHEN a user clicks the wallet connection button, THE Game_System SHALL initiate FCL authentication flow
3. WHEN wallet authentication succeeds, THE Game_System SHALL display the user's wallet address and FLOW balance
4. WHEN wallet authentication fails, THE Game_System SHALL display an error message and allow retry
5. WHERE a user is already authenticated, THE Game_System SHALL automatically restore the wallet session on page load

### Requirement 2: Live Price Chart Visualization

**User Story:** As a user, I want to see a live animated BTC price chart, so that I can make informed betting decisions based on real-time price movements.

#### Acceptance Criteria

1. THE Chart_Component SHALL display a live line chart with BTC price on the Y-axis and time on the X-axis
2. WHEN new price data arrives from the Oracle, THE Chart_Component SHALL animate the line smoothly to the new price point
3. THE Chart_Component SHALL use a neon pink color for the price line on a dark background
4. WHEN the chart updates, THE Chart_Component SHALL maintain a rolling time window of the last 5 minutes
5. THE Chart_Component SHALL update at minimum every 1 second with the latest price data

### Requirement 3: Betting Interface and Target Selection

**User Story:** As a user, I want to select a bet amount and target cell with a multiplier, so that I can place a prediction on BTC price movement.

#### Acceptance Criteria

1. THE Game_System SHALL display a grid of target cells with associated multipliers (x1.5, x2, x3, x4, x5, x6, x8, x10)
2. WHEN a user selects a bet amount, THE Game_System SHALL validate that the amount does not exceed their wallet balance
3. WHEN a user clicks a target cell, THE Game_System SHALL highlight the selected cell and display the potential payout
4. WHEN a user confirms their bet, THE Game_System SHALL initiate a transaction to deposit FLOW tokens to the Smart_Contract
5. THE Game_System SHALL prevent bet placement if a round is already active for that user

### Requirement 4: Smart Contract Deposit and Escrow

**User Story:** As a user, I want my bet funds to be securely held in escrow during the round, so that payouts are guaranteed and trustless.

#### Acceptance Criteria

1. WHEN a user places a bet, THE Smart_Contract SHALL accept and hold the FLOW tokens in escrow
2. WHEN funds are deposited, THE Smart_Contract SHALL record the bet amount, target cell, multiplier, start price, and start timestamp
3. THE Smart_Contract SHALL emit an event containing the bet details for frontend tracking
4. IF the deposit transaction fails, THEN THE Smart_Contract SHALL revert the transaction and return an error
5. THE Smart_Contract SHALL prevent double-betting by the same user in an active round

### Requirement 5: Oracle Price Feed Integration

**User Story:** As a system operator, I want to integrate a tamper-proof oracle for BTC prices, so that game outcomes are verifiable and trustless.

#### Acceptance Criteria

1. THE Smart_Contract SHALL query the Oracle for the current BTC price at round start
2. WHEN a round ends, THE Smart_Contract SHALL query the Oracle for the final BTC price
3. THE Smart_Contract SHALL validate that oracle price data is recent (within 60 seconds)
4. IF oracle data is stale or unavailable, THEN THE Smart_Contract SHALL reject the round and refund the bet
5. THE Smart_Contract SHALL store both start and end prices on-chain for transparency

### Requirement 6: Win/Loss Determination

**User Story:** As a user, I want the system to automatically determine if my bet won based on actual price movement, so that payouts are fair and transparent.

#### Acceptance Criteria

1. WHEN a round ends, THE Smart_Contract SHALL calculate the price difference between start and end prices
2. THE Smart_Contract SHALL compare the actual price movement against the user's selected target cell
3. IF the price movement matches or exceeds the target cell prediction, THEN THE Smart_Contract SHALL mark the bet as won
4. IF the price movement does not match the target cell prediction, THEN THE Smart_Contract SHALL mark the bet as lost
5. THE Smart_Contract SHALL emit a result event indicating win or loss with the actual price movement

### Requirement 7: Payout Processing

**User Story:** As a winning user, I want to receive my payout automatically, so that I can claim my winnings without manual intervention.

#### Acceptance Criteria

1. WHEN a bet is marked as won, THE Smart_Contract SHALL calculate the payout as bet_amount multiplied by the multiplier
2. THE Smart_Contract SHALL transfer the payout amount from escrow to the user's wallet
3. WHEN a bet is marked as lost, THE Smart_Contract SHALL transfer the bet amount to the Treasury
4. THE Smart_Contract SHALL emit a payout event with the amount and recipient address
5. IF the payout transfer fails, THEN THE Smart_Contract SHALL allow the user to retry the claim

### Requirement 8: Visual Feedback and Animations

**User Story:** As a user, I want to see visual feedback when the price line hits my target, so that I have an engaging and responsive gaming experience.

#### Acceptance Criteria

1. WHEN the price line crosses a user's selected target cell, THE Chart_Component SHALL display a "HIT" animation on that cell
2. WHEN a round ends with a win, THE Game_System SHALL display a "WIN" animation with the payout amount
3. WHEN a round ends with a loss, THE Game_System SHALL display a "LOSS" message
4. THE Game_System SHALL use smooth transitions and animations for all state changes
5. WHILE a round is active, THE Game_System SHALL display a countdown timer showing remaining time

### Requirement 9: Bet History and Transparency

**User Story:** As a user, I want to view my betting history, so that I can track my performance and verify past outcomes.

#### Acceptance Criteria

1. THE Game_System SHALL display a list of the user's recent bets with timestamps, amounts, targets, and outcomes
2. WHEN a user clicks on a historical bet, THE Game_System SHALL display detailed information including start price, end price, and actual movement
3. THE Game_System SHALL fetch bet history from blockchain events emitted by the Smart_Contract
4. THE Game_System SHALL display the total wins, losses, and net profit/loss for the user
5. THE Game_System SHALL allow filtering bet history by outcome (wins, losses, active)

### Requirement 10: Round Time Management

**User Story:** As a user, I want rounds to have a fixed duration, so that I know when my bet will be resolved.

#### Acceptance Criteria

1. WHEN a bet is placed, THE Smart_Contract SHALL set the round end time to 30 seconds from the start timestamp
2. THE Smart_Contract SHALL prevent early settlement before the round end time
3. WHEN the round end time is reached, THE Smart_Contract SHALL allow settlement with the final oracle price
4. THE Game_System SHALL display a countdown timer showing seconds remaining in the active round
5. IF settlement is not triggered within 5 minutes of round end, THEN THE Smart_Contract SHALL allow the user to trigger settlement manually

### Requirement 11: UI Layout and Design System

**User Story:** As a user, I want a visually appealing cyberpunk-themed interface, so that the gaming experience is immersive and modern.

#### Acceptance Criteria

1. THE Game_System SHALL use a dark mode color scheme with deep black background (#000000 or #0a0a0a)
2. THE Game_System SHALL use neon pink (#FF006E or similar) for primary interactive elements and the chart line
3. THE Game_System SHALL implement a split-screen layout with the chart on the left and target grid on the right
4. THE Game_System SHALL use Tailwind CSS for consistent styling and responsive design
5. THE Game_System SHALL display wallet balance, current bet amount, and potential payout prominently in the UI

### Requirement 12: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when something goes wrong, so that I understand what happened and how to proceed.

#### Acceptance Criteria

1. WHEN a transaction fails, THE Game_System SHALL display a user-friendly error message explaining the failure reason
2. WHEN the oracle is unavailable, THE Game_System SHALL display a warning and prevent new bets
3. WHEN the user has insufficient balance, THE Game_System SHALL display the required amount and current balance
4. THE Game_System SHALL display loading states during transaction processing
5. THE Game_System SHALL provide retry options for failed transactions

### Requirement 13: Smart Contract Security and Access Control

**User Story:** As a system operator, I want the smart contract to be secure and prevent unauthorized access, so that user funds are protected.

#### Acceptance Criteria

1. THE Smart_Contract SHALL validate that only the bet owner can settle their own round
2. THE Smart_Contract SHALL prevent reentrancy attacks using appropriate guards
3. THE Smart_Contract SHALL validate all input parameters for deposits and settlements
4. THE Smart_Contract SHALL implement access control for administrative functions (e.g., oracle address updates)
5. THE Smart_Contract SHALL emit events for all state-changing operations for auditability

### Requirement 14: Frontend State Management

**User Story:** As a developer, I want centralized state management for the application, so that data flows predictably and components stay synchronized.

#### Acceptance Criteria

1. THE Game_System SHALL use Zustand or Redux Toolkit for global state management
2. THE Game_System SHALL maintain state for wallet connection, active bets, bet history, and current prices
3. WHEN blockchain events are received, THE Game_System SHALL update the relevant state automatically
4. THE Game_System SHALL persist wallet session state to local storage for automatic reconnection
5. THE Game_System SHALL provide clear state update patterns for all async operations

### Requirement 15: Development and Testing Environment

**User Story:** As a developer, I want to test the application on Flow emulator, so that I can develop and debug without using mainnet.

#### Acceptance Criteria

1. THE Game_System SHALL provide configuration for connecting to Flow emulator
2. THE Game_System SHALL include scripts for deploying contracts to the emulator
3. THE Game_System SHALL provide mock oracle data for testing when using the emulator
4. THE Game_System SHALL document the setup process for running the emulator and deploying contracts
5. THE Game_System SHALL support switching between emulator, testnet, and mainnet configurations
