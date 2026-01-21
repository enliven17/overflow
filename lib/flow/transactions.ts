/**
 * Flow transaction templates for Overflow game
 */

/**
 * Transaction to place a bet
 * @param amount - Bet amount in FLOW tokens (e.g., "1.0")
 * @param targetCellId - ID of the target cell (1-8)
 * @param multiplier - Payout multiplier (e.g., "2.0")
 * @returns Cadence transaction code
 */
export const placeBetTransaction = (
  amount: string,
  targetCellId: string,
  multiplier: string
) => {
  return `
import OverflowGame from 0xOverflowGame
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

transaction(amount: UFix64, targetCellId: UInt8, priceChange: Fix64, direction: UInt8, multiplier: UFix64) {
  let paymentVault: @{FungibleToken.Vault}
  let playerAddress: Address
  
  prepare(signer: auth(BorrowValue) &Account) {
    // Store player address
    self.playerAddress = signer.address
    
    // Withdraw FLOW tokens from signer's vault
    let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
      ?? panic("Could not borrow reference to FlowToken.Vault")
    
    self.paymentVault <- vaultRef.withdraw(amount: amount)
  }
  
  execute {
    // Create target cell
    let targetCell = OverflowGame.TargetCell(
      id: targetCellId,
      priceChange: priceChange,
      direction: direction == 0 ? OverflowGame.Direction.UP : OverflowGame.Direction.DOWN,
      timeframe: 30.0
    )
    
    // Place bet
    let betId = OverflowGame.placeBet(
      payment: <-self.paymentVault,
      targetCell: targetCell,
      multiplier: multiplier,
      player: self.playerAddress
    )
    
    log("Bet placed successfully with ID: ".concat(betId.toString()))
  }
}
`;
};

/**
 * Transaction to settle a round
 * @param betId - The unique bet ID to settle
 * @returns Cadence transaction code
 */
export const settleRoundTransaction = (betId: string) => {
  return `
import OverflowGame from 0xOverflowGame

transaction(betId: UInt64) {
  let callerAddress: Address
  
  prepare(signer: auth(BorrowValue) &Account) {
    self.callerAddress = signer.address
  }
  
  execute {
    // Settle the round
    let result = OverflowGame.settleRound(betId: betId, caller: self.callerAddress)
    
    if result.won {
      log("Round won! Payout: ".concat(result.payout.toString()).concat(" FLOW"))
    } else {
      log("Round lost. Better luck next time!")
    }
    
    log("Actual price change: ".concat(result.actualPriceChange.toString()))
  }
}
`;
};

/**
 * Transaction to claim a pending payout (retry mechanism)
 * @param betId - The unique bet ID with pending payout
 * @returns Cadence transaction code
 */
export const claimPayoutTransaction = (betId: string) => {
  return `
import OverflowGame from 0xOverflowGame

transaction(betId: UInt64) {
  let callerAddress: Address
  
  prepare(signer: auth(BorrowValue) &Account) {
    self.callerAddress = signer.address
  }
  
  execute {
    // Claim the pending payout
    OverflowGame.claimPayout(betId: betId, caller: self.callerAddress)
    
    log("Payout claimed successfully!")
  }
}
`;
};
