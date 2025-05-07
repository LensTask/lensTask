import { useState } from 'react';
import { lensClient } from "@/lib/lensClient";
import { useMutation } from "@tanstack/react-query";
import { signTypedData, getWalletClient } from "@wagmi/core";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { useConfig } from 'wagmi';

// TODO: replace placeholders with real contract / chain values after deploy
import { bountyCollectModuleAddress, chainId as localChainId } from '@/lib/contractAddresses';

import { ProfileId } from '@lens-protocol/client';

/* ------------------------------------------------------------------ */
/* -----------------------  TODO:  EIP-712 types  -------------------- */
/* 1. Cross-check this struct against the final Lens V2 spec.          */
/* 2. Make sure field order & names match what LensHub expects.        */
/* ------------------------------------------------------------------ */
const ActionModuleEIP712Types = {
  Action: [
    { name: 'profileId',         type: 'uint256' },
    { name: 'pubId',             type: 'uint256' },
    { name: 'actionModule',      type: 'address' },
    { name: 'actionModuleData',  type: 'bytes'   },
    { name: 'actor',             type: 'address' },
    { name: 'nonce',             type: 'uint256' },
    { name: 'deadline',          type: 'uint256' },
  ],
} as const;

export default function AcceptAnswerButton({
  questionId,
  expertProfileId,
  moduleActionId,
}: {
  questionId: string;
  expertProfileId: ProfileId;
  moduleActionId: `0x${string}`;
}) {
  const wagmiConfig = useConfig();
  const [statusMessage, setStatusMessage] = useState('');
  const [signature, setSignature] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* TODO: look up asker profile + owner from Lens API, not hard-coded. */
  /* ------------------------------------------------------------------ */
  const askerProfileId = "0x01";
  const askerOwnerAddress = "0x0000000000000000000000000000000000000000";

  /* TODO: call Lens generateActionNonce(profileId) instead of 0n */
  const currentNonce = BigInt(0);
  const deadline     = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      setStatusMessage('');
      setSignature(null);

      // TODO: ensure wallet is connected via ConnectKit/Family
      const walletClientInstance = await getWalletClient(wagmiConfig);
      if (!walletClientInstance) throw new Error("Wallet client not found");

      // TODO: compare wallet address with real asker owner (fetched)
      if (walletClientInstance.account.address.toLowerCase() !== askerOwnerAddress.toLowerCase()) {
        console.warn("Connected address is not the asker.");
      }

      /* ------------------------------------------------------------- */
      /* TODO: finalise calldata format expected by processAction()    */
      /* ------------------------------------------------------------- */
      const processActionCalldata = encodeAbiParameters(
        parseAbiParameters('uint256 expertProfileId'),
        [BigInt(expertProfileId)]
      );

      /* TODO: verify domain fields (name, version, hub address) */
      const typedData = {
        domain: {
          name: 'Lens Protocol Modules',
          version: '1',
          chainId: localChainId,
          verifyingContract: '0xDb46d1Dc155634FbC734f3125bA7c2N6D8D2AD71', // TODO replace
        },
        types: ActionModuleEIP712Types,
        primaryType: 'Action' as const,
        message: {
          profileId: BigInt(askerProfileId),
          pubId:     BigInt(questionId.split('-')[1] || '0'),
          actionModule: moduleActionId,
          actionModuleData: processActionCalldata,
          actor: walletClientInstance.account.address,
          nonce: currentNonce,
          deadline: deadline,
        },
      };

      /* TODO: migrate to Lens SDK v2 helper once available */
      const sig = await signTypedData(wagmiConfig, {
        account: walletClientInstance.account,
        domain: typedData.domain,
        types:  typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      setSignature(sig);
      setStatusMessage("Signature obtained! (broadcast step TODO)");
      /* TODO: lensClient.transaction.broadcastOnchain(...) */
      return { signature: sig };
    },
    onError: (error: Error) => {
      const msg = (error as any).shortMessage || error.message;
      setStatusMessage(`Signing failed: ${msg}`);
    }
  });

  return (
    <div>
      <button
        disabled={isPending}
        onClick={() => mutate()}
        className="btn btn-primary"
      >
        {isPending ? 'Check Wallet…' : 'Accept & Pay (Sign)'}
      </button>
      {signature     && <div className="text-xs text-green-500 mt-1">Sig: {signature.slice(0,10)}…</div>}
      {statusMessage && <div className="text-xs text-red-500 mt-1">{statusMessage}</div>}
    </div>
  );
}
