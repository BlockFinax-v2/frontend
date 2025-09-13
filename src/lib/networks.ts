export interface NetworkConfig {
  id: number;
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorerUrl: string;
  isTestnet: boolean;
  color: string;
  icon: string;
}

export const NETWORKS: NetworkConfig[] = [
  {
    id: 1,
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    symbol: "ETH",
    blockExplorerUrl: "https://sepolia.basescan.org",
    isTestnet: true,
    color: "#0052FF",
    icon: "fas fa-layer-group"
  }
];

export const getNetworkById = (id: number): NetworkConfig | undefined => {
  return NETWORKS.find(network => network.id === id);
};

export const getNetworkByChainId = (chainId: number): NetworkConfig | undefined => {
  return NETWORKS.find(network => network.chainId === chainId);
};

export const DEFAULT_NETWORK = NETWORKS[0]; // Base Sepolia
