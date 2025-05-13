// components/LoginButton.tsx
'use client';

import {
  useLogin,
  useLogout,
  useProfilesManaged,
  useSession,
  Profile,
  SessionType,
} from '@lens-protocol/react-web';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useState, useEffect } from 'react';
import CreateProfileForm from './CreateProfileForm'; // Import the new form

export default function LoginButton() {
  const { execute: login, error: loginError, isPending: isLoginPending } = useLogin();
  const { execute: logout, isPending: isLogoutPending } = useLogout();
  const { data: session, loading: isSessionLoading } = useSession();

  const { address, isConnected, chain: activeChain } = useAccount();
  const { disconnectAsync } = useDisconnect();

  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showCreateProfileForm, setShowCreateProfileForm] = useState(false);

  const { data: managedProfiles, loading: isLoadingManagedProfiles, refetch: refetchManagedProfiles } = useProfilesManaged({
    for: address,
    includeOwned: true,
  });

  useEffect(() => {
    if (session?.type === SessionType.WithProfile && session.profile) {
      setSelectedProfile(session.profile);
      setShowProfileSelector(false);
      setShowCreateProfileForm(false); // Hide create form if logged in
    } else if (isConnected && managedProfiles && managedProfiles.length === 1 && !selectedProfile && !session?.profile) {
      setSelectedProfile(managedProfiles[0]);
    } else if (!isConnected) {
      setSelectedProfile(null);
      setShowProfileSelector(false);
      setShowCreateProfileForm(false);
    }
  }, [session, managedProfiles, selectedProfile, isConnected]);

  const handleLensLogin = async (profileToLogin: Profile) => {
    if (!address) return;
    setSelectedProfile(profileToLogin);
    setShowProfileSelector(false);
    const result = await login({ address: address, profileId: profileToLogin.id });
    if (result.isFailure()) {
      console.error('Lens login failed:', result.error);
      alert(`Lens Login Failed: ${result.error.message}`);
      setSelectedProfile(null);
    } else {
      setShowCreateProfileForm(false); // Hide create form after successful login
    }
  };

  const handleFullLogout = async () => {
    await logout();
    await disconnectAsync();
    setSelectedProfile(null);
    setShowProfileSelector(false);
    setShowCreateProfileForm(false);
  };

  const onProfileCreated = async (newProfileId: string) => {
    setShowCreateProfileForm(false);
    // Refetch managed profiles to include the new one
    const { data: newProfiles } = await refetchManagedProfiles();
    if (newProfiles) {
      const newlyCreatedProfile = newProfiles.find(p => p.id === newProfileId || p.ownedBy.address.toLowerCase() === address?.toLowerCase()); // Heuristic
      if (newlyCreatedProfile) {
        handleLensLogin(newlyCreatedProfile); // Attempt to login with the new profile
      } else if (newProfiles.length > 0) {
        // Fallback if direct match fails, prompt selection or auto-select first.
         setSelectedProfile(newProfiles[0]); // Auto-select the first one for now
         setShowProfileSelector(true); // Or prompt user to select if multiple exist now
      }
    }
  };


  if (isSessionLoading) {
    return <div className="px-3 py-2 text-sm text-gray-400">Loading Session...</div>;
  }

  if (isConnected && session?.type === SessionType.WithProfile) {
    return (
      <div className="flex items-center space-x-2">
        <ConnectKitButton.Custom>
          {({ show, truncatedAddress }) => (
            <button onClick={show} className="btn btn-secondary px-3 py-2 text-sm flex items-center">
              <img src={`https://cdn.stamp.fyi/avatar/eth:${session.profile.ownedBy.address}?s=24`} alt="avatar" className="w-6 h-6 rounded-full mr-2"/>
              @{session.profile.handle?.fullHandle || truncatedAddress}
            </button>
          )}
        </ConnectKitButton.Custom>
        <button onClick={handleFullLogout} disabled={isLogoutPending} className="btn btn-secondary px-3 py-2 text-sm bg-red-500 hover:bg-red-600">
          {isLogoutPending ? 'Logging out...' : 'Log Out'}
        </button>
      </div>
    );
  }

  if (isConnected && address && session?.type !== SessionType.WithProfile) {
    // If showing create profile form, render it exclusively below ConnectKit button
    if (showCreateProfileForm) {
      return (
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2 mb-2">
             <ConnectKitButton.Custom>
              {({ show, truncatedAddress }) => (
                <button onClick={show} className="btn btn-secondary px-3 py-2 text-sm">
                  {truncatedAddress} {activeChain && activeChain.id !== (process.env.NODE_ENV === 'development' ? 37111 : 137) && activeChain.id !== 80001 &&
                  <span className="ml-1 text-xs text-yellow-400">(Wrong Net)</span>}
                </button>
              )}
            </ConnectKitButton.Custom>
            <button onClick={() => setShowCreateProfileForm(false)} className="text-xs text-gray-400 hover:text-white">Cancel Creation</button>
          </div>
          <CreateProfileForm onProfileCreated={onProfileCreated} ownerAddress={address} />
        </div>
      );
    }

    // Default view when connected but not logged into Lens
    return (
      <div className="flex items-center space-x-2">
        <ConnectKitButton.Custom>
          {({ show, truncatedAddress }) => (
            <button onClick={show} className="btn btn-secondary px-3 py-2 text-sm">
              {truncatedAddress} {activeChain && activeChain.id !== (process.env.NODE_ENV === 'development' ? 37111 : 137) && activeChain.id !== 80001 &&
              <span className="ml-1 text-xs text-yellow-400">(Wrong Net)</span>}
            </button>
          )}
        </ConnectKitButton.Custom>

        {isLoadingManagedProfiles && <span className="text-sm text-gray-400">Loading profiles...</span>}

        {!isLoadingManagedProfiles && managedProfiles && managedProfiles.length > 0 && (
          <div className="relative group">
            <button
              onClick={() => managedProfiles.length === 1 ? handleLensLogin(managedProfiles[0]) : setShowProfileSelector(!showProfileSelector)}
              className="btn btn-primary px-3 py-2 text-sm"
              disabled={isLoginPending}
            >
              {isLoginPending ? 'Signing In...' : (managedProfiles.length === 1 ? `Login as @${managedProfiles[0].handle?.localName}`: 'Login with Profile')}
            </button>
            {showProfileSelector && managedProfiles.length > 1 && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-700 rounded-md shadow-lg p-1 z-20">
                <p className="text-xs px-2 py-1 text-gray-300">Select profile:</p>
                {managedProfiles.map((p) => (
                  <button key={p.id} onClick={() => handleLensLogin(p)} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-600 rounded">
                    @{p.handle?.fullHandle || p.id.substring(0,10)+'...' }
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoadingManagedProfiles && managedProfiles?.length === 0 && (
          <div className="flex flex-col items-start">
            <span className="text-xs text-yellow-400 mb-1">No Lens profiles found.</span>
            <button onClick={() => setShowCreateProfileForm(true)} className="btn btn-primary btn-sm px-2 py-1 text-xs bg-green-600 hover:bg-green-700">
              Create Profile
            </button>
          </div>
        )}
        {loginError && <p className="text-xs text-red-400">{loginError.message}</p>}
      </div>
    );
  }

  return <ConnectKitButton />;
}
