import React from 'react';
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-xl font-bold text-gray-800">
              Baby Name Finder
            </Link>
          </div>

          <div className="flex space-x-6">
            <Link href="/search" className="text-gray-600 hover:text-gray-900">
              Search
            </Link>
            <Link href="/favorites" className="text-gray-600 hover:text-gray-900">
              Favorites
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}