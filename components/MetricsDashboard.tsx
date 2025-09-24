import React, { useMemo } from 'react';
import { BOMRecord } from '../types';
import Icon from './common/Icon';

const MetricCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <h3 className="text-sm font-medium text-brand-gray-500">{title}</h3>
    <p className="text-3xl font-bold text-brand-gray-900 mt-2">{value}</p>
  </div>
);

interface MetricsDashboardProps {
  data: BOMRecord[];
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ data }) => {

  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        filesProcessed: 0,
        rowsExtracted: 0,
        avgConfidence: '0.0%',
        needsReview: 0,
        topSupplier: 'N/A',
      };
    }

    const allItems = data.flatMap(record => record.BOM);
    const totalRows = allItems.length;

    const avgConfidence = totalRows > 0
      ? (allItems.reduce((sum, item) => sum + item.Confidence, 0) / totalRows) * 100
      : 0;

    const needsReview = allItems.filter(item => item.needs_review).length;

    const supplierCounts = data.reduce((acc, record) => {
        acc[record.Supplier] = (acc[record.Supplier] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topSupplier = Object.keys(supplierCounts).length > 0
      ? Object.entries(supplierCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';
      
    return {
      filesProcessed: data.length,
      rowsExtracted: totalRows,
      avgConfidence: avgConfidence.toFixed(1) + '%',
      needsReview,
      topSupplier,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-sm h-full flex flex-col justify-center items-center">
        <Icon name="upload" className="w-16 h-16 text-brand-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-brand-gray-800">No Data for Dashboard</h3>
        <p className="text-brand-gray-500 mt-2">
          Please go to the <span className="font-semibold">Extractor</span> tab, upload some files, and run an extraction.
        </p>
        <p className="text-brand-gray-500 mt-1">
          The dashboard will update with the results from your session.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 h-full">
        <h1 className="text-3xl font-bold text-brand-gray-900 mb-6">Current Session Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard title="Drawings Processed" value={metrics.filesProcessed} />
            <MetricCard title="BOM Rows Extracted" value={metrics.rowsExtracted} />
            <MetricCard title="Average Confidence" value={metrics.avgConfidence} />
            <MetricCard title="Rows Needing Review" value={metrics.needsReview} />
            <MetricCard title="Top Supplier" value={metrics.topSupplier} />
            <MetricCard title="Avg. Processing Time" value="N/A" />
        </div>
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
             <h2 className="text-xl font-bold text-brand-gray-900 mb-4">Session Details</h2>
             <p className="text-brand-gray-600">This dashboard reflects statistics only for the documents processed in the current session. Historical data and trend analysis would be available in a full production environment.</p>
        </div>
    </div>
  );
};

export default MetricsDashboard;