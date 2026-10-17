"use client";

import { useState } from "react";
import Link from "next/link";

export function Navbar({ title }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-50"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-50" aria-label="Notifications">
            🔔
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-2 border-t border-gray-100 pt-4">
          <nav className="space-y-2">
            <Link href="/" className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Dashboard
            </Link>
            <Link href="/contacts" className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Contacts
            </Link>
            <Link href="/campaigns" className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Campaigns
            </Link>
            <Link href="/interactions" className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Interactions
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}