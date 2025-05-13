// lib/chains/lensMainnet.ts
import { type Chain } from 'wagmi/chains'; // Import Chain type correctly

export const lensMainnetGHOChain: Chain = { // Renamed to avoid conflict if you also use Polygon Mainnet
  id: 232,
  name: 'Lens Chain Mainnet',
  nativeCurrency: { name: 'GHO', symbol: 'GHO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.lens.xyz'] },
    public:  { http: ['https://rpc.lens.xyz'] },
  },
  blockExplorers: {
    default: { name: 'LensScan', url: 'https://explorer.lens.xyz' },
  },
  testnet: false,
};
