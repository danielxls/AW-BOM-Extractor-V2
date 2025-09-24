import React, { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import BomTable from './components/BomTable';
import MetricsDashboard from './components/MetricsDashboard';
import Spinner from './components/common/Spinner';
import Icon from './components/common/Icon';
import Login from './components/Login';
import { FileWithStatus, FileStatus, ExtractionStatus, BOMRecord, AppView } from './types';
import { extractBOM } from './services/geminiService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>(ExtractionStatus.Idle);
  const [bomData, setBomData] = useState<BOMRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.Extractor);

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
  };

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const newFileStatuses = newFiles
        .filter(file => !files.some(f => f.file.name === file.name))
        .map(file => ({ file, status: FileStatus.Pending, progress: 0 }));
    setFiles(prevFiles => [...prevFiles, ...newFileStatuses]);
    setExtractionStatus(ExtractionStatus.Idle);
    setBomData([]);
  }, [files]);

  const handleFileRemoved = useCallback((fileName: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.file.name !== fileName));
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
    setBomData([]);
    setExtractionStatus(ExtractionStatus.Idle);
  }, []);

  const handleStartExtraction = async () => {
    if (files.length === 0) return;
    
    setExtractionStatus(ExtractionStatus.Extracting);
    setError(null);
    setBomData([]);

    try {
      const selectedFiles = files.map(f => f.file);
      const results = await extractBOM(selectedFiles);
      setBomData(results);
      setExtractionStatus(ExtractionStatus.Review);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setExtractionStatus(ExtractionStatus.Error);
    }
  };
  
  const isExtractionDisabled = useMemo(() => {
    return files.length === 0 || extractionStatus === ExtractionStatus.Extracting;
  }, [files, extractionStatus]);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderExtractorContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <div className="flex flex-col gap-6">
          <FileUploader
            files={files}
            onFilesAdded={handleFilesAdded}
            onFileRemoved={handleFileRemoved}
            onClearAll={handleClearAll}
          />
          <button
            onClick={handleStartExtraction}
            disabled={isExtractionDisabled}
            className="w-full bg-brand-blue text-white font-bold py-4 px-4 rounded-xl shadow-md hover:bg-blue-600 transition-all duration-300 disabled:bg-brand-gray-300 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center text-lg"
          >
            {extractionStatus === ExtractionStatus.Extracting ? (
              <>
                <Spinner size="sm" />
                <span className="ml-3">Extracting BOM...</span>
              </>
            ) : (
              'Start BOM Extraction'
            )}
          </button>
        </div>
        <div className="h-full">
            {extractionStatus === ExtractionStatus.Error && (
                 <div className="text-center p-8 bg-white rounded-xl shadow-sm h-full flex flex-col justify-center items-center">
                    <Icon name="xmark" className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-red-800">Extraction Failed</h3>
                    <p className="text-brand-gray-600 mt-2">{error}</p>
                </div>
            )}
            {(extractionStatus !== ExtractionStatus.Error) && <BomTable data={bomData} />}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-gray-100 font-sans text-brand-gray-900 flex flex-col">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        userEmail={userEmail}
        onLogout={handleLogout}
       />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">
        {currentView === AppView.Extractor ? renderExtractorContent() : <MetricsDashboard data={bomData} />}
      </main>
    </div>
  );
};

export default App;