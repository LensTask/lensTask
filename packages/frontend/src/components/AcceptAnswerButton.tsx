import { useState } from 'react';
// import { lensClient } from "@/lib/lensClient";
import { useMutation } from "@tanstack/react-query";
import { signTypedData, getWalletClient } from "@wagmi/core";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { useConfig } from 'wagmi';
import { bountyCollectModuleAddress, chainId as localChainId } from '@/lib/contractAddresses';
// import { ProfileId } from '@lens-protocol/client';

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

  /* TODO: Replace placeholders with data fetched from Lens API */
  const askerProfileId = "0x01";
  const askerOwnerAddress = "0x0000000000000000000000000000000000000000";

  // TODO: Pull nonce from Lens instead of 0n
  const currentNonce = BigInt(0);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      setStatusMessage('');
      setSignature(null);

      // TODO: Ensure wallet is connected via ConnectKit/Family
      const walletClientInstance = await getWalletClient(wagmiConfig);
      if (!walletClientInstance) throw new Error("Wallet client not found");

      /* TODO: Strictly compare connected wallet with askerOwnerAddress */

      // TODO: Decide final calldata shape for processAction()
      const processActionCalldata = encodeAbiParameters(
        parseAbiParameters('uint256 expertProfileId'),
        [BigInt(expertProfileId)]
      );

      /* TODO: Fill correct LensHub address & domain data */
      const typedData = {
        domain: {
          name: 'Lens Protocol Modules',
          version: '1',
          chainId: localChainId,
          verifyingContract: '0xDb46d1Dc155634FbC734f3125bA7c2N6D8D2AD71',
        },
        types: ActionModuleEIP712Types,
        primaryType: 'Action' as const,
        message: {
          profileId: BigInt(askerProfileId),
          pubId: BigInt(questionId.split('-')[1] || '0'),
          actionModule: moduleActionId,
          actionModuleData: processActionCalldata,
          actor: walletClientInstance.account.address,
          nonce: currentNonce,
          deadline: deadline,
        },
      };

      // TODO: Move to Lens SDK broadcast after signature created
      const sig = await signTypedData(wagmiConfig, {
        account: walletClientInstance.account,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      setSignature(sig);
      setStatusMessage("Signature obtained! (broadcast step TODO)");
      return { signature: sig };
    },
    onError: (error: Error) => {
      const shortMessage = (error as any).shortMessage || error.message;
      setStatusMessage(`Signing failed: ${shortMessage}`);
    }
  });

  return (
    <div>
      {/* TODO: Disable button if wallet not asker */}
      <button
        disabled={isPending}
        onClick={() => mutate()}
        className="btn btn-primary"
      >
        {isPending ? 'Check Wallet...' : 'Accept & Pay (Sign EIP-712)'}
      </button>
      {signature     && <div className="text-xs mt-1 text-green-500">Signature: {signature.substring(0, 10)}...</div>}
      {statusMessage && <div className="text-xs mt-1 text-red-500">{statusMessage}</div>}
    </div>
  );
}
