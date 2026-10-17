import React from 'react';

export function ActivityList({ activities = [] }) {
  const defaultActivities = [
    { id: 1, action: 'Email sent to Sarah Johnson', time: '2 hours ago', type: 'email' },
    { id: 2, action: 'SMS delivered to Mike Davis', time: '3 hours ago', type: 'sms' },
    { id: 3, action: 'New contact added: John Smith', time: '5 hours ago', type: 'contact' },
    { id: 4, action: 'Campaign completed: Q1 Outreach', time: '1 day ago', type: 'campaign' },
    { id: 5, action: 'Reply received from Lisa Chen', time: '2 days ago', type: 'reply' },
  ];

  const items = activities.length > 0 ? activities : defaultActivities;

  const getIcon = (type) => {
    switch (type) {
      case 'email':
        return '📧';
      case 'sms':
        return '📱';
      case 'contact':
        return '👤';
      case 'campaign':
        return '🚀';
      case 'reply':
        return '💬';
      default:
        return '📌';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {items.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <span className="text-base mt-0.5">{getIcon(activity.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.action}</p>
              <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}