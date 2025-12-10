import React from 'react';
import { AppView } from '../types';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  userEmail: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, userEmail, onLogout }) => {
  const navLinkClasses = (view: AppView) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === view
      ? 'bg-primary text-white'
      : 'text-brand-gray-700 dark:text-brand-gray-300 hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700'
    }`;

  return (
    <header className="bg-white dark:bg-brand-gray-900/80 dark:backdrop-blur-sm shadow-sm sticky top-0 z-50 dark:border-b dark:border-brand-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="hidden md:flex items-center">
              <div>
                <h1 className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100">BOM Extractor</h1>
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 -mt-1">Anderson Webb Limited</p>
              </div>
            </div>
            <div className="md:hidden">
              <h1 className="text-lg font-bold text-brand-gray-900 dark:text-brand-gray-100">BOM Extractor</h1>
            </div>
          </div>

          <div className="hidden md:block flex-1">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setCurrentView(AppView.Extractor)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === AppView.Extractor
                  ? 'bg-brand-gray-900 text-white dark:bg-brand-gray-100 dark:text-brand-gray-900'
                  : 'text-brand-gray-600 dark:text-brand-gray-300 hover:text-brand-gray-900 dark:hover:text-white hover:bg-brand-gray-100 dark:hover:bg-brand-gray-800'
                  }`}
              >
                Extractor
              </button>
              <button
                onClick={() => setCurrentView(AppView.Consolidation)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === AppView.Consolidation
                  ? 'bg-brand-gray-900 text-white dark:bg-brand-gray-100 dark:text-brand-gray-900'
                  : 'text-brand-gray-600 dark:text-brand-gray-300 hover:text-brand-gray-900 dark:hover:text-white hover:bg-brand-gray-100 dark:hover:bg-brand-gray-800'
                  }`}
              >
                Consolidation
              </button>
              <button
                onClick={() => setCurrentView(AppView.Dashboard)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === AppView.Dashboard
                  ? 'bg-brand-gray-900 text-white dark:bg-brand-gray-100 dark:text-brand-gray-900'
                  : 'text-brand-gray-600 dark:text-brand-gray-300 hover:text-brand-gray-900 dark:hover:text-white hover:bg-brand-gray-100 dark:hover:bg-brand-gray-800'
                  }`}
              >
                Dashboard
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 gap-3">
              <ThemeToggle />
              <div className="text-right border-l pl-3 border-brand-gray-300 dark:border-brand-gray-700">
                <p className="text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200">{userEmail}</p>
                <button onClick={onLogout} className="text-xs text-primary hover:underline">
                  Logout
                </button>
              </div>
            </div>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            {/* Mobile menu user info and logout */}
            <div className="text-right">
              <p className="text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200 truncate max-w-[120px]">{userEmail}</p>
              <button onClick={onLogout} className="text-xs text-primary hover:underline">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Nav */}
      <div className="md:hidden border-t border-brand-gray-200 dark:border-brand-gray-800">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex justify-around gap-2">
          <button
            onClick={() => setCurrentView(AppView.Extractor)}
            className={`${navLinkClasses(AppView.Extractor)} w-full text-center`}
          >
            Extractor
          </button>
          <button
            onClick={() => setCurrentView(AppView.Consolidation)}
            className={`${navLinkClasses(AppView.Consolidation)} w-full text-center`}
          >
            Consolidation
          </button>
          <button
            onClick={() => setCurrentView(AppView.Dashboard)}
            className={`${navLinkClasses(AppView.Dashboard)} w-full text-center`}
          >
            Dashboard
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;