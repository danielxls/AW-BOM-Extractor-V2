import React, { useState, useEffect } from 'react';
import { BOMRecord, BOMItem } from '../types';
import Icon from './common/Icon';
import { exportToExcel } from '../services/geminiService';

interface BomTableProps {
  data: BOMRecord[];
}

const BomTable: React.FC<BomTableProps> = ({ data }) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<BOMRecord[]>(data);

  useEffect(() => {
    setEditedData(data);
  }, [data]);

  const handleEdit = (item: BOMItem) => {
    setEditingItemId(item.id);
  };

  const handleCancel = () => {
    setEditingItemId(null);
  };

  const handleSave = (recordIndex: number, itemIndex: number, updatedItem: BOMItem) => {
    const newData = [...editedData];
    newData[recordIndex].BOM[itemIndex] = updatedItem;
    setEditedData(newData);
    setEditingItemId(null);
  };

  const ItemRow: React.FC<{ recordIndex: number; itemIndex: number; item: BOMItem }> = ({ recordIndex, itemIndex, item }) => {
    const [currentItem, setCurrentItem] = useState(item);

    if (editingItemId === item.id) {
      return (
        <tr className="bg-brand-blue-light">
          <td className="px-4 py-3"><input type="text" value={currentItem.ITEM} onChange={e => setCurrentItem({...currentItem, ITEM: e.target.value})} className="w-16 p-1 border rounded bg-white" /></td>
          <td className="px-4 py-3"><input type="text" value={currentItem.QTY.raw} onChange={e => setCurrentItem({...currentItem, QTY: {...currentItem.QTY, raw: e.target.value}})} className="w-24 p-1 border rounded bg-white" /></td>
          <td className="px-4 py-3"><input type="text" value={currentItem.SIZE_ND} onChange={e => setCurrentItem({...currentItem, SIZE_ND: e.target.value})} className="w-24 p-1 border rounded bg-white" /></td>
          <td className="px-4 py-3"><input type="text" value={currentItem.DESCRIPTION} onChange={e => setCurrentItem({...currentItem, DESCRIPTION: e.target.value})} className="w-full p-1 border rounded bg-white" /></td>
          <td className="px-4 py-3 text-center">{(item.Confidence * 100).toFixed(1)}%</td>
          <td className="px-4 py-3">
            <div className="flex items-center justify-center space-x-2">
              <button onClick={() => handleSave(recordIndex, itemIndex, currentItem)} className="p-1 text-green-600 hover:text-green-800"><Icon name="check" className="w-5 h-5"/></button>
              <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-800"><Icon name="xmark" className="w-5 h-5"/></button>
            </div>
          </td>
        </tr>
      );
    }
    
    return (
       <tr className={`border-b border-brand-gray-200 ${item.needs_review ? 'bg-yellow-50' : 'bg-white'} hover:bg-brand-gray-100`}>
        <td className="px-4 py-3 text-sm text-brand-gray-700">{item.ITEM}</td>
        <td className="px-4 py-3 text-sm text-brand-gray-700">{item.QTY.raw}</td>
        <td className="px-4 py-3 text-sm text-brand-gray-700">{item.SIZE_ND}</td>
        <td className="px-4 py-3 text-sm text-brand-gray-700">{item.DESCRIPTION}</td>
        <td className={`px-4 py-3 text-sm text-center ${item.Confidence > 0.95 ? 'text-green-600' : 'text-orange-500'}`}>
          {(item.Confidence * 100).toFixed(1)}%
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-center">
            <button onClick={() => handleEdit(item)} className="p-1 text-brand-gray-500 hover:text-brand-blue transition-colors">
              <Icon name="edit" className="w-5 h-5" />
            </button>
          </div>
        </td>
      </tr>
    )
  };


  if (editedData.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-sm h-full flex flex-col justify-center">
        <Icon name="pdf" className="w-16 h-16 text-brand-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-brand-gray-800">No BOM Data</h3>
        <p className="text-brand-gray-500 mt-2">Upload PDF files and start the extraction process to see the results here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-brand-gray-900">Extraction Results</h2>
        <button
          onClick={() => exportToExcel(editedData)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
        >
          <Icon name="download" className="w-5 h-5" />
          <span>Export to Excel</span>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {editedData.map((record, recordIndex) => (
          <div key={record.SourceFile} className="mb-8 last:mb-0">
            <div className="bg-brand-gray-100 p-3 rounded-t-lg border-b-2 border-brand-blue">
              <h3 className="font-bold text-brand-gray-800">{record.SourceFile}</h3>
              <div className="flex space-x-4 text-sm text-brand-gray-600 mt-1">
                <span><strong>Supplier:</strong> {record.Supplier}</span>
                <span><strong>Drawing No:</strong> {record.DrawingNo}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b-2 border-brand-gray-200 bg-brand-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold text-brand-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-2 text-xs font-semibold text-brand-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-2 text-xs font-semibold text-brand-gray-500 uppercase tracking-wider">Size/ND</th>
                    <th className="px-4 py-2 text-xs font-semibold text-brand-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-xs font-semibold text-brand-gray-500 uppercase tracking-wider text-center">Confidence</th>
                    <th className="px-4 py-2 text-xs font-semibold text-brand-gray-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {record.BOM.map((item, itemIndex) => (
                    <ItemRow key={item.id} recordIndex={recordIndex} itemIndex={itemIndex} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BomTable;