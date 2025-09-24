
import React, { useState, useRef, useCallback } from 'react';
import { FileWithStatus, FileStatus } from '../types';
import Icon from './common/Icon';

interface FileUploaderProps {
  files: FileWithStatus[];
  onFilesAdded: (newFiles: File[]) => void;
  onFileRemoved: (fileName: string) => void;
  onClearAll: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ files, onFilesAdded, onFileRemoved, onClearAll }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Fix: Explicitly type the 'file' parameter in the filter function.
      const newFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type === 'application/pdf');
      if(newFiles.length > 0) {
        onFilesAdded(newFiles);
      }
      e.dataTransfer.clearData();
    }
  }, [onFilesAdded]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Fix: Explicitly type the 'file' parameter in the filter function.
      const newFiles = Array.from(e.target.files).filter((file: File) => file.type === 'application/pdf');
      if(newFiles.length > 0) {
        onFilesAdded(newFiles);
      }
    }
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 h-full flex flex-col">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          isDragging ? 'border-brand-blue bg-brand-blue-light' : 'border-brand-gray-300 bg-brand-gray-100 hover:border-brand-blue'
        }`}
      >
        <input ref={inputRef} type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} />
        <Icon name="upload" className="w-12 h-12 text-brand-gray-400 mb-4" />
        <p className="text-brand-gray-600 font-semibold">Drag & drop PDF files here</p>
        <p className="text-sm text-brand-gray-500">or click to browse</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 flex-grow overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-brand-gray-800">Selected Files ({files.length})</h3>
             <button
              onClick={onClearAll}
              className="text-sm text-brand-blue hover:underline"
            >
              Clear All
            </button>
          </div>
          <ul className="space-y-2">
            {files.map(({ file }) => (
              <li key={file.name} className="flex items-center justify-between bg-brand-gray-100 p-2 rounded-md">
                <div className="flex items-center space-x-3">
                  <Icon name="pdf" className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-medium text-brand-gray-800 truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-brand-gray-500">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => onFileRemoved(file.name)}
                  className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 hover:text-brand-gray-600 transition-colors"
                >
                  <Icon name="trash" className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;