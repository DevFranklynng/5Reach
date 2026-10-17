import React from 'react';

export function StatCard({ icon, label, value, trend, trendColor = 'gray' }) {
  const getTrendColor = () => {
    switch (trendColor) {
      case 'green':
        return 'text-green-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg">{icon}</span>
        {trend && (
          <span className={`text-xs font-medium ${getTrendColor()}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}