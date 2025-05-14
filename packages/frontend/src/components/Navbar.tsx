// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import styles from './Navbar.module.css'; // Ensure this path is correct

const menuItems = [
  { label: 'Home', href: '/' },
  { label: 'Ask', href: '/ask' }, // Example route
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // For client-side only rendering logic
  const pathname = usePathname();

  const { address, isConnected, connector } = useAccount(); // connector can give info about connected wallet
  const { disconnect } = useDisconnect();

  // Optional: Fetch ENS name and avatar for connected address
  const { data: ensName } = useEnsName({ address: address, chainId: 1 }); // Specify chainId for mainnet ENS
  const { data: ensAvatar } = useEnsAvatar({ name: ensName!, chainId: 1 }); // Fetch avatar if ensName exists

  useEffect(() => {
    setIsMounted(true); // Component has mounted, safe to use client-side state
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false); // Close mobile menu on disconnect
  };

  // Avoid rendering wallet-dependent UI until client has mounted
  // This helps prevent hydration mismatches
  if (!isMounted) {
    // Render a minimal version or a loading state for the navbar during SSR/pre-hydration
    return (
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/">LensTask</Link>
        </div>
        <ul className={`${styles.menuLinks} ${styles.menuLinksMinimal}`}> {/* Use specific style for minimal links */}
          {menuItems.map((item) => (
            <li key={item.href} className={styles.menuItem}>
              <Link href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            </li>
          ))}
           <li className={`${styles.menuItem} ${styles.authButtonsContainer}`}>
                <div className={styles.connectButtonPlaceholder}>Loading Wallet...</div>
            </li>
        </ul>
        {/* No hamburger on server render to avoid layout shifts if menu structure changes */}
      </nav>
    );
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">LensTask</Link>
      </div>

      {/* Hamburger for mobile */}
      <button
        className={styles.hamburger}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {/* Navigation Links */}
      <ul className={`${styles.menuLinks} ${isOpen ? styles.open : ''}`}>
        {menuItems.map((item) => (
          <li key={item.href} onClick={() => setIsOpen(false)} className={styles.menuItem}>
            <Link
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.activeLink : ''}`}
            >
              {item.label}
            </Link>
          </li>
        ))}

        {/* Wallet Connection and Profile Section */}
        <li className={`${styles.menuItem} ${styles.authButtonsContainer}`}>
          <ConnectKitButton />

          {/* Optional: Custom display when connected, if ConnectKitButton's default isn't enough */}
          {/* This part is mostly handled by ConnectKitButton itself, but shown for an alternative */}
          {isConnected && address && !isOpen && ( // Only show this custom display if menu is NOT open on mobile
            <div className={styles.profileDisplayDesktopOnly}> {/* Style to hide on mobile if ConnectKitButton is preferred there */}
              {ensAvatar && <img src={ensAvatar} alt={ensName || 'ENS Avatar'} className={styles.ensAvatarSmall} />}
              <span className={styles.addressDisplaySmall}>
                {ensName || `${address.substring(0, 5)}...${address.substring(address.length - 3)}`}
              </span>
              <button onClick={handleDisconnect} className={styles.disconnectButtonSmall} title="Disconnect Wallet">
                {/* Optional: Disconnect Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
}