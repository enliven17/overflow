#!/bin/bash

# Verify that the Overflow project is set up correctly

echo "🔍 Verifying Overflow project setup..."
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  Node.js version: $NODE_VERSION"
else
    echo "  ❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
echo "✓ Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "  npm version: $NPM_VERSION"
else
    echo "  ❌ npm not found"
    exit 1
fi

# Check Flow CLI
echo "✓ Checking Flow CLI..."
if command -v flow &> /dev/null; then
    FLOW_VERSION=$(flow version)
    echo "  Flow CLI version: $FLOW_VERSION"
else
    echo "  ⚠️  Flow CLI not found. Install from: https://developers.flow.com/tools/flow-cli/install"
fi

# Check node_modules
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  Dependencies installed ✓"
else
    echo "  ⚠️  Dependencies not installed. Run: npm install"
fi

# Check environment file
echo "✓ Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo "  .env.local exists ✓"
else
    echo "  ⚠️  .env.local not found. Copy from .env.example"
fi

# Check directory structure
echo "✓ Checking directory structure..."
REQUIRED_DIRS=(
    "app"
    "components/game"
    "components/wallet"
    "components/history"
    "components/ui"
    "lib/flow"
    "lib/store"
    "lib/utils"
    "types"
    "cadence/contracts"
    "cadence/scripts"
    "cadence/transactions"
    "cadence/tests"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir"
    else
        echo "  ❌ $dir missing"
    fi
done

echo ""
echo "✅ Setup verification complete!"
echo ""
echo "Next steps:"
echo "  1. Install dependencies: npm install"
echo "  2. Configure environment: cp .env.example .env.local"
echo "  3. Start Flow emulator: npm run emulator"
echo "  4. Deploy contracts: npm run deploy:emulator"
echo "  5. Start dev server: npm run dev"
