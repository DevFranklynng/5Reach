"use client";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function DashboardShell({ children, title }) {
  return (
    <div className="flex min-h-screen bg-[#151719]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 p-3 md:p-4 gap-3 md:gap-4">
        <Navbar title={title} />
        <main className="flex-1 overflow-auto pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
