// src/lib/storage-client.ts

import { StorageClient, immutable } from "@lens-chain/storage-client";

// 1) Create a singleton StorageClient
export const storageClient = StorageClient.create();

// 2) Define the Lens Testnet chain ID (37111)
const CHAIN_ID = 37111;

/**
 * Upload a JSON object as immutable metadata on Lens Testnet.
 *
 * @param metadata - Any JSON‐serializable object
 * @returns The resulting IPFS URI (string)
 */
export async function uploadMetadataAsJson(
  metadata: Record<string, any>
): Promise<string> {
  // Build an “immutable” ACL for chain 37111
  const acl = immutable(CHAIN_ID);

  // Upload and return the URI
  const { uri } = await storageClient.uploadAsJson(metadata, { acl });
  return uri;
}

// 3) Example usage when run directly:
//    ts-node src/lib/storage-client.ts
async function runExample() {
  const exampleMetadata = {
    name: "Alice",
    bio: "Blockchain enthusiast",
    createdAt: new Date().toISOString(),
  };

  try {
    const uri = await uploadMetadataAsJson(exampleMetadata);
    console.log("✅ Stored metadata at:", uri);
  } catch (err) {
    console.error("❌ Error uploading metadata:", err);
  }
}

// If this file is executed directly, run the example:
if (require.main === module) {
  runExample();
}
