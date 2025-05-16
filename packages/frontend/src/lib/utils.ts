// lib/utils.ts
export const normalizeImageUrl = (uri?: string): string | undefined => {
    if (!uri) return undefined;
    if (uri.startsWith('ipfs://')) {
        const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
        return `${gateway}${uri.substring(7)}`;
    }
    return uri;
};

// BountyPostAction contract address for chain ID
const POST_ACTION_ADDRESS: Record<number, string> = {
    232: "0xE5f5343E9afa04Ad62b006e109170113C1503649", // mainnet
    37111: "0xFa5E20A92f412929AFF2Bcd858501F950b63886C" // testnet
};

export const getPostActionAddress = function(chainId?: number) {
    if (!chainId) {
        throw new Error("Chain ID cannot be empty!");
    }
    if (!Object.keys(POST_ACTION_ADDRESS).includes(chainId.toString())) {
        throw new Error(`No Post Action address available for chain ID ${chainId}`);
    }

    return POST_ACTION_ADDRESS[chainId];
}

// AcceptedAnswerNFT contract address for chain ID
const NFT_ADDRESS: Record<number, string> = {
    232: "0x3f9bE9Ab356070B43ea861A35673257873eC7Cab", // mainnet
    37111: "0x20a7b4453247B90Afc00742CA417aB0E9b77a92A" // testnet
};

export const getNftAddress = function(chainId?: number) {
    if (!chainId) {
        throw new Error("Chain ID cannot be empty!");
    }
    if (!Object.keys(NFT_ADDRESS).includes(chainId.toString())) {
        throw new Error(`No Post Action address available for chain ID ${chainId}`);
    }

    return NFT_ADDRESS[chainId];
}