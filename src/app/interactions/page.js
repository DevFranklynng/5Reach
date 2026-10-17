"use client";

import { DashboardShell } from '@/components/layout/DashboardShell';
import { useState } from 'react';
import { Search, Filter } from 'lucide-react';

const initialInteractions = [
  { id: 1, contactName: 'Sarah Johnson', channel: 'email', subject: 'Q1 Outreach', details: 'Email sent to prospect', status: 'sent', date: '2026-10-15', time: '10:30 AM' },
  { id: 2, contactName: 'Mike Davis', channel: 'sms', subject: 'Product Demo', details: 'SMS delivered successfully', status: 'delivered', date: '2026-10-15', time: '11:15 AM' },
  { id: 3, contactName: 'Lisa Chen', channel: 'email', subject: 'Follow-up', details: 'Reply received', status: 'completed', date: '2026-10-15', time: '02:45 PM' },
  { id: 4, contactName: 'John Smith', channel: 'call', subject: 'Discovery Call', details: 'Call completed', status: 'completed', date: '2026-10-14', time: '03:20 PM' },
];

export default function InteractionsPage() {
  const [interactions] = useState(initialInteractions);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const filteredInteractions = interactions.filter((interaction) => {
    const matchesSearch = 
      interaction.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === 'all' || interaction.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || interaction.status === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  return (
    <DashboardShell title="Interactions">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search interactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="call">Call</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredInteractions.map((interaction) => (
                  <tr key={interaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{interaction.contactName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">{interaction.channel}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{interaction.subject}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-[250px]">{interaction.details}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        interaction.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : interaction.status === 'delivered'
                          ? 'bg-blue-100 text-blue-800'
                          : interaction.status === 'sent'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {interaction.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{interaction.date} {interaction.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredInteractions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No interactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}