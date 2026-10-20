"use client";

import { DashboardShell } from '@/components/layout/DashboardShell';
import { useState } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';

const initialCampaigns = [];

const contacts = [];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'email',
    scheduledAt: '',
  });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState('');

  const filteredRecipients = contacts.filter((contact) => {
    const matchesSearch = 
      (contact.firstName?.toLowerCase().includes(recipientSearch.toLowerCase()) || false) ||
      (contact.lastName?.toLowerCase().includes(recipientSearch.toLowerCase()) || false) ||
      (contact.email?.toLowerCase().includes(recipientSearch.toLowerCase()) || false) ||
      (contact.company?.toLowerCase().includes(recipientSearch.toLowerCase()) || false);
    return matchesSearch;
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || selectedRecipients.length === 0) return;
    setIsLoading(true);
    setTimeout(() => {
      const newCampaign = {
        id: campaigns.length > 0 ? Math.max(...campaigns.map((c) => c.id)) + 1 : 1,
        name: formData.name,
        description: formData.description,
        channel: formData.channel,
        status: 'draft',
        recipients: selectedRecipients.length,
        scheduledAt: formData.scheduledAt || null,
      };
      setCampaigns([...campaigns, newCampaign]);
      setIsLoading(false);
      setIsFormOpen(false);
      setFormData({ name: '', description: '', channel: 'email', scheduledAt: '' });
      setSelectedRecipients([]);
    }, 300);
  };

  const handleSelectRecipient = (contactId) => {
    if (selectedRecipients.includes(contactId)) {
      setSelectedRecipients(selectedRecipients.filter((id) => id !== contactId));
    } else {
      setSelectedRecipients([...selectedRecipients, contactId]);
    }
  };

  const handleSelectAllRecipients = () => {
    if (selectedRecipients.length === filteredRecipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredRecipients.map((c) => c.id));
    }
  };

  return (
    <DashboardShell title="Campaigns">
      <div className="space-y-6">
        <div className="bg-[#202326] border border-[#2A2C30] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#F3EFE8]">Campaigns</h2>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#E8793E] text-white rounded-lg text-sm font-medium hover:bg-[#d66a2f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:ring-offset-2 focus:ring-offset-[#202326]"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-[#2A2C30]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Channel</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Recipients</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[#92979D] uppercase tracking-wider">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-[#2A2C30] hover:bg-[#2A2C30]/50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-[#F3EFE8]">{campaign.name}</p>
                      <p className="text-xs text-[#92979D]">{campaign.description}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#92979D] capitalize">{campaign.channel}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        campaign.status === 'active' 
                          ? 'bg-[#72B89A]/10 text-[#72B89A]' 
                          : campaign.status === 'completed'
                          ? 'bg-[#72B89A]/10 text-[#72B89A]'
                          : campaign.status === 'draft'
                          ? 'bg-[#92979D]/10 text-[#92979D]'
                          : 'bg-[#E8793E]/10 text-[#E8793E]'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#92979D]">{campaign.recipients}</td>
                    <td className="py-3 px-4 text-sm text-[#92979D]">{campaign.scheduledAt || 'Not scheduled'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[#92979D]">No campaigns found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#202326] border border-[#2A2C30] rounded-xl max-w-2xl w-full p-6 my-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-[#F3EFE8] mb-4">Create Campaign</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F3EFE8] mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#151719] border border-[#2A2C30] rounded-lg text-sm text-[#F3EFE8] placeholder-[#92979D] focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F3EFE8] mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#151719] border border-[#2A2C30] rounded-lg text-sm text-[#F3EFE8] placeholder-[#92979D] focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:border-transparent"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#F3EFE8] mb-1">Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-[#151719] border border-[#2A2C30] rounded-lg text-sm text-[#F3EFE8] focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:border-transparent"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F3EFE8] mb-1">Schedule Date</label>
                  <input
                    type="date"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 bg-[#151719] border border-[#2A2C30] rounded-lg text-sm text-[#F3EFE8] focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-[#F3EFE8]">Select Recipients *</label>
                  <p className="text-xs text-[#92979D]">{selectedRecipients.length} selected</p>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#92979D]" />
                  <input
                    type="text"
                    placeholder="Search recipients..."
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#151719] border border-[#2A2C30] rounded-lg text-sm text-[#F3EFE8] placeholder-[#92979D] focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:border-transparent"
                  />
                </div>
                <div className="border border-[#2A2C30] rounded-lg max-h-60 overflow-y-auto bg-[#151719]">
                  <div className="p-3 border-b border-[#2A2C30] bg-[#202326]">
                    <label className="flex items-center gap-2 text-sm font-medium text-[#F3EFE8]">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.length === filteredRecipients.length && filteredRecipients.length > 0}
                        onChange={handleSelectAllRecipients}
                        className="rounded border-[#2A2C30] bg-[#151719] text-[#E8793E] focus:ring-[#E8793E]"
                      />
                      Select All ({filteredRecipients.length})
                    </label>
                  </div>
                  {filteredRecipients.length === 0 && contacts.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-[#92979D]">No recipients available</p>
                    </div>
                  ) : filteredRecipients.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-[#92979D]">No recipients found</p>
                    </div>
                  ) : (
                    filteredRecipients.map((contact) => (
                      <div key={contact.id} className="p-3 border-b border-[#2A2C30] last:border-b-0">
                        <label className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRecipients.includes(contact.id)}
                            onChange={() => handleSelectRecipient(contact.id)}
                            className="mt-0.5 rounded border-[#2A2C30] bg-[#151719] text-[#E8793E] focus:ring-[#E8793E]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#F3EFE8]">{contact.firstName} {contact.lastName}</p>
                            <p className="text-xs text-[#92979D]">{contact.email} • {contact.company}</p>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!formData.name || selectedRecipients.length === 0 || isLoading}
                  className="flex-1 px-4 py-2 bg-[#E8793E] text-white rounded-lg text-sm font-medium hover:bg-[#d66a2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:ring-offset-2 focus:ring-offset-[#202326]"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 bg-transparent border border-[#2A2C30] text-[#F3EFE8] rounded-lg text-sm font-medium hover:bg-[#2A2C30] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8793E] focus:ring-offset-2 focus:ring-offset-[#202326]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
