// src/components/ProfileCreator.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage,useWalletClient } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { fetchAccount,fetchAccountsAvailable,createAccountWithUsername } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { evmAddress } from "@lens-protocol/client";
import { uri } from "@lens-protocol/client";
import { never } from "@lens-protocol/client";

import { account } from "@lens-protocol/metadata";

// --- Lens Client SDK V2 Imports ---
import { client } from "../lib/client"; // Your Lens SDK V2 client instance
import { storageClient } from "../lib/storage-client";

// import { evmAddress, Profile } from "@lens-protocol/client"; // For typing if needed
// --- End Lens Imports ---

interface ActiveLensProfile {
  id: string;
  handle?: { fullHandle: string; localName: string; namespace: string; } | null;
}

// ACTION: Replace with your actual Lens App address for the target network
const LENS_APP_ADDRESS = "0xaC19aa2402b3AC3f9Fe471D4783EC68595432465"; // Using the one from your example

export default function ProfileCreator() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: walletClient } = useWalletClient();

  const { address, isConnected, isConnecting } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [activeLensProfile, setActiveLensProfile] = useState<ActiveLensProfile | null>(null);
  const [isCheckingLensSession, setIsCheckingLensSession] = useState(true);
  const [sessionClient, setSessionClient] = useState();
  const [usernameSignUp, setUsernameSignUp] = useState();

  const [showSignUpForm, setSignUpFormActive] = useState(false);

  useEffect(() => {
    const checkCurrentLensSession = async () => {
      if (isConnected && address) {
        setIsCheckingLensSession(true);
        setFeedback("Checking Lens session...");
        try {
          // Check if the client is already authenticated (V2 might manage this internally)
          // This is a conceptual check; your SDK might have a direct method.
          const result = await fetchAccountsAvailable(client, {
            managedBy: evmAddress(address as `0x${string}`),
            includeOwned: true,
          });
          
          if (result.isErr()) {
            return console.error(result.error);
          }
          console.log(result)
          console.log(result.value)
          const account = result.value.items[0].account;
          console.log(account);
          const loginResult = await client.login({
            onboardingUser: {
              wallet: address as `0x${string}`, // Ensure address is in `0x...` format
            },
            signMessage: async (message: string) => {
              console.log("[ProfileCreator] Signing Lens challenge...");
              return signMessageAsync({ message }); // Use wagmi's signMessageAsync
            },
          });
          const sessionClient = loginResult.value
          sessionClient.switchAccount({
            account: account?.address ?? never("Account not found"),
          })
          if(!account?.username){
            setIsCheckingLensSession(false);
            setActiveLensProfile(null);
            setFeedback(`You need to create a profile!`);
            return;
          }
          setActiveLensProfile(account);
          setFeedback(`✅ Welcome back, @${account?.username.localName}!`);
          setIsCheckingLensSession(false);
          // If not authenticated or no profile in session, clear it
          setFeedback(isConnected ? "Wallet connected. You can login with Lens." : "Please connect your wallet.");
        } catch (e: any) {
          console.warn("[ProfileCreator] Error checking existing Lens auth state:", e.message);
          setActiveLensProfile(null);
          setFeedback("Could not determine Lens session status.");
        } finally {
          setIsCheckingLensSession(false);
        }
      } else {
        setActiveLensProfile(null);
        setFeedback(null);
        setIsCheckingLensSession(false);
      }
    };
    checkCurrentLensSession();
  }, [isConnected, address]);

  const handleProfileCreation = async () => {
    const metadata = account({
      name: usernameSignUp,
    });
    
    console.log(sessionClient)
    const { uri: uriResult } = await storageClient.uploadAsJson(metadata);
    console.log(uriResult)
    console.log(walletClient)
    const result = await createAccountWithUsername(sessionClient, {
      username: { localName: usernameSignUp },
      metadataUri: uri(uriResult)
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen(async (txHash) => fetchAccount(sessionClient, { txHash }))
      .andThen((account) =>
        sessionClient.switchAccount({
          account: account?.address ?? never("Account not found"),
        })
      );;
    console.log(result)
  }


  const handleLoginOrCreateWithLens = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!isConnected || !address) {
      setFeedback('⚠️ Wallet not connected. Please connect your wallet first.');
      return;
    }

    console.log(`[ProfileCreator] Attempting Lens login/onboarding for address: ${address}`);
    setFeedback(`Processing with Lens Protocol for wallet: ${address.substring(0,6)}...`);
    setIsLoading(true);
    if(usernameSignUp && sessionClient){
      try{
        handleProfileCreation();
      } catch(err){
        console.log(err)
      }
      setIsLoading(false)

      return;
    }
    try {
      // Using the login structure you provided
      const loginResult = await client.login({
        onboardingUser: {
          wallet: address as `0x${string}`, // Ensure address is in `0x...` format
        },
        signMessage: async (message: string) => {
          console.log("[ProfileCreator] Signing Lens challenge...");
          return signMessageAsync({ message }); // Use wagmi's signMessageAsync
        },
      });
      console.log(loginResult)
      if (!loginResult.isErr()) {
        // The `loginResult.value` is the authenticated LensClient instance
        // We need to get the profile from this authenticated client.

        setSessionClient(loginResult.value);
        if(!activeLensProfile){
          // Show form to create profile
          setSignUpFormActive(true);
        }  else {
          // This case should ideally not happen if login was successful and implies onboarding
          // or a default profile was expected.
          console.error("[ProfileCreator] Login succeeded but no profile returned in session Client.");
          setFeedback(`❌ Login seemed successful, but no profile data was retrieved.`);
          setActiveLensProfile(null);
        }
      } else {
        console.error("[ProfileCreator] Lens login/onboarding failed:", loginResult.error.message);
        setFeedback(`❌ Lens Login/Onboarding Error: ${loginResult.error.message}`);
        setActiveLensProfile(null);
      }
    } catch (err: any) {
      console.error("[ProfileCreator] Exception during login/profile creation:", err);
      setFeedback(`❌ Unexpected error: ${err.message}`);
      setActiveLensProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnecting || isCheckingLensSession) {
    return (
        <div className="my-4 p-4 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-center animate-pulse">
            <p className="text-sm text-slate-600 dark:text-slate-300">
                {isConnecting ? "Connecting to wallet..." : "Checking Lens status..."}
            </p>
        </div>
    );
  }

  if (!isConnected) {
     return (
        <div className="my-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-lg text-center">
            <p className="text-sm text-amber-700 dark:text-amber-200 mb-3">
                Please connect your wallet to interact with Lens Protocol.
            </p>
            <ConnectKitButton />
        </div>
     );
  }

  if (activeLensProfile) {
    return (
      <div className="my-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-600 rounded-lg text-center">
        <p className="text-sm text-green-700 dark:text-green-200">
          Welcome! Interacting as: <br />
          <strong className="font-medium">@{activeLensProfile.username?.localName || activeLensProfile.address}</strong>
        </p>
      </div>
    );
  }

  // Wallet connected, but no active Lens profile session yet. Show Login/Onboard button.
  return (
    <div className="my-6 p-4 sm:p-6 border rounded-lg shadow-md bg-white dark:bg-slate-800">
      <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">Login or Create Profile with Lens</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Wallet: <code className="text-xs bg-slate-100 dark:bg-slate-700 p-0.5 rounded">{address?.substring(0,6)}...{address?.substring(address.length-4)}</code>.
        <br/>
        {feedback || "Click below to sign in with Lens or create a new profile."}
      </p>
      {
        showSignUpForm &&
        <form className="space-y-4 border-b dark:border-slate-700 pb-6 mb-6">
        <h4 className="text-lg font-medium text-gray-800 dark:text-slate-200">Create a New Lens Profile</h4>
        <div>
          <label htmlFor="lensHandle" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Desired Handle (e.g., yourname)
          </label>
          <input
            type="text"
            id="lensHandle"
            value={usernameSignUp}
            onChange={(e) => setUsernameSignUp(e.target.value)}
            name="lensHandle"
            placeholder="yourcoolhandle"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            pattern="[a-z0-9-_]{5,31}"
            title="5-31 chars, lowercase letters, numbers, hyphens, underscores."
          />
           <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Choose a unique handle for your new profile (5-31 chars, a-z, 0-9, -, _).
          </p>
        </div>
        <div>
  
        </div>
      </form>
      }
      <form onSubmit={handleLoginOrCreateWithLens} className="space-y-4">
        {/* Removed handle input as the provided login flow doesn't use it directly */}
        {/* If you want to specify a handle for creation, client.login might need different params or you'd use client.createProfile first */}

        {feedback && !(feedback.startsWith("ℹ️") || feedback.startsWith("Processing") || feedback.startsWith("Checking")) && (
          <p className={`text-sm p-2 rounded-md ${feedback.startsWith('✅') ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            {feedback}
          </p>
        )}

        <div>
          <button
            type="submit" // Changed from onClick to type="submit" for form submission
            disabled={isLoading || !isConnected } // Only disable if loading or not connected
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:text-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing with Lens...
                </>
            ) : 
             sessionClient && !activeLensProfile ?
             "Sign Up" : 
             'Login / Create Lens Profile'
            }
          </button>
        </div>
      </form>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        This will use your connected wallet to sign into Lens. If you don't have a profile linked yet, this may initiate profile creation.
      </p>
    </div>
  );
}