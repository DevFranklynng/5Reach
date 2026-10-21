"use client";

import { DashboardShell } from '@/components/layout/DashboardShell';
import { useEffect, useState } from 'react';
import { Search, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import {
  createCampaign,
  deleteCampaign,
  listCampaigns,
  listCampaignRecipientContacts,
  listCampaignRecipientIds,
  updateCampaign,
} from '@/lib/campaigns-data';
import {
  campaignStatuses,
  validateCampaignChannel,
  validateCampaignName,
  validateCampaignStatus,
  toScheduledAtIso,
} from '@/lib/campaign-utils';

const campaignPageSize = 1000;

async function fetchAllCampaigns() {
  const campaigns = [];
  let page = 1;
  let pageCount = 1;
  let permissions = null;

  while (page <= pageCount) {
    const result = await listCampaigns({ page, pageSize: campaignPageSize });
    campaigns.push(...result.campaigns);
    permissions ??= result.permissions;
    pageCount = result.pagination.pageCount;
    page += 1;
  }

  return { campaigns, permissions };
}

async function fetchAllRecipientContacts() {
  const contacts = [];
  let page = 1;
  let pageCount = 1;

  while (page <= pageCount) {
    const result = await listCampaignRecipientContacts({ page, pageSize: campaignPageSize });
    contacts.push(...result.contacts);
    pageCount = result.pagination.pageCount;
    page += 1;
  }

  return contacts;
}

function isSignedOutError(error) {
  return error instanceof Error && (
    error.message === 'You must be signed in to access campaigns.'
    || error.message === 'Could not verify your sign-in: Auth session missing!'
  );
}

function formatScheduledAt(value) {
  if (!value) return 'Not scheduled';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
}

function toDateTimeLocalValue(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignPermissions, setCampaignPermissions] = useState({
    canManage: false,
    canDelete: false,
    canRemoveRecipients: false,
  });
  const [contacts, setContacts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isDeletingCampaign, setIsDeletingCampaign] = useState(false);
  const [currentRecipientIds, setCurrentRecipientIds] = useState([]);
  const [isSignedOut, setIsSignedOut] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [contactsError, setContactsError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [campaignRefreshKey, setCampaignRefreshKey] = useState(0);
  const [contactsRefreshKey, setContactsRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'email',
    status: 'draft',
    scheduledAt: '',
  });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadCampaigns() {
      setIsLoadingCampaigns(true);
      setIsSignedOut(false);
      setLoadError('');

      try {
        const loaded = await fetchAllCampaigns();
        if (isCurrent) {
          setCampaigns(loaded.campaigns);
          setCampaignPermissions(loaded.permissions ?? {
            canManage: false,
            canDelete: false,
            canRemoveRecipients: false,
          });
        }
      } catch (error) {
        if (!isCurrent) return;

        setCampaigns([]);
        setCampaignPermissions({ canManage: false, canDelete: false, canRemoveRecipients: false });
        if (isSignedOutError(error)) {
          setIsSignedOut(true);
        } else {
          setLoadError(error instanceof Error ? error.message : 'Could not load campaigns.');
        }
      } finally {
        if (isCurrent) setIsLoadingCampaigns(false);
      }
    }

    loadCampaigns();

    return () => {
      isCurrent = false;
    };
  }, [campaignRefreshKey]);

  useEffect(() => {
    if (!isFormOpen) return undefined;

    let isCurrent = true;

    async function loadRecipientContacts() {
      setIsLoadingContacts(true);
      setContactsError('');

      try {
        const loadedContacts = await fetchAllRecipientContacts();
        if (isCurrent) setContacts(loadedContacts);
      } catch (error) {
        if (!isCurrent) return;

        setContacts([]);
        setContactsError(error instanceof Error ? error.message : 'Could not load contacts.');
      } finally {
        if (isCurrent) setIsLoadingContacts(false);
      }
    }

    loadRecipientContacts();

    return () => {
      isCurrent = false;
    };
  }, [isFormOpen, contactsRefreshKey]);

  const filteredRecipients = contacts.filter((contact) => {
    const matchesSearch = 
      (contact.firstName?.toLowerCase().includes(recipientSearch.toLowerCase()) || false) ||
      (contact.lastName?.toLowerCase().includes(recipientSearch.toLowerCase()) || false) ||
      (contact.email?.toLowerCase().includes(recipientSearch.toLowerCase()) || false) ||
      (contact.company?.toLowerCase().includes(recipientSearch.toLowerCase()) || false);
    return matchesSearch;
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const nameValidation = validateCampaignName(formData.name);
    if (!nameValidation.valid) {
      setFormError(nameValidation.error);
      return;
    }

    const channelValidation = validateCampaignChannel(formData.channel);
    if (!channelValidation.valid) {
      setFormError(channelValidation.error);
      return;
    }

    const statusValidation = validateCampaignStatus(formData.status);
    if (!statusValidation.valid) {
      setFormError(statusValidation.error);
      return;
    }

    const scheduleValidation = toScheduledAtIso(formData.scheduledAt);
    if (!scheduleValidation.valid) {
      setFormError(scheduleValidation.error);
      return;
    }

    if (selectedRecipients.length === 0) {
      setFormError('Select at least one recipient.');
      return;
    }

    setIsLoading(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const campaignChanges = {
        ...formData,
        name: nameValidation.value,
        channel: channelValidation.value,
        status: statusValidation.value,
        scheduledAt: scheduleValidation.value,
      };

      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, campaignChanges, selectedRecipients);
      } else {
        await createCampaign(campaignChanges, selectedRecipients);
      }

      setIsFormOpen(false);
      setEditingCampaign(null);
      setFormData({ name: '', description: '', channel: 'email', status: 'draft', scheduledAt: '' });
      setSelectedRecipients([]);
      setCurrentRecipientIds([]);
      setRecipientSearch('');
      setSuccessMessage(editingCampaign ? 'Campaign updated successfully.' : 'Campaign created successfully.');
      setCampaignRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save the campaign.');
      if (isSignedOutError(error)) setIsSignedOut(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRecipient = (contactId) => {
    if (
      editingCampaign
      && !campaignPermissions.canRemoveRecipients
      && currentRecipientIds.includes(contactId)
      && selectedRecipients.includes(contactId)
    ) return;

    if (selectedRecipients.includes(contactId)) {
      setSelectedRecipients(selectedRecipients.filter((id) => id !== contactId));
    } else {
      setSelectedRecipients([...selectedRecipients, contactId]);
    }
  };

  const handleSelectAllRecipients = () => {
    const filteredRecipientIds = filteredRecipients.map((contact) => contact.id);
    const allFilteredRecipientsSelected = filteredRecipientIds.every((id) => selectedRecipients.includes(id));

    if (allFilteredRecipientsSelected) {
      const removableIds = campaignPermissions.canRemoveRecipients
        ? filteredRecipientIds
        : filteredRecipientIds.filter((id) => !currentRecipientIds.includes(id));
      setSelectedRecipients(selectedRecipients.filter((id) => !removableIds.includes(id)));
    } else {
      setSelectedRecipients([...new Set([...selectedRecipients, ...filteredRecipientIds])]);
    }
  };

  const handleOpenForm = () => {
    setEditingCampaign(null);
    setFormError('');
    setActionError('');
    setSuccessMessage('');
    setContactsError('');
    setSelectedRecipients([]);
    setCurrentRecipientIds([]);
    setRecipientSearch('');
    setFormData({ name: '', description: '', channel: 'email', status: 'draft', scheduledAt: '' });
    setIsFormOpen(true);
  };

  const handleEditCampaign = async (campaign) => {
    setEditingCampaign(campaign);
    setFormError('');
    setActionError('');
    setSuccessMessage('');
    setContactsError('');
    setRecipientSearch('');
    setCurrentRecipientIds([]);
    setSelectedRecipients([]);
    setIsLoadingRecipients(true);
    setIsFormOpen(true);
    setFormData({
      name: campaign.name || '',
      description: campaign.description || '',
      channel: campaign.channel,
      status: campaign.status,
      scheduledAt: toDateTimeLocalValue(campaign.scheduledAt),
    });

    try {
      const recipientIds = await listCampaignRecipientIds(campaign.id);
      setCurrentRecipientIds(recipientIds);
      setSelectedRecipients(recipientIds);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not load current recipients.');
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  const handleDeleteCampaign = async (campaign) => {
    if (!window.confirm(`Delete campaign "${campaign.name}"? This action cannot be undone.`)) return;

    setIsDeletingCampaign(true);
    setActionError('');
    setSuccessMessage('');

    try {
      await deleteCampaign(campaign.id);
      setSuccessMessage('Campaign deleted successfully.');
      setCampaignRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not delete the campaign.');
      if (isSignedOutError(error)) setIsSignedOut(true);
    } finally {
      setIsDeletingCampaign(false);
    }
  };

  const handleCloseForm = () => {
    if (isLoading) return;
    setIsFormOpen(false);
    setEditingCampaign(null);
  };

  return (
    <DashboardShell title="Campaigns">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
            <button
              onClick={handleOpenForm}
              disabled={isLoadingCampaigns || isSignedOut || !campaignPermissions.canManage}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>
          {!isLoadingCampaigns && !isSignedOut && !campaignPermissions.canManage && (
            <p className="mb-4 text-sm text-gray-500">You have read-only access to campaigns.</p>
          )}
          {successMessage && (
            <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </p>
          )}
          {actionError && (
            <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {actionError}
            </p>
          )}
          {loadError && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p>Could not load campaigns: {loadError}</p>
              <button
                type="button"
                onClick={() => setCampaignRefreshKey((currentKey) => currentKey + 1)}
                className="mt-2 font-medium text-purple-700 hover:text-purple-900"
              >
                Try again
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingCampaigns ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading campaigns...
                      </span>
                    </td>
                  </tr>
                ) : isSignedOut ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-gray-600">
                      You are signed out. Sign in to view your organization&apos;s campaigns.
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-red-600">
                      Campaigns could not be displayed.
                    </td>
                  </tr>
                ) : campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-xs text-gray-500">{campaign.description}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">{campaign.channel}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        campaign.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'sending'
                          ? 'bg-blue-100 text-blue-800'
                          : campaign.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : campaign.status === 'scheduled'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{campaign.recipientCount}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatScheduledAt(campaign.scheduledAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-start gap-2">
                        {campaignPermissions.canManage && (
                          <button
                            type="button"
                            onClick={() => handleEditCampaign(campaign)}
                            disabled={isDeletingCampaign}
                            className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                        )}
                        {campaignPermissions.canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(campaign)}
                            disabled={isDeletingCampaign}
                            className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            {isDeletingCampaign ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            Delete
                          </button>
                        )}
                        {!campaignPermissions.canManage && !campaignPermissions.canDelete && (
                          <span className="text-sm text-gray-400">Read only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoadingCampaigns && !isSignedOut && !loadError && campaigns.length === 0 && (
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError && (
                <p role="alert" className="text-sm text-red-600">
                  {formError}
                </p>
              )}
              {isSignedOut && (
                <p role="alert" className="text-sm text-red-600">
                  You are signed out. Sign in before creating a campaign.
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFormError('');
                  }}
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
                    onChange={(e) => {
                      setFormData({ ...formData, channel: e.target.value });
                      setFormError('');
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date and Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      setFormData({ ...formData, status: e.target.value });
                      setFormError('');
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {campaignStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
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
                        checked={filteredRecipients.length > 0 && filteredRecipients.every((contact) => selectedRecipients.includes(contact.id))}
                        disabled={isLoadingContacts || isLoadingRecipients || Boolean(contactsError) || filteredRecipients.length === 0}
                        onChange={handleSelectAllRecipients}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Select All ({filteredRecipients.length})
                    </label>
                  </div>
                  {isLoadingContacts ? (
                    <div className="p-4 text-center">
                      <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading organization contacts...
                      </span>
                    </div>
                  ) : contactsError ? (
                    <div className="p-4 text-center">
                      <p role="alert" className="text-sm text-red-600">Could not load contacts: {contactsError}</p>
                      <button
                        type="button"
                        onClick={() => setContactsRefreshKey((currentKey) => currentKey + 1)}
                        className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-800"
                      >
                        Try again
                      </button>
                    </div>
                  ) : filteredRecipients.length === 0 && contacts.length === 0 ? (
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
                            disabled={isLoadingContacts || isLoadingRecipients || (!campaignPermissions.canRemoveRecipients && currentRecipientIds.includes(contact.id))}
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
                  disabled={!formData.name.trim() || selectedRecipients.length === 0 || isLoading || isLoadingContacts || isLoadingRecipients || Boolean(contactsError) || isSignedOut || !campaignPermissions.canManage}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCampaign ? 'Save Changes' : 'Create Campaign'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={isLoading}
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