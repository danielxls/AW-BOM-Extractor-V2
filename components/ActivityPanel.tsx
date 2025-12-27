

import React, { useRef, useEffect } from 'react';
import { LogEntry, ExtractionStatus, ExtractionSummary } from '../types';
import Icon from './common/Icon';
import Spinner from './common/Spinner';

interface ActivityPanelProps {
  status: ExtractionStatus;
  log: LogEntry[];
  progress: {
    current: number;
    total: number;
  };
  elapsedTime: number;
  eta: number | null;
  summary: ExtractionSummary | null;
  onViewResults: () => void;
  onExportLog: () => void;
  onStop: () => void;
}

const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(seconds.toString().padStart(2, '0'));

    return parts.join(':');
};

const formatEta = (totalSeconds: number) => {
    if (totalSeconds < 1) return null;
    if (totalSeconds < 60) return `< 1 min`;
    const minutes = Math.ceil(totalSeconds / 60);
    return `~${minutes} min`;
};

const ActivityPanel: React.FC<ActivityPanelProps> = ({ status, log, progress, elapsedTime, eta, summary, onViewResults, onExportLog, onStop }) => {
  const logContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);

  const getStatusIcon = (status: LogEntry['status']) => {
    switch (status) {
      case 'info':
        return <Icon name="info" className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Spinner size="sm" />;
      case 'success':
        return <Icon name="checkCircle" className="w-5 h-5 text-green-500" />;
      case 'error':
        return <Icon name="xCircle" className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  if (status === ExtractionStatus.Completed && summary) {
    const isStopped = summary.completionReason === 'stopped';
    
    return (
        <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-sm h-full flex flex-col p-6 justify-center items-center text-center animate-fade-in">
            {isStopped ? (
                 <Icon name="info" className="w-20 h-20 text-yellow-500 mb-4" />
            ) : (
                <Icon name="checkCircle" className="w-20 h-20 text-green-500 mb-4" />
            )}
            <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100">
                {isStopped ? 'Process Stopped' : 'Extraction Complete'}
            </h2>
            {isStopped && (
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1 mb-4">
                    Displaying results for files processed before stopping.
                </p>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 my-6 text-left">
                <div className="font-medium text-brand-gray-500 dark:text-brand-gray-400">Files Processed:</div>
                <div className="font-bold text-lg text-brand-gray-800 dark:text-brand-gray-200">{summary.filesProcessed}</div>
                
                <div className="font-medium text-brand-gray-500 dark:text-brand-gray-400">With Success:</div>
                <div className="font-bold text-lg text-green-600">{summary.successCount}</div>
                
                <div className="font-medium text-brand-gray-500 dark:text-brand-gray-400">With Errors:</div>
                <div className={`font-bold text-lg ${summary.errorCount > 0 ? 'text-red-500' : 'text-brand-gray-800 dark:text-brand-gray-200'}`}>{summary.errorCount}</div>
                
                <div className="font-medium text-brand-gray-500 dark:text-brand-gray-400">Total Items Found:</div>
                <div className="font-bold text-lg text-brand-gray-800 dark:text-brand-gray-200">{summary.totalItems}</div>
                
                <div className="font-medium text-brand-gray-500 dark:text-brand-gray-400">Total Time:</div>
                <div className="font-bold text-lg text-brand-gray-800 dark:text-brand-gray-200">{formatTime(summary.totalTime)}</div>
            </div>
            <div className="flex space-x-4 mt-4">
                <button
                    onClick={onViewResults}
                    className="flex-1 bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    View Detailed Results
                </button>
                <button
                    onClick={onExportLog}
                    className="flex-1 bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 font-bold py-3 px-6 rounded-lg hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600 transition-colors"
                >
                    Export Log
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-sm h-full flex flex-col p-4">
      <div className="flex-shrink-0 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100">
            Extraction in Progress...
          </h2>
          {status === ExtractionStatus.Extracting && (
            <button
              onClick={onStop}
              className="flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold"
            >
              <Icon name="xmark" className="w-5 h-5" />
              <span>Stop</span>
            </button>
          )}
        </div>
        <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs font-mono text-brand-gray-500 dark:text-brand-gray-400">
            <span>Time Elapsed: {formatTime(elapsedTime)}</span>
            {eta !== null && status === ExtractionStatus.Extracting && progress.current > 0 && progress.current < progress.total && <span>ETA: {formatEta(eta)}</span>}
        </div>
      </div>

      <div className="flex-grow bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg p-3 overflow-hidden">
        <ul ref={logContainerRef} className="h-full overflow-y-auto space-y-2 text-sm font-mono pr-2">
          {log.map((entry, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-brand-gray-400 dark:text-brand-gray-500 select-none">
                [{entry.timestamp}]
              </span>
              <span className="flex-shrink-0 mt-0.5">{getStatusIcon(entry.status)}</span>
              <span className="flex-grow text-brand-gray-700 dark:text-brand-gray-300 break-words">
                {entry.message}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ActivityPanel;
