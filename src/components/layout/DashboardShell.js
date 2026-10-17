"use client";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function DashboardShell({ children, title }) {
  return (
    <div className="flex min-h-screen bg-[#D0DCE7] p-3 md:p-4 gap-3 md:gap-4">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} />
        <main className="flex-1 overflow-auto mt-4 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}