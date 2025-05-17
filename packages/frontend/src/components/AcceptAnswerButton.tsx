// src/components/AcceptAnswerButton.tsx

import { useState } from 'react';
import useSessionClient from '../lib/useSessionClient';
import { useAppContext } from '../context/useAppState';

export default function AcceptAnswerButton({
  questionId,
  feedAddress,
  winnerAddress,
  onSuccess,
}: {
  questionId: string;
  feedAddress: `0x${string}`;
  winnerAddress: `0x${string}`;
  /** Called once the EIP-712 signature + transaction is done */
  onSuccess?: () => void;
}) {
  const { state } = useAppContext();
  const { handleAssignResponseWinner } = useSessionClient();
  const [isPending, setIsPending] = useState(false);

  const accept = async () => {
    try {
      setIsPending(true);
      await handleAssignResponseWinner(
        state.stateSessionClient,
        state.stateActiveLensProfile,
        feedAddress,
        questionId,
        winnerAddress
      );
      onSuccess?.();
    } catch (err) {
      console.error('Accept failed', err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={accept}
      disabled={isPending}
      className="btn btn-primary"
    >
      {isPending
        ? 'Accept & Pay (Signing…)'
        : 'Accept & Pay (Sign EIP-712)'}
    </button>
  );
}
