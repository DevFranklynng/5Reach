import React from 'react';

export function StatCard({ icon: Icon, label, value, trend, trendColor = 'gray' }) {
  const getTrendColor = () => {
    switch (trendColor) {
      case 'green':
        return 'text-[#72B89A]';
      case 'red':
        return 'text-[#E8793E]';
      default:
        return 'text-[#92979D]';
    }
  };

  return (
    <div className="bg-[#202326] border border-[#2A2C30] rounded-xl p-4 hover:border-[#E8793E]/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        {Icon && <Icon className="w-5 h-5 text-[#E8793E]" />}
        {trend && (
          <span className={`text-xs font-medium ${getTrendColor()}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-[#F3EFE8] mb-1">{value}</p>
      <p className="text-xs text-[#92979D]">{label}</p>
    </div>
  );
}
