// src/contexts/AuthContext.tsx
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
interface LensProfile {
  [key: string]: any;
}

interface SessionClient {
  [key: string]: any;
}

interface AuthContextType {
  stateSessionClient: SessionClient | null;
  stateActiveLensProfile: LensProfile | null;
  isLoadingSession: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [stateSessionClient, setStateSessionClient] = useState<SessionClient | null>(null);
  const [stateActiveLensProfile, setStateActiveLensProfile] = useState<LensProfile | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  const { address, isConnected } = useAccount(); // isConnected can be useful

  const {
    sessionClient,
    activeLensProfile,
    checkCurrentLensSession,
  } = useSessionClient(); // Assuming this hook provides these

  // --- DEBUG LOGS ---
  const log = (...args: any[]) => console.log('[appstate]', ...args);

  log('AuthProvider render:', { address, isConnected, sessionClient, activeLensProfile });

  useEffect(() => {
    log('useMemo called with address:', address);
    if (address) {
      log('Wallet address present. Starting Lens session check.');
      setIsLoadingSession(true);
      setStateActiveLensProfile(null)
      checkCurrentLensSession().then(() => {
        setIsLoadingSession(false);
      });
    } else {
      log('No address found. Clearing state.');
      setStateSessionClient(null);
      setStateActiveLensProfile(null);
      setIsLoadingSession(false);
    }
  }, [address, isConnected]); // Only when address or isConnected changes. We need both because address might already be set when isConnected is still false.

  useEffect(() => {
    log('useEffect [sessionClient]', sessionClient);
    if(sessionClient){
      setStateSessionClient(sessionClient);
      log('stateSessionClient updated:', sessionClient);
    }
  }, [sessionClient]);

  useEffect(() => {
    log('useEffect [activeLensProfile]', activeLensProfile);
    if(activeLensProfile){
      setStateActiveLensProfile(activeLensProfile);
      log('stateActiveLensProfile updated:', activeLensProfile);
    }
  }, [activeLensProfile]);

  useEffect(() => {
    log('isLoadingSession changed:', isLoadingSession);
  }, [isLoadingSession]);

  const contextValue: AuthContextType = {
    stateSessionClient,
    stateActiveLensProfile,
    isLoadingSession,
  };

  log('Providing AuthContext value:', contextValue);

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
  console.log('[appstate] useAuth hook called:', context);
  return context;
};
