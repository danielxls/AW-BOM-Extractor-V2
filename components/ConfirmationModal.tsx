import React from 'react';
import Icon from './common/Icon';

interface ConfirmationModalProps {
  fileCount: number;
  pageCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ fileCount, pageCount, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
               <Icon name="info" className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100">
                Confirm Extraction
            </h3>
            <div className="mt-4 text-brand-gray-600 dark:text-brand-gray-400 space-y-2">
                <p>
                    You are about to start the extraction process for{' '}
                    <strong className="text-brand-gray-800 dark:text-brand-gray-200">{fileCount} file{fileCount !== 1 && 's'}</strong>{' '}
                    with a total of{' '}
                    <strong className="text-brand-gray-800 dark:text-brand-gray-200">{pageCount} selected pages</strong>.
                </p>
                <p className="text-sm">
                    This will start the AI analysis and may take several minutes.
                    Please confirm you wish to proceed.
                </p>
            </div>
        </div>
        <div className="flex justify-stretch items-center bg-brand-gray-100 dark:bg-brand-gray-800/50 px-6 py-4 rounded-b-xl space-x-4">
            <button
                type="button"
                onClick={onCancel}
                className="w-full justify-center rounded-lg bg-brand-gray-200 dark:bg-brand-gray-700 py-3 px-4 text-base font-semibold text-brand-gray-800 dark:text-brand-gray-200 hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600 transition-colors"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={onConfirm}
                className="w-full justify-center rounded-lg bg-primary py-3 px-4 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:bg-primary/90 focus:outline-none"
            >
                Confirm & Start
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
