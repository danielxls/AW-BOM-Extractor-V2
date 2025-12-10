import React, { useState, useRef, useCallback } from 'react';
import { FileWithStatus, FileStatus } from '../types';
import Icon from './common/Icon';
import Spinner from './common/Spinner';

interface FileUploaderProps {
  files: FileWithStatus[];
  onFilesAdded: (newFiles: File[]) => void;
  onFileRemoved: (fileName: string) => void;
  onClearAll: () => void;
  onPreview: (file: File) => void;
  onSelectPages: (file: File) => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ files, onFilesAdded, onFileRemoved, onClearAll, onPreview, onSelectPages, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
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
    if (isProcessing) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type === 'application/pdf');
      if(newFiles.length > 0) {
        onFilesAdded(newFiles);
      }
      e.dataTransfer.clearData();
    }
  }, [onFilesAdded, isProcessing]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (isProcessing) return;
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file: File) => file.type === 'application/pdf');
      if(newFiles.length > 0) {
        onFilesAdded(newFiles);
      }
    }
  };

  const openFileDialog = () => {
    if (isProcessing) return;
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

  const getPageSelectionText = (fws: FileWithStatus) => {
    if (typeof fws.pageCount === 'undefined') return <span className="italic">Analyzing...</span>;
    
    const total = fws.pageCount;
    // If selectedPages is undefined, it means all pages are selected.
    const selectedCount = fws.selectedPages?.length ?? total;
    
    if (selectedCount === total) {
        return <span>{total} Page{total !== 1 && 's'} (All)</span>;
    }
    
    return <span className="font-semibold text-primary">{selectedCount} of {total} Pages</span>;
  };

  const renderFileStatusIcon = (status: FileStatus) => {
    switch (status) {
      case FileStatus.Success:
        return <Icon name="checkCircle" className="w-5 h-5 text-green-500 flex-shrink-0" />;
      case FileStatus.Error:
        return <Icon name="xCircle" className="w-5 h-5 text-red-500 flex-shrink-0" />;
      default:
        return <Icon name="pdf" className="w-8 h-8 text-red-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-sm p-4 flex flex-col">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors ${
          isDragging 
          ? 'border-primary bg-primary/10' 
          : 'border-brand-gray-300 dark:border-brand-gray-700 bg-brand-gray-50 dark:bg-brand-gray-800/50'
        } ${isProcessing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary'}`}
      >
        <input ref={inputRef} type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} disabled={isProcessing} />
        <Icon name="upload" className="w-10 h-10 text-brand-gray-400 dark:text-brand-gray-500 mb-3" />
        <p className="text-brand-gray-600 dark:text-brand-gray-300 font-medium">Drag & drop PDF files here</p>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">or click to browse</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 flex-grow overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-200">Files ({files.length})</h3>
             <button
              onClick={onClearAll}
              disabled={isProcessing}
              className="text-sm text-primary hover:underline disabled:text-brand-gray-400 disabled:no-underline disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          </div>
          <ul className="space-y-3">
            {files.map((fileWithStatus) => (
              <li key={fileWithStatus.file.name} className="flex items-center justify-between gap-4 bg-brand-gray-100 dark:bg-brand-gray-800 p-3 rounded-lg border border-brand-gray-200 dark:border-brand-gray-700" title={fileWithStatus.errorReason}>
                <div className="flex items-center space-x-4 min-w-0">
                  {fileWithStatus.status !== FileStatus.Success && fileWithStatus.status !== FileStatus.Error ? (
                     <Icon name="pdf" className="w-8 h-8 text-red-500 flex-shrink-0" />
                  ): (
                    renderFileStatusIcon(fileWithStatus.status)
                  )}
                  <div className="truncate">
                    <p className="text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200 truncate" title={fileWithStatus.file.name}>{fileWithStatus.file.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-brand-gray-500 dark:text-brand-gray-400">
                       <span>{formatBytes(fileWithStatus.file.size)}</span>
                       <span>•</span>
                       {getPageSelectionText(fileWithStatus)}
                    </div>
                  </div>
                </div>
                
                {fileWithStatus.status === FileStatus.Processing ? (
                   <div className="flex items-center space-x-2 text-primary">
                      <Spinner size="sm" />
                      <span className="text-sm font-semibold">Processing...</span>
                   </div>
                ) : (
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => onSelectPages(fileWithStatus.file)}
                      disabled={typeof fileWithStatus.pageCount === 'undefined'}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-primary bg-primary/0 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      title="Select Pages"
                    >
                      <Icon name="documentDuplicate" className="w-4 h-4" />
                      <span>Pages</span>
                    </button>
                    <button
                      onClick={() => onPreview(fileWithStatus.file)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-primary bg-primary/0 hover:bg-primary/10 transition-colors"
                      title="Preview File"
                    >
                      <Icon name="eye" className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => onFileRemoved(fileWithStatus.file.name)}
                      className="p-2 rounded-full text-brand-gray-400 hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700 hover:text-brand-gray-600 dark:hover:text-brand-gray-300 transition-colors"
                      title="Remove File"
                    >
                      <Icon name="trash" className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
