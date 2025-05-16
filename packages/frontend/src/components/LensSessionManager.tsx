// src/components/LensSessionManager.tsx
import { useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';
import useSessionClient from '../lib/useSessionClient'; // Adjust path if needed
import { AppContext, useAppState } from '../context/useAppState'; // Adjust path

export function LensSessionManager() {
  // Get actions from AppContext to update global state
  const { actions } = useContext(AppContext);

  // Get wallet address and connection status from Wagmi
  // This is now called within a component that will be a child of Web3Provider
  const { address, isConnected } = useAccount();

  // Get Lens session logic and state from your custom hook
  const {
    sessionClient,
    activeLensProfile,
    checkCurrentLensSession,
    // You might not need feedback, isLoading, isPosting here if they are handled elsewhere
    // or if their state is managed through AppContext.
  } = useSessionClient(); // useSessionClient itself calls useAccount, useSignMessage etc.

  // Effect to check/initialize Lens session when wallet connects/changes
  useEffect(() => {
    console.log('[LensSessionManager] useEffect for address/isConnected triggered.', { address, isConnected });
    if (address) {
      actions.setIsLoadingSession(true);
      actions.setStateActiveLensProfile(null); // Reset while checking
      checkCurrentLensSession().then(() => { // Use finally to ensure loading is always set to false
        actions.setIsLoadingSession(false);
      });
    } else {
      // Clear Lens session state if wallet disconnects or address is lost
      actions.setStateSessionClient(null);
      actions.setStateActiveLensProfile(null);
      actions.setIsLoadingSession(false); // Ensure loading is false
    }
  // checkCurrentLensSession is a function from useSessionClient.
  // If it's stable (e.g., wrapped in useCallback in useSessionClient or defined outside render),
  // it's fine. Otherwise, you might get infinite loops if it's recreated on every render.
  // For now, assuming it's stable.
  }, [address]);

  // Effect to update AppContext when sessionClient from useSessionClient changes
  useEffect(() => {
    if (sessionClient) {
      actions.setStateSessionClient(sessionClient);
    }
    // If sessionClient becomes null (e.g., after logout in useSessionClient),
    // this will not update, relying on the previous useEffect to clear it.
    // Or, you could explicitly handle null:
    // else {
    //   actions.setStateSessionClient(null);
    // }
  }, [sessionClient]);

  // Effect to update AppContext when activeLensProfile from useSessionClient changes
  useEffect(() => {
    // This updates the context if activeLensProfile has a value OR becomes null

    if(activeLensProfile){
        actions.setStateActiveLensProfile(activeLensProfile);
    }
  }, [activeLensProfile]);

  return <></>; // This component doesn't render any UI
}