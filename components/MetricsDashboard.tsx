import React, { useMemo, useEffect, useState } from 'react';
import { BOMRecord } from '../types';
import Icon from './common/Icon';
import { getExtractionLogs, ExtractionLogDB } from '../services/supabase';

// --- Components ---

const MetricCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-brand-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-brand-gray-800 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-200">
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
      <Icon name={icon} className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <h3 className="text-sm font-medium text-brand-gray-500 dark:text-brand-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100 mt-1">{value}</p>
    </div>
  </div>
);

const ProgressBar: React.FC<{ label: string; percentage: number; colorClass: string; count: number }> = ({ label, percentage, colorClass, count }) => (
  <div className="mb-4">
    <div className="flex justify-between text-sm mb-1">
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <span className="text-gray-500 dark:text-gray-400">{count} items ({percentage.toFixed(1)}%)</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
      <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

// --- Main Component ---

interface MetricsDashboardProps {
  data: BOMRecord[];
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ data }) => {
  const [history, setHistory] = useState<ExtractionLogDB[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      const logs = await getExtractionLogs();
      setHistory(logs || []);
      setLoadingHistory(false);
    };
    fetchHistory();
  }, [data]); // Re-fetch when local data changes (implies new save)

  const metrics = useMemo(() => {
    // Top Cards source: History (Accumulated) + Session fallback if history empty/loading
    // We prefer history as it should contain everything.
    const sourceData = history.length > 0 ? history : data.map(d => ({
      file_name: d.SourceFile,
      supplier: d.Supplier,
      item_count: d.BOM.length,
      average_confidence: d.BOM.length > 0 ? (d.BOM.reduce((a, b) => a + b.Confidence, 0) / d.BOM.length) * 100 : 0,
      processing_time: d.processingTime || 0
    } as ExtractionLogDB));

    if (sourceData.length === 0 && data.length === 0) return null;

    const filesProcessed = sourceData.length;
    const rowsExtracted = sourceData.reduce((sum, log) => sum + log.item_count, 0);

    const avgConfidence = sourceData.reduce((sum, log) => sum + log.average_confidence, 0) / (filesProcessed || 1);

    // Avg Time
    const avgTimeVal = sourceData.reduce((sum, log) => sum + (log.processing_time || 0), 0) / (filesProcessed || 1);

    // Top Supplier (count frequency)
    const supplierCounts: Record<string, number> = {};
    sourceData.forEach(log => {
      supplierCounts[log.supplier] = (supplierCounts[log.supplier] || 0) + 1;
    });
    const topSupplier = Object.keys(supplierCounts).length > 0
      ? Object.entries(supplierCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A';

    // -- Session Specific Charts --
    // These rely on detailed BOM data which we DON'T save to DB to save space.
    // So these charts will only show the CURRENT active session's distribution.
    const sessionItems = data.flatMap(r => r.BOM);
    const matCounts = { pipe: 0, flange: 0, fitting: 0, bolt: 0, other: 0 };
    sessionItems.forEach(item => {
      const desc = item.DESCRIPTION.toUpperCase();
      if (desc.includes('PIPE')) matCounts.pipe++;
      else if (desc.includes('FLANGE')) matCounts.flange++;
      else if (desc.includes('ELBOW') || desc.includes('TEE') || desc.includes('REDUCER')) matCounts.fitting++;
      else if (desc.includes('BOLT') || desc.includes('STUD') || desc.includes('NUT')) matCounts.bolt++;
      else matCounts.other++;
    });

    const confCounts = { high: 0, medium: 0, low: 0 };
    sessionItems.forEach(item => {
      if (item.Confidence > 0.9) confCounts.high++;
      else if (item.Confidence > 0.7) confCounts.medium++;
      else confCounts.low++;
    });

    return {
      filesProcessed,
      rowsExtracted,
      avgConfidence: avgConfidence.toFixed(1) + '%',
      needsReview: 'See details',
      topSupplier,
      avgTime: avgTimeVal.toFixed(1) + 's',
      matCounts,
      confCounts,
      matTotal: sessionItems.length || 1,
      hasSessionData: data.length > 0
    };
  }, [data, history]);

  if (!metrics) {
    return (
      <div className="text-center p-12 bg-white dark:bg-brand-gray-900 rounded-xl shadow-sm flex flex-col justify-center items-center h-[50vh]">
        <div className="bg-brand-gray-100 dark:bg-brand-gray-800 p-4 rounded-full mb-4">
          <Icon name="chart" className="w-12 h-12 text-brand-gray-400 dark:text-brand-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-brand-gray-800 dark:text-brand-gray-200">Dashboard Empty</h3>
        <p className="text-brand-gray-500 dark:text-brand-gray-400 mt-2 max-w-sm">
          Processed data will appear here. Start by uploading PDF drawings in the Extractor tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-brand-gray-100">Performance Dashboard</h1>
          <p className="text-brand-gray-500 dark:text-brand-gray-400 mt-1">
            {history.length > 0 ? "Showing accumulated historical data + active session." : "Real-time metrics for current session."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full font-medium">
          <Icon name="cloud" className="w-4 h-4" />
          {loadingHistory ? "Syncing..." : "Data Persisted"}
        </div>
      </div>

      {/* Top Metrics Grid (Accumulated) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Drawings Processed" value={metrics.filesProcessed} icon="document" color="bg-blue-500" />
        <MetricCard title="Total Items Extracted" value={metrics.rowsExtracted} icon="list" color="bg-purple-500" />
        <MetricCard title="Avg. Confidence" value={metrics.avgConfidence} icon="checkCircle" color="bg-green-500" />
        <MetricCard title="Top Supplier" value={metrics.topSupplier} icon="user" color="bg-indigo-500" />
        <MetricCard title="Avg. Processing Time" value={metrics.avgTime} icon="clock" color="bg-pink-500" />
      </div>

      <div className="grid grid-cols-1 gap-8">

        {/* Confidence Breakdown (Session Only) */}
        {metrics.hasSessionData ? (
          <div className="bg-white dark:bg-brand-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-brand-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Icon name="checkCircle" className="w-5 h-5 text-gray-400" />
              Confidence Quality (Current Session)
            </h2>
            <div className="flex items-center justify-center py-8 gap-8">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl w-1/3">
                <div className="text-green-600 font-bold text-2xl">{metrics.confCounts.high}</div>
                <div className="text-xs text-green-700 dark:text-green-400 font-medium uppercase mt-1">High (&gt;90%)</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl w-1/3">
                <div className="text-yellow-600 font-bold text-2xl">{metrics.confCounts.medium}</div>
                <div className="text-xs text-yellow-700 dark:text-yellow-400 font-medium uppercase mt-1">Med (70-90%)</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl w-1/3">
                <div className="text-red-600 font-bold text-2xl">{metrics.confCounts.low}</div>
                <div className="text-xs text-red-700 dark:text-red-400 font-medium uppercase mt-1">Low (&lt;70%)</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-brand-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-brand-gray-800 flex items-center justify-center text-center">
            <p className="text-gray-500">Starts processing files to see Confidence Breakdown.</p>
          </div>
        )}
      </div>

      {/* Recent Activity Table (Accumulated History) */}
      <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-brand-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-brand-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Processed Documents (All Time)</h2>
          <p className="text-xs text-gray-500 mt-1">Synced with secure database.</p>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-brand-gray-800">
            <thead className="bg-gray-50 dark:bg-brand-gray-800 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-brand-gray-900 divide-y divide-gray-200 dark:divide-brand-gray-800">
              {history.map((record, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {record.file_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.item_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.average_confidence?.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.created_at ? new Date(record.created_at).toLocaleDateString() + ' ' + new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No historical data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;