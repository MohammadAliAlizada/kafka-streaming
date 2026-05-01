'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="app-nav">
      <div className="app-nav-brand">⚡ KafkaStream</div>
      <div className="app-nav-links">
        <Link href="/" className={`app-nav-link ${pathname === '/' ? 'active' : ''}`}>
          Event Stream
        </Link>
        <Link href="/analytics" className={`app-nav-link ${pathname === '/analytics' ? 'active' : ''}`}>
          Analytics
        </Link>
      </div>
    </nav>
  );
}
