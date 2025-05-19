// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import useSessionClient from '../lib/useSessionClient';
import { useAppContext } from '../context/useAppState';
import styles from './Navbar.module.css';

const menuItems = [
  { label: 'Home', href: '/' },
  { label: 'Create Task', href: '/ask' },
  { label: 'My Tasks', href: '/questions' },
  { label: 'My Answers', href: '/answers' },

];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { state } = useAppContext();
  const pathname = usePathname();

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName!,
    chainId: 1,
    enabled: Boolean(ensName),
  });

  // const { activeLensProfile } = useSessionClient();

  console.log("state",state);

  let displayHandle = "lensprofile";
  displayHandle = state.stateActiveLensProfile?.username?.localName;

  
  const {
    activeLensProfile,
    isCheckingLensSession,
  } = useSessionClient();

  console.log("displayHandle", displayHandle)


  const [lensAvatar, setLensAvatar] = useState<string>();

  // avoid SSR/client mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // pull in Lens avatar once we know the profile URI
  useEffect(() => {
    if (activeLensProfile?.metadataUri) {
      fetch(activeLensProfile.metadataUri)
        .then((res) => res.json())
        .then((json) => {
          if (json.avatar) setLensAvatar(json.avatar);
        })
        .catch(console.error);
    }
  }, [activeLensProfile]);

  const toggleMenu = () => setIsOpen((o) => !o);
  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
  };

  // SSR placeholder
  if (!isMounted) {
    return (
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/homepage">LensTask</Link>
        </div>
        <ul className={`${styles.menuLinks} ${styles.menuLinksMinimal}`}>
          {menuItems.map((item) => (
            <li key={item.href} className={styles.menuItem}>
              <Link href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            </li>
          ))}
          <li className={`${styles.menuItem} ${styles.authButtonsContainer}`}>
            <div className={styles.connectButtonPlaceholder}>
              Loading Wallet...
            </div>
          </li>
        </ul>
      </nav>
    );
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/homepage">LensTask</Link>
      </div>

      {/* Mobile hamburger */}
      <button
        className={styles.hamburger}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        {isOpen ? (
          // X / close icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          // Hamburger icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 7h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M3 12h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M3 17h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      <ul className={`${styles.menuLinks} ${isOpen ? styles.open : ''}`}>
        {menuItems.map((item) => (
          <li
            key={item.href}
            className={styles.menuItem}
            onClick={() => setIsOpen(false)}
          >
            <Link
              href={item.href}
              className={`${styles.navLink} ${
                pathname === item.href ? styles.activeLink : ''
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}

        {/* Wallet + ENS + Lens profile */}
        <li className={`${styles.menuItem} ${styles.authButtonsContainer}`}>
          <ConnectKitButton />

          {isConnected && (
            <div className={styles.profileDisplayDesktopOnly}>
              {/* Prefer Lens avatar, fall back to ENS */}
              {(lensAvatar || ensAvatar) && (
                <img
                  src={lensAvatar ?? ensAvatar!}
                  alt={
                    lensAvatar
                      ? `@${displayHandle}`
                      : ensName || 'Avatar'
                  }
                  className={styles.ensAvatarSmall}
                />
              )}

              {/* ENS name or trimmed address */}
              {/* <span className={styles.addressDisplaySmall}>
                {ensName ??
                  `${address!.substring(0, 5)}...${address!.substring(
                    address!.length - 3
                  )}`}
              </span> */}

              {/* Lens handle link */}
              {displayHandle && (
                <Link
                  href={`/u/${displayHandle}`}
                  className={styles.lensProfileLink}
                  onClick={() => setIsOpen(false)}
                >
                  @{displayHandle}
                </Link>
              )}

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className={styles.disconnectButtonSmall}
                title="Disconnect Wallet"
              >
                ⎋
              </button>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
}
