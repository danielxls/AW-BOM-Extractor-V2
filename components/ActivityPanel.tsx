import React, { useRef, useEffect, useState, useMemo } from 'react';
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
  const [showLogs, setShowLogs] = useState(false);

  // Extract file names from logs to create a "File Queue" visualization
  // This is a heuristic since we don't have a direct list of files in props, but we can infer from logs like "Processing file..."
  const fileStatuses = useMemo(() => {
    const files = new Map<string, { status: 'pending' | 'processing' | 'completed' | 'error', message?: string }>();

    log.forEach(entry => {
      const match = entry.message.match(/Processing file \d+\/\d+: '(.*?)'/);
      if (match) {
        files.set(match[1], { status: 'processing' });
      }

      // Heuristic: If we see a success/error message *after* a processing message, update status
      // Note: In a real production app, we should pass the file list as a prop to manage this state explicitly.
      // For now, valid visual feedback for the currently processing file is the main goal.
    });

    // Simple heuristic for demo: Mark previous files as done if we are processing a new one
    const fileList = Array.from(files.keys());
    if (fileList.length > 0) {
      const currentFile = fileList[fileList.length - 1];
      fileList.forEach(f => {
        if (f !== currentFile) files.set(f, { status: 'completed' });
      });
    }

    return files;
  }, [log]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log, showLogs]);

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  // Get current file being processed from logs
  const currentFileProcessing = log.slice().reverse().find(l => l.message.includes("Processing file"))?.message.match(/'(.*?)'/)?.[1] || "Initializing...";


  if (status === ExtractionStatus.Completed && summary) {
    const isStopped = summary.completionReason === 'stopped';
    return (
      <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-sm h-full flex flex-col p-8 justify-center items-center text-center animate-fade-in">
        {isStopped ? (
          <Icon name="info" className="w-24 h-24 text-yellow-500 mb-6" />
        ) : (
          <div className="rounded-full bg-green-100 p-6 mb-6">
            <Icon name="checkCircle" className="w-20 h-20 text-green-600" />
          </div>
        )}
        <h2 className="text-3xl font-bold text-brand-gray-900 dark:text-brand-gray-100 mb-2">
          {isStopped ? 'Process Stopped' : 'Extraction Complete'}
        </h2>
        <p className="text-brand-gray-500 dark:text-brand-gray-400 mb-8 max-w-sm mx-auto">
          {isStopped
            ? 'Processing was manually interrupted.'
            : 'All documents have been successfully processed and data extracted.'}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mb-8">
          <div className="p-4 bg-brand-gray-50 dark:bg-brand-gray-800 rounded-lg">
            <div className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Total Files</div>
            <div className="text-2xl font-bold text-brand-gray-900 dark:text-white">{summary.filesProcessed}</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">Successful</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.successCount}</div>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-sm text-red-600 dark:text-red-400">Errors</div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.errorCount}</div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">Time Taken</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatTime(summary.totalTime)}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button
            onClick={onViewResults}
            className="flex-1 bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 transform hover:-translate-y-0.5"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-sm h-full flex flex-col p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex-shrink-0 mb-8 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100 flex items-center gap-3">
              <div className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-primary"></span>
              </div>
              Processing Files...
            </h2>
            <p className="text-brand-gray-500 dark:text-brand-gray-400 text-sm mt-1 ml-9">
              Please wait while Gemini analyzes your documents.
            </p>
          </div>

          {status === ExtractionStatus.Extracting && (
            <button
              onClick={onStop}
              className="group flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-100"
            >
              <Icon name="xmark" className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {/* Big Progress Card */}
        <div className="bg-brand-gray-50 dark:bg-brand-gray-800 rounded-xl p-6 border border-brand-gray-100 dark:border-brand-gray-700">
          <div className="flex justify-between text-sm font-medium text-brand-gray-600 dark:text-brand-gray-300 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-4 mb-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-blue-400 h-full rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-brand-gray-500 font-medium">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <Icon name="clock" className="w-3 h-3" />
                {formatTime(elapsedTime)} elapsed
              </span>
              {eta !== null && (
                <span className="flex items-center gap-1 text-primary">
                  <Icon name="lightning" className="w-3 h-3" />
                  {formatEta(eta)} remaining
                </span>
              )}
            </div>
            <span>{progress.current} of {progress.total} files</span>
          </div>
        </div>
      </div>

      {/* Active File Visualization */}
      <div className="flex-grow flex flex-col justify-center items-center z-10 min-h-[150px]">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-primary mx-auto">
              <Icon name="document" className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-brand-gray-900 rounded-full p-1 shadow-md">
              <Spinner size="sm" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-brand-gray-900 dark:text-white">Currently Analyzing</h3>
            <p className="text-primary font-medium mt-1 animate-pulse">{currentFileProcessing}</p>
          </div>
        </div>
      </div>

      {/* Logs Toggle */}
      <div className="mt-4 z-10 border-t border-brand-gray-100 dark:border-brand-gray-800 pt-4">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center justify-between w-full text-sm text-brand-gray-500 hover:text-brand-gray-700 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 transition-colors bg-transparent border-0"
        >
          <span className="flex items-center gap-2">
            <Icon name="terminal" className="w-4 h-4" />
            Technical Logs
          </span>
          <Icon name={showLogs ? "chevronUp" : "chevronDown"} className="w-4 h-4" />
        </button>

        {showLogs && (
          <div className="mt-3 bg-black/90 text-green-400 rounded-lg p-4 font-mono text-xs h-40 overflow-y-auto shadow-inner border border-gray-800">
            <ul ref={logContainerRef} className="space-y-1">
              {log.map((entry, index) => (
                <li key={index} className="break-words">
                  <span className="opacity-50 mr-2">[{entry.timestamp}]</span>
                  {entry.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPanel;
