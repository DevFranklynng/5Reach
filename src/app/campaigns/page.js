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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-xs text-gray-500">{campaign.description}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">{campaign.channel}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        campaign.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : campaign.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : campaign.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{campaign.recipients}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{campaign.scheduledAt || 'Not scheduled'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No campaigns found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Campaign</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date</label>
                  <input
                    type="date"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Select Recipients *</label>
                  <p className="text-xs text-gray-500">{selectedRecipients.length} selected</p>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search recipients..."
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.length === filteredRecipients.length && filteredRecipients.length > 0}
                        onChange={handleSelectAllRecipients}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Select All ({filteredRecipients.length})
                    </label>
                  </div>
                  {filteredRecipients.length === 0 && contacts.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500">No recipients available</p>
                    </div>
                  ) : filteredRecipients.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500">No recipients found</p>
                    </div>
                  ) : (
                    filteredRecipients.map((contact) => (
                      <div key={contact.id} className="p-3 border-b border-gray-100 last:border-b-0">
                        <label className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRecipients.includes(contact.id)}
                            onChange={() => handleSelectRecipient(contact.id)}
                            className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                            <p className="text-xs text-gray-500">{contact.email} • {contact.company}</p>
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
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
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