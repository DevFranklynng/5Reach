import React from 'react';

export function PerformanceChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { name: 'Email', value: 0, color: '#7950FF' },
    { name: 'SMS', value: 0, color: '#A78BFA' },
    { name: 'Calls', value: 0, color: '#C4B5FD' },
    { name: 'Other', value: 0, color: '#DDD6FE' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h2>
      {chartData.every(d => d.value === 0) ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-4">
              <div className="w-16 text-xs text-gray-600">{item.name}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${item.value}%`, backgroundColor: item.color }}
                />
              </div>
              <div className="w-10 text-xs text-gray-600 text-right">{item.value}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}