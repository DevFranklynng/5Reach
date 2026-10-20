"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  MessageSquare,
  Settings,
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
    <aside className="hidden md:flex w-[240px] min-h-screen bg-[#202326] border-r border-[#2A2C30] flex-col overflow-hidden sticky top-0">
      <div className="p-5 border-b border-[#2A2C30]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E8793E]/10 flex items-center justify-center">
            <span className="text-[#E8793E] font-semibold text-sm">5R</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F3EFE8] truncate">5Reach</p>
          </div>
        </div>
      </div>
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2A2C30] transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#E8793E]/10 flex items-center justify-center">
            <User className="w-4 h-4 text-[#E8793E]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#F3EFE8] truncate">Admin</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 pb-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[#E8793E]/10 text-[#F3EFE8] border-l-2 border-[#E8793E]"
                  : "text-[#92979D] hover:bg-[#2A2C30] hover:text-[#F3EFE8]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#E8793E]" : ""}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-[#2A2C30] mt-auto">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#92979D] hover:bg-[#2A2C30] hover:text-[#F3EFE8] transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
