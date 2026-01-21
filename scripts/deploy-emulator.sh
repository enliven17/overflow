#!/bin/bash

# Deploy Overflow contracts to Flow emulator
# This script assumes the Flow emulator is already running

echo "Deploying contracts to Flow emulator..."

# Deploy MockPriceOracle contract
echo "Deploying MockPriceOracle..."
flow accounts add-contract MockPriceOracle ./cadence/contracts/MockPriceOracle.cdc --network=emulator

# Deploy OverflowGame contract
echo "Deploying OverflowGame..."
flow accounts add-contract OverflowGame ./cadence/contracts/OverflowGame.cdc --network=emulator

echo "Deployment complete!"
echo "Contract addresses:"
echo "  MockPriceOracle: 0xf8d6e0586b0a20c7"
echo "  OverflowGame: 0xf8d6e0586b0a20c7"
