import React, { useMemo, useState } from 'react';
import { BOMRecord } from '../../types';
import Icon from '../common/Icon';

// Declare XLSX globally (ensure it's loaded in index.html)
declare var XLSX: any;

interface MaterialConsolidationProps {
    data: BOMRecord[];
}

interface ConsolidatedItem {
    id: string; // Composite key
    description: string;
    size: string;
    unit: string;
    totalQty: number;
    occurrenceCount: number; // How many times it appeared
    sourceFiles: Set<string>; // Which files contained this item
}

const MaterialConsolidation: React.FC<MaterialConsolidationProps> = ({ data }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const consolidatedData = useMemo(() => {
        const map = new Map<string, ConsolidatedItem>();

        data.forEach(record => {
            record.BOM.forEach(item => {
                const normDesc = item.DESCRIPTION.trim().toUpperCase();
                const normSize = item.SIZE_ND.trim().toUpperCase();
                const normUnit = item.QTY.unit || 'unknown';

                const key = `${normDesc}|${normSize}|${normUnit}`;

                if (!map.has(key)) {
                    map.set(key, {
                        id: key,
                        description: item.DESCRIPTION,
                        size: item.SIZE_ND,
                        unit: item.QTY.unit,
                        totalQty: 0,
                        occurrenceCount: 0,
                        sourceFiles: new Set()
                    });
                }

                const entry = map.get(key)!;

                if (item.QTY.value !== null && !isNaN(item.QTY.value)) {
                    entry.totalQty += item.QTY.value;
                }

                entry.occurrenceCount += 1;
                entry.sourceFiles.add(record.SourceFile);
            });
        });

        // Filter based on search query
        const allItems = Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);

        if (!searchQuery) return allItems;

        const lowerQuery = searchQuery.toLowerCase();
        return allItems.filter(item =>
            item.description.toLowerCase().includes(lowerQuery) ||
            item.size.toLowerCase().includes(lowerQuery)
        );
    }, [data, searchQuery]);

    const handleExport = () => {
        if (consolidatedData.length === 0) return;

        const exportData = consolidatedData.map(item => ({
            'Material Description': item.description,
            'Size / ND': item.size,
            'Total Qty': item.totalQty,
            'Unit': item.unit,
            'Occurrences': item.occurrenceCount,
            'Found In Projects': Array.from(item.sourceFiles).join(', ')
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Consolidated Materials');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        XLSX.writeFile(wb, `Material_Consolidation_${timestamp}.xlsx`);
    };

    if (!data || data.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 bg-white dark:bg-brand-gray-900 rounded-xl border border-gray-100 dark:border-brand-gray-800">
                No content to consolidate. Process files first.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Material Consolidation</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Aggregated totals across {data.length} processed drawings.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon name="search" className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search description or size..."
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-brand-gray-700 rounded-lg text-sm bg-white dark:bg-brand-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        <Icon name="download" className="h-4 w-4 mr-2" />
                        Export Excel
                    </button>
                </div>
            </div>

            <div className="overflow-hidden bg-white dark:bg-brand-gray-900 shadow-sm ring-1 ring-black/5 rounded-xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-brand-gray-800 table-fixed">
                        <thead className="bg-gray-50 dark:bg-brand-gray-800/50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6 w-1/3">
                                    Material Description
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white w-1/6">
                                    Size / ND
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white w-1/6">
                                    Total Qty
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white w-1/6">
                                    Unit
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white w-1/6">
                                    Found In
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-brand-gray-800 bg-white dark:bg-brand-gray-900">
                            {consolidatedData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-brand-gray-800/30 transition-colors">
                                    <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6 truncate max-w-xs" title={item.description}>
                                        {item.description}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">
                                            {item.size}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                        {item.totalQty.toFixed(2)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {item.unit}
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{item.sourceFiles.size} Project(s)</span>
                                            <span className="text-xs text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap" title={Array.from(item.sourceFiles).join(', ')}>
                                                {Array.from(item.sourceFiles).join(', ')}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {consolidatedData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No matching items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 dark:bg-brand-gray-800/50 px-6 py-3 border-t border-gray-200 dark:border-brand-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Showing {consolidatedData.length} unique material items.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MaterialConsolidation;
