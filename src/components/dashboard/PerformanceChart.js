import React from 'react';

export function PerformanceChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { name: 'Email', value: 0, color: '#E8793E' },
    { name: 'SMS', value: 0, color: '#F59E0B' },
    { name: 'Calls', value: 0, color: '#72B89A' },
    { name: 'Other', value: 0, color: '#92979D' },
  ];

  return (
    <div className="bg-[#202326] border border-[#2A2C30] rounded-xl p-6">
      <h2 className="text-lg font-semibold text-[#F3EFE8] mb-4">Campaign Performance</h2>
      {chartData.every(d => d.value === 0) ? (
        <div className="text-center py-8">
          <p className="text-[#92979D] text-sm">No data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-4">
              <div className="w-16 text-xs text-[#92979D]">{item.name}</div>
              <div className="flex-1 bg-[#151719] rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${item.value}%`, backgroundColor: item.color }}
                />
              </div>
              <div className="w-10 text-xs text-[#92979D] text-right">{item.value}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
