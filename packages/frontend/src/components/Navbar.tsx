'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import {
  useSession,
  useLogin,
  useLogout,
  SessionType,
  useProfiles,
  LimitType,
} from '@lens-protocol/react-web';
import styles from './Navbar.module.css';

// Define your App ID here as it's used in the login request
const LENS_APP_ID = 'test-lens-1'; // Match this with your metadata APP_ID

const menuItems = [
  { label: 'Home', href: '/' },
  { label: 'Ask', href: '/ask' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { data: session, loading: sessionLoading } = useSession();
  const { execute: login, loading: loginLoading, error: loginError } = useLogin();
  const { execute: logout, loading: logoutLoading } = useLogout();

  const { data: ownedProfiles, loading: profilesLoading } = useProfiles({
    limit: LimitType.Ten,
    where: {
      ownedBy: [address || ''],
    },
    enabled: !!isConnected && !!address,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async () => {
    if (!address) {
      console.warn("Navbar: Wallet not connected for Lens login");
      return;
    }

    console.log("Navbar: Attempting Lens login for address:", address);
    if (profilesLoading) {
      console.log("Navbar: Waiting for owned profiles to load...");
      return;
    }

    let profileToLogin;
    if (ownedProfiles && ownedProfiles.length > 0) {
      profileToLogin = ownedProfiles[0];
      console.log(`Navbar: Found ${ownedProfiles.length} profiles. Attempting to log in with profile ID:`, profileToLogin.id, "Handle:", profileToLogin.handle?.fullHandle);
    } else {
      console.warn("Navbar: No Lens profiles found for address:", address, "on the current network (Lens Testnet). Cannot proceed to profile login.");
    }

    try {
      const result = await login({ 
        address, 
        profileId: profileToLogin?.id,
        // Explicitly pass the App ID here, aligning with tutorial's emphasis
        // The 'app' parameter for useLogin might accept your LENS_APP_ID directly, 
        // or it might require a specific App Address from the Lens API.
        // For @lens-protocol/react-web, the LENS_APP_ID is often implicitly linked.
        // Let's try defining it as a string, if the SDK expects it.
        // If this still doesn't work, the 'app' field might need the specific EvmAddress of a Lens App deployed onchain.
        // For now, we use the app ID from our metadata.
        // (NOTE: The  hook's  parameter may take a specific EvmAddress,
        // not just your string APP_ID. If so, this step might still not be correct for 's ).
        // This specific part is different between  and  direct login.
        // For 's , the  parameter is often omitted or takes an EvmAddress.
        // Let's try the provided test app address as a last ditch effort for this param.
        // If your app has its own deployed Lens App onchain, use its address.
        // For Lens Testnet, the generic app address is 0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7.
        app: "0xC75A89145d765c396fd75CbD16380Eb184Bd2ca7", // TESTNET APP ADDRESS from tutorial
      });
      
      if (result.isSuccess()) {
        console.log("Navbar: Lens login successful. Session:", result.value);
      } else {
        console.error("Navbar: Lens login failed:", result.error.message);
        if (result.error.name === 'UserRejectedError') {
            alert("Login request rejected in wallet.");
        } else {
            alert(`Lens login error: ${result.error.message}`);
        }
      }
    } catch (error: any) {
      console.error("Navbar: Lens login exception:", error);
      alert(`Lens login exception: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Navbar: Lens logout successful.");
    } catch (error) {
      console.error("Navbar: Lens logout failed:", error);
    }
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  if (!isMounted) {
    return (
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/">test-lens-1</Link>
        </div>
      </nav>
    );
  }
  
  const canAttemptLogin = isConnected && !sessionLoading && session?.type !== SessionType.WithProfile && !loginLoading;

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">test-lens-1</Link>
      </div>

      <button
        className={styles.hamburger}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
      </button>

      <ul className={`${styles.menuLinks} ${isOpen ? styles.open : ''}`}>
        {menuItems.map((item) => (
          <li key={item.href} onClick={() => setIsOpen(false)}>
            <Link
              href={item.href}
              className={pathname === item.href ? styles.activeLink : ''}
            >
              {item.label}
            </Link>
          </li>
        ))}

        <li className="ml-auto flex items-center gap-2 flex-col md:flex-row md:ml-4 mt-4 md:mt-0">
          <ConnectKitButton />

          {sessionLoading && isConnected && <span className="text-sm text-gray-400 px-3 py-1.5">Session...</span>}
          {profilesLoading && isConnected && !sessionLoading && <span className="text-sm text-gray-400 px-3 py-1.5">Profiles...</span>}
          
          {canAttemptLogin && (
            <button
              onClick={handleLogin}
              disabled={loginLoading || profilesLoading}
              className="btn btn-secondary px-3 py-1.5 text-sm rounded-md"
            >
              {loginLoading ? 'Logging in...' : (profilesLoading ? 'Checking Profiles...' : 'Login with Lens')}
            </button>
          )}

          {session?.type === SessionType.WithProfile && session.profile && (
            <div className="flex items-center gap-2 flex-col md:flex-row">
               <Link href={session.profile.handle?.fullHandle ? `/profile/lens/${session.profile.handle.fullHandle.replace('/', '.')}` : `/profile/lens/${session.profile.id}`}
                    className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-gray-700">
                    @{session.profile.handle?.localName || session.profile.id.substring(0,6)}
                </Link>
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="btn btn-outline border border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-1.5 text-sm rounded-md"
              >
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
          {loginError && <p className="text-xs text-red-400">Login failed: {loginError.message}</p>}
        </li>
      </ul>
    </nav>
  );
}
