"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  MessageSquare,
  Settings,
  ChevronDown,
  User,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Campaigns", href: "/campaigns", icon: Mail },
  { name: "Interactions", href: "/interactions", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="hidden md:flex w-[220px] h-full bg-white rounded-2xl shadow-sm border border-gray-100 flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">User</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-gray-100">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}