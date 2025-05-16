// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import useSessionClient from '../lib/useSessionClient';
import styles from './Navbar.module.css';

const menuItems = [
  { label: 'Home', href: '/' },
  { label: 'Ask', href: '/ask' },
  { label: 'My Questions', href: '/questions' },

];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lensAvatar, setLensAvatar] = useState<string>();
  const pathname = usePathname();

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName!, chainId: 1 });

  const {
    activeLensProfile,
    isCheckingLensSession,
  } = useSessionClient();

  // Fetch Lens profile avatar from metadata
  useEffect(() => {
    if (activeLensProfile?.metadataUri) {
      fetch(activeLensProfile.metadataUri)
        .then(res => res.json())
        .then(json => {
          if (json.avatar) setLensAvatar(json.avatar);
        })
        .catch(console.error);
    }
  }, [activeLensProfile]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
  };

  // Minimal SSR placeholder
  if (!isMounted) {
    return (
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/">LensTask</Link>
        </div>
        <ul className={`${styles.menuLinks} ${styles.menuLinksMinimal}`}>
          {menuItems.map(item => (
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
        <Link href="/">LensTask</Link>
      </div>

      {/* Mobile hamburger */}
      <button
        className={styles.hamburger}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg /* X icon */>…</svg>
        ) : (
          <svg /* hamburger icon */>…</svg>
        )}
      </button>

      <ul className={`${styles.menuLinks} ${isOpen ? styles.open : ''}`}>
        {menuItems.map(item => (
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
              {/* ENS Avatar or Lens Avatar (prefer Lens) */}
              {(lensAvatar || ensAvatar) && (
                <img
                  src={lensAvatar ?? ensAvatar!}
                  alt={lensAvatar ? `@${activeLensProfile?.username.localName}` : ensName || 'Avatar'}
                  className={styles.ensAvatarSmall}
                />
              )}

              {/* Display ENS name or trimmed address */}
              <span className={styles.addressDisplaySmall}>
                {ensName ||
                  `${address!.substring(0, 5)}...${address!.substring(
                    address!.length - 3
                  )}`}
              </span>

              {/* Lens handle */}
              {activeLensProfile && !isCheckingLensSession && (
                <Link
                  href={`/u/${activeLensProfile.username.localName}`}
                  className={styles.lensProfileLink}
                  onClick={() => setIsOpen(false)}
                >
                  @{activeLensProfile.username.localName}
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
