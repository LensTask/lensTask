import { Client } from "@xmtp/xmtp-js";
import { getWalletClient } from "@wagmi/core";

export async function getXmtpClient() {
  const wallet = await getWalletClient();
  return Client.create(wallet, { env: "production" });
}
