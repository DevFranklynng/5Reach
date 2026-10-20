"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, Bell, X, LayoutDashboard, Users, Mail, MessageSquare, Settings, User } from "lucide-react";

export function Navbar({ title }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="bg-[#202326] border border-[#2A2C30] rounded-xl px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#2A2C30] text-[#F3EFE8]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-[#F3EFE8]">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#92979D]" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-[#151719] border border-[#2A2C30] rounded-lg text-sm text-[#F3EFE8] placeholder-[#92979D] focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:border-transparent w-48 md:w-64"
            />
          </div>
          <button className="p-2 rounded-lg hover:bg-[#2A2C30] text-[#92979D] hover:text-[#F3EFE8]" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#E8793E]/10 flex items-center justify-center">
            <User className="w-4 h-4 text-[#E8793E]" />
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-2 border-t border-[#2A2C30] pt-4">
          <nav className="space-y-2">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#92979D] hover:bg-[#2A2C30] hover:text-[#F3EFE8]">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/contacts" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#92979D] hover:bg-[#2A2C30] hover:text-[#F3EFE8]">
              <Users className="w-4 h-4" />
              Contacts
            </Link>
            <Link href="/campaigns" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#92979D] hover:bg-[#2A2C30] hover:text-[#F3EFE8]">
              <Mail className="w-4 h-4" />
              Campaigns
            </Link>
            <Link href="/interactions" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#92979D] hover:bg-[#2A2C30] hover:text-[#F3EFE8]">
              <MessageSquare className="w-4 h-4" />
              Interactions
            </Link>
            <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#92979D] hover:bg-[#2A2C30] hover:text-[#F3EFE8]">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
