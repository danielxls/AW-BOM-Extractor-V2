
import React from 'react';

const MetricCard: React.FC<{ title: string; value: string; change?: string; changeType?: 'increase' | 'decrease' }> = ({ title, value, change, changeType }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <h3 className="text-sm font-medium text-brand-gray-500">{title}</h3>
    <p className="text-3xl font-bold text-brand-gray-900 mt-2">{value}</p>
    {change && (
      <p className={`text-sm mt-2 ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
        {changeType === 'increase' ? '▲' : '▼'} {change} vs last month
      </p>
    )}
  </div>
);

const MetricsDashboard: React.FC = () => {
  return (
    <div className="p-8 h-full">
        <h1 className="text-3xl font-bold text-brand-gray-900 mb-6">Performance Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard title="Files Processed (Month)" value="1,284" change="12.5%" changeType="increase" />
            <MetricCard title="BOM Rows Extracted" value="9,721" change="8.2%" changeType="increase" />
            <MetricCard title="Average Confidence" value="96.2%" change="1.1%" changeType="increase" />
            <MetricCard title="Rows Needing Review" value="388" change="5.4%" changeType="decrease" />
            <MetricCard title="Avg. Processing Time" value="42s" change="3s" changeType="decrease" />
            <MetricCard title="Top Supplier" value="KENT" />
        </div>
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
             <h2 className="text-xl font-bold text-brand-gray-900 mb-4">Processing History</h2>
             <p className="text-brand-gray-600">A chart or detailed log of recent processing activity would be displayed here.</p>
        </div>
    </div>
  );
};

export default MetricsDashboard;
