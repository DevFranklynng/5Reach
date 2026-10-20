import React from 'react';
import { Mail, MessageSquare, UserPlus, Rocket, Reply } from 'lucide-react';

export function ActivityList({ activities = [], isLoading = false, error = null }) {
  const items = activities;

  const getIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-[#E8793E]" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-[#E8793E]" />;
      case 'contact':
        return <UserPlus className="w-4 h-4 text-[#E8793E]" />;
      case 'campaign':
        return <Rocket className="w-4 h-4 text-[#E8793E]" />;
      case 'reply':
        return <Reply className="w-4 h-4 text-[#72B89A]" />;
      default:
        return <MessageSquare className="w-4 h-4 text-[#E8793E]" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#202326] border border-[#2A2C30] rounded-xl p-6">
        <div className="h-5 bg-[#2A2C30] rounded w-32 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-[#2A2C30] rounded animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-[#2A2C30] rounded w-full mb-1 animate-pulse"></div>
                <div className="h-3 bg-[#2A2C30] rounded w-20 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#202326] border border-[#2A2C30] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#F3EFE8] mb-4">Recent Activity</h2>
        <div className="text-center py-4">
          <p className="text-[#E8793E] text-sm">Error loading activities</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#202326] border border-[#2A2C30] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#F3EFE8] mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <p className="text-[#92979D] text-sm">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#202326] border border-[#2A2C30] rounded-xl p-6">
      <h2 className="text-lg font-semibold text-[#F3EFE8] mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {items.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="mt-0.5">{getIcon(activity.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#F3EFE8]">{activity.action}</p>
              <p className="text-xs text-[#92979D] mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
