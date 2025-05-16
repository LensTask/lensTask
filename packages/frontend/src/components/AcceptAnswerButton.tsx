import { useState } from 'react';
// import { lensClient } from "@/lib/lensClient";
import { useMutation } from "@tanstack/react-query";
import { signTypedData, getWalletClient } from "@wagmi/core";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { useConfig } from 'wagmi';
import { bountyCollectModuleAddress, chainId as localChainId } from '@/lib/contractAddresses';
// import { ProfileId } from '@lens-protocol/client';
import useSessionClient from '../lib/useSessionClient';
import { useAppContext } from '../context/useAppState';

/* ------------------------------------------------------------------ */
/* TODO: Verify this EIP-712 struct against the Hub version you use.   */
/* ------------------------------------------------------------------ */
const ActionModuleEIP712Types = {
  Action: [
    { name: 'profileId', type: 'uint256' },
    { name: 'pubId', type: 'uint256' },
    { name: 'actionModule', type: 'address' },
    { name: 'actionModuleData', type: 'bytes' },
    { name: 'actor', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export default function AcceptAnswerButton({
  questionId,
  feedAddress,
  winnerAddress,
}: {
  questionId: string;
  feedAddress: `0x${string}`;
  winnerAddress: `0x${string}`;
}) {
  const [statusMessage, setStatusMessage] = useState('');

  /* TODO: Replace placeholders with data fetched from Lens API */
  const askerProfileId = "0x01";
  const askerOwnerAddress = "0x0000000000000000000000000000000000000000";

  // TODO: Pull nonce from Lens instead of 0n
  const currentNonce = BigInt(0);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const { handleAssignResponseWinner } = useSessionClient();
  const isPending = false;

  const { state } = useAppContext();


  return (
    <div>
      {/* TODO: Disable button if wallet not asker */}
      <button
        disabled={isPending}
        onClick={async () => {
          // alert(questionId);
          // alert(feedAddress)
          // alert(winnerAddress)


          console.log("questionId", questionId)
          console.log("feedAddress", feedAddress)
          console.log("winnerAddress", winnerAddress)
          setStatusMessage("DOing stuff")
          await handleAssignResponseWinner(
            state.stateSessionClient,
            state.stateActiveLensProfile,
            feedAddress,
            questionId,
            winnerAddress
          )
          setStatusMessage("Done")

        }}
        className="btn btn-primary"
      >
        {isPending ? 'Check Wallet...' : 'Accept & Pay (Sign EIP-712)'}
      </button>
      {statusMessage && <div className="text-xs mt-1 text-red-500">{statusMessage}</div>}
    </div>
  );
}
