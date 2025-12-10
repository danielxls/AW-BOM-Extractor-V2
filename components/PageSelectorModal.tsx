import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from './common/Icon';
import Spinner from './common/Spinner';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

interface PageSelectorModalProps {
  file: File;
  pageCount: number;
  initialSelectedPages?: number[];
  onClose: () => void;
  onConfirm: (selectedPages: number[]) => void;
}

interface PdfPageViewerProps {
  pdf: any;
  pageNumber: number;
  pageCount: number;
  setPageNumber: (page: number) => void;
  selectedPages: Set<number>;
  onTogglePage: (pageNumber: number) => void;
}


// Sub-component for rendering the large page preview with zoom controls
const PdfPageViewer: React.FC<PdfPageViewerProps> = ({ pdf, pageNumber, pageCount, setPageNumber, selectedPages, onTogglePage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1.0);
  const renderTaskRef = useRef<any>(null);
  const isSelected = selectedPages.has(pageNumber);

  const fitToContainer = useCallback(() => {
    if (!pdf || !containerRef.current) return;
    
    pdf.getPage(pageNumber).then((page: any) => {
        if (!containerRef.current) return; // Re-check after async operation
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const viewport = page.getViewport({ scale: 1 });

        if (viewport.width > 0 && containerWidth > 0 && viewport.height > 0 && containerHeight > 0) {
            const widthScale = (containerWidth / viewport.width) * 0.95; // Use 95% for padding
            const heightScale = (containerHeight / viewport.height) * 0.95;
            setScale(Math.min(widthScale, heightScale)); // Use the smaller scale to ensure the whole page fits
        }
    });
  }, [pdf, pageNumber]);


  // Effect to render the PDF page whenever scale or page number changes
  useEffect(() => {
    if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
    }
    
    const canvas = canvasRef.current;
    if (pdf && canvas) {
      pdf.getPage(pageNumber).then((page: any) => {
        if (!canvasRef.current) return; // Component may have unmounted

        const scaledViewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = scaledViewport.height;
          canvas.width = scaledViewport.width;
          
          const renderTask = page.render({ canvasContext: context, viewport: scaledViewport });
          renderTaskRef.current = renderTask;
          
          renderTask.promise.catch((err: any) => {
            if (err.name !== 'RenderingCancelledException') {
                console.error('PDF Viewer render error:', err);
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

  // Effect to calculate and set the initial scale when the page changes
  useEffect(() => {
    fitToContainer();
    // Add a resize listener to refit the page when the window size changes
    window.addEventListener('resize', fitToContainer);
    return () => window.removeEventListener('resize', fitToContainer);
  }, [fitToContainer]);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 4.0));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.25));
  const handleResetZoom = () => fitToContainer();

  return (
    <div className="w-full h-full flex flex-col bg-brand-gray-200 dark:bg-brand-gray-900/50">
        <div ref={containerRef} className="flex-grow overflow-auto p-4 flex justify-center items-start">
            <canvas ref={canvasRef} className="max-w-none h-auto shadow-lg rounded-sm" />
        </div>

        <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 bg-white dark:bg-brand-gray-800/80 backdrop-blur-sm border-t border-brand-gray-200 dark:border-brand-gray-700">
            {/* Previous Button */}
            <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-brand-gray-600 dark:text-brand-gray-400 mb-1">Previous</span>
                <button
                    onClick={() => setPageNumber(pageNumber - 1)}
                    disabled={pageNumber <= 1}
                    className="p-2 border-2 border-brand-gray-300 dark:border-brand-gray-600 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 hover:border-primary dark:hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous Page"
                >
                    <Icon name="chevronLeft" className="w-8 h-8" />
                </button>
            </div>

            {/* Central Controls */}
            <div className="flex items-center space-x-4">
                {/* Select Page Button */}
                <button
                    onClick={() => onTogglePage(pageNumber)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600'
                    }`}
                >
                    <Icon name={isSelected ? 'check' : 'plus'} className="w-5 h-5" />
                    <span>{isSelected ? 'Selected' : 'Select Page'}</span>
                </button>
                
                <div className="w-px h-8 bg-brand-gray-300 dark:bg-brand-gray-600"></div>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-3">
                    <button onClick={handleZoomOut} disabled={scale <= 0.25} className="p-1.5 text-brand-gray-500 hover:text-primary dark:text-brand-gray-400 dark:hover:text-primary transition-colors disabled:opacity-50" title="Zoom Out">
                        <Icon name="minus" className="w-6 h-6" />
                    </button>
                    <span className="text-base font-semibold text-brand-gray-800 dark:text-brand-gray-200 w-16 text-center tabular-nums">{(scale * 100).toFixed(0)}%</span>
                    <button onClick={handleZoomIn} disabled={scale >= 4.0} className="p-1.5 text-brand-gray-500 hover:text-primary dark:text-brand-gray-400 dark:hover:text-primary transition-colors disabled:opacity-50" title="Zoom In">
                        <Icon name="plus" className="w-6 h-6" />
                    </button>
                    <div className="w-px h-6 bg-brand-gray-300 dark:bg-brand-gray-600"></div>
                    <button onClick={handleResetZoom} className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Fit to view">
                        Fit
                    </button>
                </div>

                <div className="w-px h-8 bg-brand-gray-300 dark:bg-brand-gray-600"></div>

                {/* Page Number Display */}
                <div className="text-base font-semibold text-brand-gray-800 dark:text-brand-gray-200 w-28 text-center tabular-nums">
                    Page {pageNumber} / {pageCount}
                </div>
            </div>
            
            {/* Next Button */}
            <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-brand-gray-600 dark:text-brand-gray-400 mb-1">Next</span>
                <button
                    onClick={() => setPageNumber(pageNumber + 1)}
                    disabled={pageNumber >= pageCount}
                    className="p-2 border-2 border-brand-gray-300 dark:border-brand-gray-600 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 hover:border-primary dark:hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next Page"
                >
                    <Icon name="chevronRight" className="w-8 h-8" />
                </button>
            </div>
        </div>
    </div>
  );
};

// Sub-component for rendering a single page thumbnail
const PageThumbnail: React.FC<{ pdf: any; pageNumber: number; isSelected: boolean; onToggle: () => void; onPreview: () => void; }> = ({ pdf, pageNumber, isSelected, onToggle, onPreview }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (pdf && canvas) {
      // If a render task is already running, cancel it
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      
      pdf.getPage(pageNumber).then((page: any) => {
        if (!canvasRef.current) return; // Component may have unmounted
        
        const desiredWidth = 120; // Thumbnail width
        const viewport = page.getViewport({ scale: 1 });
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = scaledViewport.height;
          canvas.width = scaledViewport.width;
          
          const renderTask = page.render({ canvasContext: context, viewport: scaledViewport });
          renderTaskRef.current = renderTask;

          renderTask.promise.catch((err: any) => {
            if (err.name !== 'RenderingCancelledException') {
              console.error('Thumbnail render error:', err);
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
  }, [pdf, pageNumber]);

  return (
    <div 
        onClick={onToggle}
        className={`relative group cursor-pointer rounded-md overflow-hidden border-2 transition-all duration-200 ${
            isSelected ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/50'
        }`}
    >
        <canvas ref={canvasRef} className="block bg-white" />
        
        {/* Hover overlay for preview button */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent toggling selection when clicking preview
                    onPreview();
                }}
                className="flex items-center space-x-1.5 bg-white/90 text-black px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-white"
            >
                <Icon name="eye" className="w-4 h-4" />
                <span>Preview</span>
            </button>
        </div>

        {isSelected && (
            <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 pointer-events-none">
                <Icon name="check" className="w-3 h-3" />
            </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 pointer-events-none">
            {pageNumber}
        </div>
    </div>
  );
};


const PageSelectorModal: React.FC<PageSelectorModalProps> = ({ file, pageCount, initialSelectedPages, onClose, onConfirm }) => {
  const [pdf, setPdf] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [previewPageNumber, setPreviewPageNumber] = useState<number>(1); // Default to previewing page 1

  // Initialize selected pages from props
  useEffect(() => {
    if (initialSelectedPages) {
      setSelectedPages(new Set(initialSelectedPages));
    } else {
      // If no pages are pre-selected, select all by default
      const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);
      setSelectedPages(new Set(allPages));
    }
  }, [initialSelectedPages, pageCount]);


  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDocument = await loadingTask.promise;
        setPdf(pdfDocument);
      } catch (e) {
        console.error("Failed to load PDF for page selection:", e);
        setError("Could not load PDF file. It may be corrupted.");
      } finally {
        setIsLoading(false);
      }
    };
    loadPdf();
  }, [file]);

  const handleTogglePage = (pageNumber: number) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);
    setSelectedPages(new Set(allPages));
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
  };
  
  const handleConfirm = () => {
    onConfirm(Array.from(selectedPages).sort((a: number, b: number) => a - b));
  };
  
  const isSelectAllDisabled = selectedPages.size === pageCount;
  const isDeselectAllDisabled = selectedPages.size === 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-brand-gray-200 dark:border-brand-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-brand-gray-900 dark:text-brand-gray-100">Select Pages to Process</h2>
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 truncate" title={file.name}>{file.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700">
            <Icon name="xmark" className="w-6 h-6 text-brand-gray-600 dark:text-brand-gray-300" />
          </button>
        </header>

        <div className="flex-shrink-0 p-3 border-b border-brand-gray-200 dark:border-brand-gray-800 bg-brand-gray-50 dark:bg-brand-gray-800/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <button onClick={handleSelectAll} disabled={isSelectAllDisabled} className="px-3 py-1.5 rounded-md text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 border border-brand-gray-300 dark:border-brand-gray-600 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Select All</button>
                <button onClick={handleDeselectAll} disabled={isDeselectAllDisabled} className="px-3 py-1.5 rounded-md text-sm font-medium text-brand-gray-700 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-700 border border-brand-gray-300 dark:border-brand-gray-600 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Deselect All</button>
            </div>
            <p className="text-sm font-semibold text-brand-gray-800 dark:text-brand-gray-200">
                {selectedPages.size} / {pageCount} pages selected
            </p>
        </div>

        <main className="flex-grow p-4 overflow-hidden bg-brand-gray-100 dark:bg-brand-gray-800/50 flex gap-4">
          {/* Left Panel: Thumbnails */}
          <div className="w-1/3 overflow-y-auto pr-2">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <Spinner text="Loading Pages..." />
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full text-center text-red-500 p-4">
                <p>{error}</p>
              </div>
            )}
            {!isLoading && !error && pdf && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNumber => (
                  <PageThumbnail 
                    key={pageNumber}
                    pdf={pdf}
                    pageNumber={pageNumber}
                    isSelected={selectedPages.has(pageNumber)}
                    onToggle={() => handleTogglePage(pageNumber)}
                    onPreview={() => setPreviewPageNumber(pageNumber)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Right Panel: Preview */}
          <div className="w-2/3 h-full bg-white dark:bg-brand-gray-800 rounded-lg shadow-inner overflow-hidden flex items-center justify-center">
             {isLoading && (
                <Spinner text="Loading Preview..." />
             )}
             {error && (
                <div className="text-center text-red-500 p-4">Could not load preview.</div>
             )}
             {!isLoading && !error && pdf && (
                <PdfPageViewer 
                    key={previewPageNumber} 
                    pdf={pdf} 
                    pageNumber={previewPageNumber}
                    pageCount={pageCount}
                    setPageNumber={setPreviewPageNumber}
                    selectedPages={selectedPages}
                    onTogglePage={handleTogglePage}
                />
             )}
          </div>
        </main>
        
        <footer className="flex-shrink-0 p-4 border-t border-brand-gray-200 dark:border-brand-gray-800 flex justify-end space-x-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600"
            >
                Cancel
            </button>
            <button
                onClick={handleConfirm}
                disabled={selectedPages.size === 0}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:bg-brand-gray-300 dark:disabled:bg-brand-gray-600 disabled:cursor-not-allowed"
            >
                Confirm Selection
            </button>
        </footer>
      </div>
    </div>
  );
};

export default PageSelectorModal;