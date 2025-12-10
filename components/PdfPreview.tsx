import React, { useState, useEffect, useRef } from 'react';
import Icon from './common/Icon';
import Spinner from './common/Spinner';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

interface PdfPreviewProps {
  file: File;
  onClose: () => void;
}

// A sub-component to render a single page of a PDF onto a canvas.
const PdfPage: React.FC<{ pdf: any; pageNumber: number; scale: number }> = ({ pdf, pageNumber, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    // If a render task is already running, cancel it
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }
    
    const canvas = canvasRef.current;
    if (pdf && canvas) {
      pdf.getPage(pageNumber).then((page: any) => {
        if (!canvasRef.current) return; // Component might have unmounted

        const viewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const renderTask = page.render({ canvasContext: context, viewport: viewport });
          renderTaskRef.current = renderTask;

          renderTask.promise.catch((err: any) => {
            if (err.name !== 'RenderingCancelledException') {
              console.error('PDF Page render error:', err);
            }
          });
        }
      });
    }

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNumber, scale]);

  return <canvas ref={canvasRef} className="max-w-none h-auto shadow-lg rounded" />;
};


const PdfPreview: React.FC<PdfPreviewProps> = ({ file, onClose }) => {
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setPdf(null);
        setCurrentPage(1);
        setZoom(1.0);
        
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDocument = await loadingTask.promise;
        
        setPdf(pdfDocument);
        setNumPages(pdfDocument.numPages);
      } catch (e) {
        console.error("Failed to load PDF for preview:", e);
        setError("Could not load PDF file for preview. It may be corrupted.");
      } finally {
        setIsLoading(false);
      }
    };
    loadPdf();
  }, [file]);

  const controlButtonClasses = "p-1.5 rounded-md text-brand-gray-600 dark:text-brand-gray-300 hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-sm h-[70vh] max-h-[800px] flex flex-col animate-fade-in">
      <header className="flex items-center justify-between p-4 border-b border-brand-gray-200 dark:border-brand-gray-800 flex-shrink-0">
        <h2 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-200 truncate pr-4" title={file.name}>
          Preview: {file.name}
        </h2>
        <button onClick={onClose} className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-brand-gray-600 dark:text-brand-gray-300 bg-brand-gray-200 dark:bg-brand-gray-700 hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600 transition-colors">
          <Icon name="xmark" className="w-5 h-5" />
          <span>Close</span>
        </button>
      </header>
      
      {!isLoading && !error && pdf && (
        <div className="flex items-center justify-center p-2 space-x-4 border-b border-brand-gray-200 dark:border-brand-gray-800 flex-shrink-0 bg-brand-gray-50 dark:bg-brand-gray-900/50">
           {/* Pagination */}
           <div className="flex items-center space-x-2">
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage <= 1} className={controlButtonClasses}>
                <Icon name="chevronLeft" className="w-5 h-5" />
              </button>
              <span className="text-sm text-brand-gray-700 dark:text-brand-gray-300 font-medium w-20 text-center">Page {currentPage} / {numPages}</span>
               <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= numPages} className={controlButtonClasses}>
                <Icon name="chevronRight" className="w-5 h-5" />
              </button>
           </div>
           
           <div className="w-px h-6 bg-brand-gray-300 dark:bg-brand-gray-700"></div>

           {/* Zoom Controls */}
           <div className="flex items-center space-x-2">
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} disabled={zoom <= 0.2} className={controlButtonClasses}>
                <Icon name="minus" className="w-5 h-5" />
              </button>
              <span className="text-sm text-brand-gray-700 dark:text-brand-gray-300 font-medium w-16 text-center">{(zoom * 100).toFixed(0)}%</span>
               <button onClick={() => setZoom(z => Math.min(3.0, z + 0.2))} disabled={zoom >= 3.0} className={controlButtonClasses}>
                <Icon name="plus" className="w-5 h-5" />
              </button>
           </div>
        </div>
      )}
      
      <main className="flex-grow p-4 overflow-auto bg-brand-gray-100 dark:bg-brand-gray-800">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Spinner text="Loading Preview..." />
          </div>
        )}
        {error && (
           <div className="flex items-center justify-center h-full text-center text-red-500 p-4">
              <div>
                <Icon name="xmark" className="w-12 h-12 text-red-400 mx-auto mb-2" />
                <p>{error}</p>
              </div>
          </div>
        )}
        {!isLoading && !error && pdf && (
          <div className="flex justify-center p-2">
             <PdfPage key={`page_${currentPage}_${zoom}`} pdf={pdf} pageNumber={currentPage} scale={zoom} />
          </div>
        )}
      </main>
    </div>
  );
};

export default PdfPreview;