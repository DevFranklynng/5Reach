"use client";

import { DashboardShell } from '@/components/layout/DashboardShell';
import { useState } from 'react';
import { Search } from 'lucide-react';

const initialInteractions = [];

export default function InteractionsPage() {
  const [interactions] = useState(initialInteractions);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredInteractions = interactions.filter((interaction) => {
    const matchesSearch = 
      (interaction.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (interaction.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (interaction.details?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesChannel = channelFilter === 'all' || interaction.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || interaction.status === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  return (
    <DashboardShell title="Interactions">
      <div className="space-y-6">
        <div className="bg-[#202326] border border-[#2A2C30] rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#92979D]" />
              <input
                type="text"
                placeholder="Search interactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#151719] border border-[#2A2C30] rounded-lg text-sm text-[#F3EFE8] placeholder-[#92979D] focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:border-transparent"
              />
            </div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 bg-[#151719] border border-[#2A2C30] rounded-lg text-sm text-[#F3EFE8] focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:border-transparent"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="call">Call</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#151719] border border-[#2A2C30] rounded-lg text-sm text-[#F3EFE8] focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[#2A2C30]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Contact</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Channel</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Subject</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Details</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredInteractions.map((interaction) => (
                  <tr key={interaction.id} className="border-b border-[#2A2C30] hover:bg-[#2A2C30]/50">
                    <td className="py-3 px-4 text-sm font-medium text-[#F3EFE8]">{interaction.contactName}</td>
                    <td className="py-3 px-4 text-sm text-[#92979D] capitalize">{interaction.channel}</td>
                    <td className="py-3 px-4 text-sm text-[#92979D]">{interaction.subject}</td>
                    <td className="py-3 px-4 text-sm text-[#92979D] truncate max-w-[250px]">{interaction.details}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        interaction.status === 'completed' 
                          ? 'bg-[#72B89A]/10 text-[#72B89A]' 
                          : interaction.status === 'delivered'
                          ? 'bg-[#72B89A]/10 text-[#72B89A]'
                          : interaction.status === 'sent'
                          ? 'bg-[#E8793E]/10 text-[#E8793E]'
                          : interaction.status === 'failed'
                          ? 'bg-[#E8793E]/10 text-[#E8793E]'
                          : 'bg-[#92979D]/10 text-[#92979D]'
                      }`}>
                        {interaction.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#92979D]">{interaction.date} {interaction.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredInteractions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[#92979D]">No interactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
