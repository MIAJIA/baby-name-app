'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="font-bold text-xl text-blue-600">
                Baby Name App
              </Link>
            </div>

            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/search"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/search'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Search
              </Link>

              <Link
                href="/analyze"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/analyze'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Analyze Name
              </Link>

              <Link
                href="/favorites"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/favorites'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Favorites
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}