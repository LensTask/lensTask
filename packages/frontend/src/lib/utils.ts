// lib/utils.ts
export const normalizeImageUrl = (uri?: string): string | undefined => {
    if (!uri) return undefined;
    if (uri.startsWith('ipfs://')) {
        const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
        return `${gateway}${uri.substring(7)}`;
    }
    return uri;
};