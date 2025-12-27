
import React, { useState, useCallback, useMemo, useRef } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import BomTable from './components/BomTable';
import MetricsDashboard from './components/MetricsDashboard';
import Spinner from './components/common/Spinner';
import Icon from './components/common/Icon';
import Login from './components/Login';
import PdfPreview from './components/PdfPreview';
import PageSelectorModal from './components/PageSelectorModal';
import ActivityPanel from './components/ActivityPanel';
import ConfirmationModal from './components/ConfirmationModal';
import { FileWithStatus, FileStatus, ExtractionStatus, BOMRecord, AppView, LogEntry, ExtractionSummary } from './types';
import { extractBOM } from './services/geminiService';
import { analyzePdf } from './services/pdfAnalyzerService';

// pdf-lib is loaded via a <script> tag and is available globally.
declare var PDFLib: any;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>(ExtractionStatus.Idle);
  const [bomData, setBomData] = useState<BOMRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.Extractor);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [selectingPagesFor, setSelectingPagesFor] = useState<File | null>(null);
  
  const [processingLog, setProcessingLog] = useState<LogEntry[]>([]);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [extractionSummary, setExtractionSummary] = useState<ExtractionSummary | null>(null);
  const timerRef = useRef<number | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState<{ fileCount: number; pageCount: number } | null>(null);


  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    // Reset app state
    setFiles([]);
    setBomData([]);
    setExtractionStatus(ExtractionStatus.Idle);
    setCurrentView(AppView.Extractor);
    setError(null);
    setPreviewFile(null);
    setSelectingPagesFor(null);
    setProcessingLog([]);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const newFileStatuses = newFiles
      .filter(file => !files.some(f => f.file.name === file.name))
      .map(file => ({ file, status: FileStatus.Pending, progress: 0 }));
      
    setFiles(prevFiles => [...prevFiles, ...newFileStatuses]);
    setExtractionStatus(ExtractionStatus.Idle);
    setBomData([]);
    setExtractionSummary(null);

    // Start analysis for each new file
    newFileStatuses.forEach(async (fileStatus) => {
        try {
            const analysis = await analyzePdf(fileStatus.file);
            setFiles(prevFiles => prevFiles.map(f => 
                f.file.name === fileStatus.file.name 
                ? { ...f, pageCount: analysis.pageCount }
                : f
            ));
        } catch (error) {
            console.error(`Failed to analyze ${fileStatus.file.name}:`, error);
             setFiles(prevFiles => prevFiles.map(f => 
                f.file.name === fileStatus.file.name 
                ? { ...f, status: FileStatus.Error, errorReason: 'Failed to analyze PDF.' }
                : f
            ));
        }
    });

  }, [files]);

  const handleFileRemoved = useCallback((fileName: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.file.name !== fileName));
    if (previewFile && previewFile.name === fileName) {
      setPreviewFile(null);
    }
    if (selectingPagesFor && selectingPagesFor.name === fileName) {
      setSelectingPagesFor(null);
    }
  }, [previewFile, selectingPagesFor]);

  const handleClearAll = useCallback(() => {
    setFiles([]);
    setBomData([]);
    setExtractionStatus(ExtractionStatus.Idle);
    setPreviewFile(null);
    setSelectingPagesFor(null);
    setProcessingLog([]);
    setExtractionSummary(null);
  }, []);
  
  const handlePreviewFile = (file: File) => {
    // If the same file is clicked, close the preview, otherwise open the new one.
    setPreviewFile(prev => (prev && prev.name === file.name ? null : file));
  };
  
  const handleSelectPages = (file: File) => {
    setSelectingPagesFor(file);
  };
  
  const handleUpdateSelectedPages = (fileName: string, pages: number[]) => {
    setFiles(prevFiles =>
      prevFiles.map(f => {
        if (f.file.name === fileName) {
          // If the user selected all pages, we store `undefined` to signify the default state.
          const allPagesSelected = pages.length === f.pageCount;
          return { ...f, selectedPages: allPagesSelected ? undefined : pages };
        }
        return f;
      })
    );
    setSelectingPagesFor(null); // Close modal
  };
  
  const addLog = (status: LogEntry['status'], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessingLog(prev => [...prev, { timestamp, status, message }]);
  };

  const handleStartExtraction = () => {
    if (isExtractionDisabled) return;

    const fileCount = files.length;
    const pageCount = files.reduce((acc, f) => {
      // If selectedPages is undefined, it means all pages are selected.
      return acc + (f.selectedPages?.length ?? f.pageCount ?? 0);
    }, 0);

    setConfirmationDetails({ fileCount, pageCount });
    setIsConfirmationVisible(true);
  };

  const executeExtraction = async () => {
    if (files.length === 0) return;
    
    isCancelledRef.current = false;
    setExtractionStatus(ExtractionStatus.Extracting);
    setError(null);
    setBomData([]);
    setProcessingLog([]);
    setPreviewFile(null); 
    setSelectingPagesFor(null);
    setElapsedTime(0);
    setEta(null);
    setExtractionSummary(null);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    addLog('info', `Starting extraction for ${files.length} file(s)...`);

    try {
      addLog('processing', 'Preparing files based on page selections...');
      const filesToProcess = await Promise.all(files.map(async (fileWithStatus) => {
        if (fileWithStatus.selectedPages && fileWithStatus.selectedPages.length > 0) {
            const { PDFDocument } = PDFLib;
            const originalPdfBytes = await fileWithStatus.file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(originalPdfBytes);
            const newPdfDoc = await PDFDocument.create();
            const pageIndices = fileWithStatus.selectedPages.map(p => p - 1);
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach(page => newPdfDoc.addPage(page));
            const newPdfBytes = await newPdfDoc.save();
            return new File([newPdfBytes], fileWithStatus.file.name, { type: 'application/pdf' });
        }
        return fileWithStatus.file;
      }));
      addLog('success', 'File preparation complete.');

      setFiles(prev => prev.map(f => ({ ...f, status: FileStatus.Processing })));

      const allResults: BOMRecord[] = [];
      const processedFileTimes: number[] = [];
      for (let i = 0; i < filesToProcess.length; i++) {
        if (isCancelledRef.current) {
            addLog('info', 'Process halted by user.');
            break;
        }

        const file = filesToProcess[i];
        const fileWithStatus = files[i];
        const fileStartTime = Date.now();

        setProcessingProgress({ current: i + 1, total: filesToProcess.length });
        addLog('processing', `Processing file ${i + 1}/${filesToProcess.length}: '${file.name}'...`);

        try {
            const onProgress = (message: string) => addLog('info', `  > ${message}`);
            const results = await extractBOM(file, onProgress);
            allResults.push(...results);
            
            const itemCount = results.reduce((sum, rec) => sum + rec.BOM.length, 0);
            addLog('success', `Success for '${file.name}': Extracted ${results.length} drawing(s) with ${itemCount} BOM items.`);
            
            setFiles(prev => prev.map(f => f.file.name === fileWithStatus.file.name ? { ...f, status: FileStatus.Success } : f));

        } catch (fileError) {
           const errorMessage = fileError instanceof Error ? fileError.message : 'An unknown error occurred.';
           addLog('error', `Error processing '${file.name}': ${errorMessage}`);
           setFiles(prev => prev.map(f => f.file.name === fileWithStatus.file.name ? { ...f, status: FileStatus.Error, errorReason: errorMessage } : f));
        } finally {
            const fileEndTime = Date.now();
            processedFileTimes.push((fileEndTime - fileStartTime) / 1000);
            const avgTime = processedFileTimes.reduce((a, b) => a + b, 0) / processedFileTimes.length;
            const remainingFiles = filesToProcess.length - (i + 1);
            setEta(avgTime * remainingFiles);
        }
      }

      // --- Post-processing logic ---
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const finalElapsedTime = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(finalElapsedTime);

      const attemptedFilesCount = files.filter(f => f.status === FileStatus.Success || f.status === FileStatus.Error).length;
      
      // If cancelled and no files were even attempted, just reset.
      if (isCancelledRef.current && attemptedFilesCount === 0) {
          setFiles(prev => prev.map(f => ({ ...f, status: FileStatus.Pending })));
          setExtractionStatus(ExtractionStatus.Idle);
          addLog('info', 'Process cancelled before any files were processed.');
          return;
      }

      // For both completed and stopped-with-results scenarios, generate a summary.
      const successCount = files.filter(f => f.status === FileStatus.Success).length;
      const errorCount = files.filter(f => f.status === FileStatus.Error).length;
      const totalItems = allResults.reduce((sum, rec) => sum + rec.BOM.length, 0);

      setExtractionSummary({
        filesProcessed: successCount + errorCount,
        successCount,
        errorCount,
        totalItems,
        totalTime: finalElapsedTime,
        completionReason: isCancelledRef.current ? 'stopped' : 'finished'
      });

      setBomData(allResults);
      setExtractionStatus(ExtractionStatus.Completed);

      if (isCancelledRef.current) {
          addLog('info', `Process stopped. Displaying results for ${successCount} successfully processed file(s).`);
          // Reset status for any files that were about to be processed but weren't
          setFiles(prev => prev.map(f => 
              f.status === FileStatus.Processing ? { ...f, status: FileStatus.Pending } : f
          ));
      } else {
          addLog('info', 'Extraction process completed.');
      }

    } catch (err) {
      if (timerRef.current) clearInterval(timerRef.current);
      console.error("Extraction failed:", err);
      const errorMessage = err instanceof Error ? err.message : 'A critical error occurred during file processing.';
      setError(errorMessage);
      addLog('error', `Critical error: ${errorMessage}`);
      setExtractionStatus(ExtractionStatus.Error);
    }
  };

  const handleStopExtraction = () => {
    isCancelledRef.current = true;
    addLog('error', 'Cancellation signal sent. The process will stop after the current file finishes.');
  };
  
  const handleViewResults = () => {
    setExtractionStatus(ExtractionStatus.Review);
  };
  
  const handleExportLog = () => {
      const logContent = processingLog
        .map(entry => `[${entry.timestamp}] [${entry.status.toUpperCase()}] ${entry.message}`)
        .join('\n');
      
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `bom-extraction-log-${timestamp}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };
  
  const isExtractionDisabled = useMemo(() => {
    const isAnalyzing = files.some(f => typeof f.pageCount === 'undefined');
    return files.length === 0 || extractionStatus === ExtractionStatus.Extracting || isAnalyzing;
  }, [files, extractionStatus]);

  const currentFileForPageSelection = useMemo(() => {
    if (!selectingPagesFor) return undefined;
    return files.find(f => f.file.name === selectingPagesFor.name);
  }, [selectingPagesFor, files]);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }
  
  const renderExtractorContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <div className="flex flex-col">
           <div className="flex-shrink-0 pb-6">
            <button
              onClick={handleStartExtraction}
              disabled={isExtractionDisabled}
              className="w-full bg-primary text-white font-bold py-4 px-4 rounded-xl shadow-md hover:bg-primary/90 transition-all duration-300 disabled:bg-brand-gray-300 dark:disabled:bg-brand-gray-700 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center text-lg"
            >
              Start BOM Extraction
            </button>
          </div>
          <div className="flex-grow min-h-0 overflow-y-auto pr-2">
            <div className="flex flex-col gap-6">
              <FileUploader
                files={files}
                onFilesAdded={handleFilesAdded}
                onFileRemoved={handleFileRemoved}
                onClearAll={handleClearAll}
                onPreview={handlePreviewFile}
                onSelectPages={handleSelectPages}
                isProcessing={extractionStatus === ExtractionStatus.Extracting}
              />
              {previewFile && (
                <PdfPreview file={previewFile} onClose={() => setPreviewFile(null)} />
              )}
            </div>
          </div>
        </div>
        <div className="h-full">
          <>
            {(extractionStatus === ExtractionStatus.Extracting || extractionStatus === ExtractionStatus.Completed) && (
                <ActivityPanel 
                    status={extractionStatus}
                    log={processingLog}
                    progress={processingProgress}
                    elapsedTime={elapsedTime}
                    eta={eta}
                    summary={extractionSummary}
                    onViewResults={handleViewResults}
                    onExportLog={handleExportLog}
                    onStop={handleStopExtraction}
                />
            )}
            {extractionStatus === ExtractionStatus.Error && (
                 <div className="text-center p-8 bg-white dark:bg-brand-gray-900 rounded-xl shadow-sm h-full flex flex-col justify-center items-center">
                    <Icon name="xCircle" className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-red-700 dark:text-red-500">Extraction Failed</h3>
                    <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">{error}</p>
                </div>
            )}
            {(extractionStatus === ExtractionStatus.Idle || extractionStatus === ExtractionStatus.Review) && <BomTable data={bomData} />}
          </>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        userEmail={userEmail}
        onLogout={handleLogout}
       />
       
      {currentFileForPageSelection && (
        <PageSelectorModal
            file={currentFileForPageSelection.file}
            pageCount={currentFileForPageSelection.pageCount!}
            initialSelectedPages={currentFileForPageSelection.selectedPages}
            onClose={() => setSelectingPagesFor(null)}
            onConfirm={(pages) => handleUpdateSelectedPages(currentFileForPageSelection.file.name, pages)}
        />
      )}

      {isConfirmationVisible && confirmationDetails && (
        <ConfirmationModal
            fileCount={confirmationDetails.fileCount}
            pageCount={confirmationDetails.pageCount}
            onConfirm={() => {
                setIsConfirmationVisible(false);
                executeExtraction();
            }}
            onCancel={() => setIsConfirmationVisible(false)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">
        {currentView === AppView.Extractor ? renderExtractorContent() : <MetricsDashboard data={bomData} />}
      </main>
    </div>
  );
};

export default App;
