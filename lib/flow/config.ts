import * as fcl from "@onflow/fcl";

export type FlowNetwork = 'emulator' | 'testnet' | 'mainnet';

interface NetworkConfig {
  accessNode: string;
  discoveryWallet: string;
  contractAddress: string;
}

const getNetworkConfig = (network: FlowNetwork): NetworkConfig => {
  const configs: Record<FlowNetwork, NetworkConfig> = {
    emulator: {
      accessNode: process.env.NEXT_PUBLIC_EMULATOR_ACCESS_NODE || "http://localhost:8888",
      discoveryWallet: process.env.NEXT_PUBLIC_EMULATOR_DISCOVERY_WALLET || "http://localhost:8701/fcl/authn",
      contractAddress: process.env.NEXT_PUBLIC_EMULATOR_CONTRACT_ADDRESS || "0xf8d6e0586b0a20c7"
    },
    testnet: {
      accessNode: process.env.NEXT_PUBLIC_TESTNET_ACCESS_NODE || "https://rest-testnet.onflow.org",
      discoveryWallet: process.env.NEXT_PUBLIC_TESTNET_DISCOVERY_WALLET || "https://fcl-discovery.onflow.org/testnet/authn",
      contractAddress: process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS || ""
    },
    mainnet: {
      accessNode: process.env.NEXT_PUBLIC_MAINNET_ACCESS_NODE || "https://rest-mainnet.onflow.org",
      discoveryWallet: process.env.NEXT_PUBLIC_MAINNET_DISCOVERY_WALLET || "https://fcl-discovery.onflow.org/authn",
      contractAddress: process.env.NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS || ""
    }
  };
  
  return configs[network];
};

export const configureFlow = (network: FlowNetwork = 'emulator') => {
  const config = getNetworkConfig(network);
  
  // Standard Flow contract addresses
  const flowTokenAddress = network === 'emulator' ? '0x0ae53cb6e3f42a79' : 
                          network === 'testnet' ? '0x7e60df042a9c0868' : 
                          '0x1654653399040a61';
  
  const fungibleTokenAddress = network === 'emulator' ? '0xee82856bf20e2aa6' :
                               network === 'testnet' ? '0x9a0766d93b6608b7' :
                               '0xf233dcee88fe0abe';
  
  fcl.config()
    .put("app.detail.title", process.env.NEXT_PUBLIC_APP_NAME || "Overflow")
    .put("app.detail.icon", "https://placekitten.com/g/200/200")
    .put("accessNode.api", config.accessNode)
    .put("discovery.wallet", config.discoveryWallet)
    .put("0xOverflowGame", config.contractAddress)
    .put("0xMockPriceOracle", config.contractAddress)
    .put("0xFlowToken", flowTokenAddress)
    .put("0xFungibleToken", fungibleTokenAddress);
  
  console.log(`Flow configured for ${network} network`);
  console.log(`Access Node: ${config.accessNode}`);
  console.log(`Contract Address: ${config.contractAddress}`);
  console.log(`FlowToken: ${flowTokenAddress}`);
  console.log(`FungibleToken: ${fungibleTokenAddress}`);
};

export const getCurrentNetwork = (): FlowNetwork => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK as FlowNetwork;
  return network || 'emulator';
};
