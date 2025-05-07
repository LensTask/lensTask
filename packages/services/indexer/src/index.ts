import { createPublicClient, http } from "viem";
import { abi as ModuleAbi } from "../../../contracts/artifacts/contracts/BountyCollectModule.sol/BountyCollectModule.json";

const client = createPublicClient({
  chain: { id: 175177, rpcUrls: { default: { http: ["RPC_URL"] } } }, // LensChain testnet
  transport: http("RPC_URL")
});

const MODULE = "0xYourModule";

client.watchEvent({
  address: MODULE as `0x${string}`,
  abi: ModuleAbi,
  eventName: "AnswerAccepted",
  onLogs: logs => logs.forEach(async log => {
    // persist to Postgres
    console.log("accepted", log.args);
  })
});
