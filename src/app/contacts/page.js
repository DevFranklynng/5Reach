"use client";

import { DashboardShell } from '@/components/layout/DashboardShell';
import { useState } from 'react';
import { Search, Plus, Edit2, Loader2 } from 'lucide-react';

const initialContacts = [];

export default function ContactsPage() {
  const [contacts, setContacts] = useState(initialContacts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
  });

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = 
      (contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', status: 'active' });
    setIsFormOpen(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      status: contact.status || 'active',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName) return;
    setIsLoading(true);
    setTimeout(() => {
      if (editingContact) {
        setContacts(contacts.map((c) => 
          c.id === editingContact.id ? { ...c, ...formData } : c
        ));
      } else {
        const newContact = {
          id: contacts.length > 0 ? Math.max(...contacts.map((c) => c.id)) + 1 : 1,
          ...formData,
          tags: [],
        };
        setContacts([...contacts, newContact]);
      }
      setIsLoading(false);
      setIsFormOpen(false);
    }, 300);
  };

  return (
    <DashboardShell title="Contacts">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <button
              onClick={handleAddContact}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>
          {selectedContacts.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-purple-700">
                {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-[200px]">{contact.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{contact.phone}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{contact.company}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contact.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : contact.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredContacts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No contacts found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingContact ? 'Update' : 'Add'}
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