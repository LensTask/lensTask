// src/contexts/AuthContext.tsx  (or your preferred path)
"use client"; // <-- VERY IMPORTANT FOR NEXT.JS APP ROUTER

import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
  ReactNode,
} from 'react';
import { useAccount } from 'wagmi';
// import { useSignMessage, useWalletClient } from 'wagmi'; // Include if needed
import useSessionClient from "../lib/useSessionClient"; // Ensure this path is correct

// --- Define Types ---
// Replace 'any' with actual specific types from your libraries for better type safety
interface LensProfile {
  // Example: id: string; handle: string; did: string;
  [key: string]: any;
}

interface SessionClient {
  // Example: isAuthenticated(): Promise<boolean>; getProfile(): Promise<LensProfile | null>;
  [key: string]: any;
}

interface AuthContextType {
  stateSessionClient: SessionClient | null;
  stateActiveLensProfile: LensProfile | null;
  isLoadingSession: boolean; // Added for better UX
  // You might want to expose the check function if components need to trigger it manually
  // refreshSession: () => Promise<void>;
}

// Initialize with undefined to robustly check if used outside a provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [stateSessionClient, setStateSessionClient] = useState<SessionClient | null>(null);
  const [stateActiveLensProfile, setStateActiveLensProfile] = useState<LensProfile | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true); // Start as true

  const { address, isConnected } = useAccount(); // isConnected can be useful

  const {
    sessionClient,
    activeLensProfile,
    checkCurrentLensSession,
  } = useSessionClient(); // Assuming this hook provides these

  useMemo(async () => {

    // Only attempt to check session if connected and checkCurrentLensSession is available
    if (address) {
      setIsLoadingSession(true);
      await checkCurrentLensSession();
      setIsLoadingSession(false);
    } else {
      // If not connected, clear session data and stop loading
      setStateSessionClient(null);
      setStateActiveLensProfile(null);
      setIsLoadingSession(false);
    }
  }, [address]); // Add isConnected and function to dependencies

  useEffect(() => {
    if(sessionClient){
      setStateSessionClient(sessionClient);
    }
  }, [sessionClient]);

  useEffect(() => {
    console.log(activeLensProfile)
    if(activeLensProfile){
      setStateActiveLensProfile(activeLensProfile);
    }
  }, [activeLensProfile]);

  const contextValue: AuthContextType = {
    stateSessionClient,
    stateActiveLensProfile,
    isLoadingSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};