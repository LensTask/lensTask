import { useState, useEffect } from 'react';

import { fetchAccount,fetchAccountsAvailable,createAccountWithUsername } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { evmAddress } from "@lens-protocol/client";
import { uri } from "@lens-protocol/client";
import { never } from "@lens-protocol/client";
import { storageClient } from "./storage-client";
import { client } from "./client";
import { useAccount, useSignMessage,useWalletClient } from 'wagmi';

const useSessionClient = () => {
    const { address, isConnected, isConnecting } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { data: walletClient } = useWalletClient();

    const [sessionClient, setSessionClient] = useState();
    const [activeLensProfile, setActiveLensProfile] = useState(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isCheckingLensSession, setIsCheckingLensSession] = useState(true);

    const [isPosting, setIsPosting] = useState(false); 
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
            const resumed = await client.resumeSession();
            console.log(resumed);
            if (resumed.isErr()) {
                console.error(resumed.error);
            }
            let sessionClient;
            if(!resumed || resumed.isErr()){
                const loginResult = await client.login({
                    onboardingUser: {
                        wallet: address as `0x${string}`, // Ensure address is in `0x...` format
                    },
                    signMessage: async (message: string) => {
                        console.log("[ProfileCreator] Signing Lens challenge...");
                        return signMessageAsync({ message }); // Use wagmi's signMessageAsync
                    },
                });
                sessionClient = loginResult.value
            } else {
                sessionClient = resumed.value;;
            }

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
    useEffect(() => {
        checkCurrentLensSession();
    },[isConnected, address])
    return({
        sessionClient,
        activeLensProfile,
        feedback,
        isCheckingLensSession,
        handleLoginOrCreateWithLens,
        handleProfileCreation,
        checkCurrentLensSession
    })
}

export default useSessionClient;