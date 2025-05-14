import { PublicClient, mainnet,testnet } from "@lens-protocol/client";

import { fragments } from "./fragments";

export const client = PublicClient.create({
  environment: testnet,
  fragments,
});