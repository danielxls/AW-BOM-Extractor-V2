import React from 'react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  userEmail: string;
  onLogout: () => void;
}

const AndersonWebbLogoMini = () => (
    <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="95" fill="#1C1C1E" stroke="#007AFF" strokeWidth="10"/>
        <path d="M60 140L100 60L140 140" stroke="#007AFF" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M80 110H120" stroke="white" strokeWidth="12" strokeLinecap="round"/>
    </svg>
);

const ValentaLogo = () => (
    <svg height="16" viewBox="0 0 85 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text 
            x="0" y="15" 
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'" 
            fontSize="18" 
            fontWeight="bold" 
            fill="#1C1C1E"
            textLength="85"
            lengthAdjust="spacingAndGlyphs"
        >VALENTA</text>
    </svg>
);


const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, userEmail, onLogout }) => {
  const navLinkClasses = (view: AppView) => 
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      currentView === view 
        ? 'bg-brand-blue text-white' 
        : 'text-brand-gray-700 hover:bg-brand-gray-200'
    }`;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AndersonWebbLogoMini />
            </div>
            <div className="hidden md:flex items-center ml-4">
              <div>
                  <h1 className="text-xl font-bold text-brand-gray-900">BOM Extractor</h1>
                  <p className="text-xs text-brand-gray-500 -mt-1">Anderson Webb Limited</p>
              </div>
              <div className="border-l border-brand-gray-300 h-8 mx-4"></div>
              <div className="flex items-center">
                  <p className="text-xs text-brand-gray-500 mr-2">Powered by</p>
                  <ValentaLogo />
              </div>
            </div>
            <div className="md:hidden ml-3">
                 <h1 className="text-lg font-bold text-brand-gray-900">BOM Extractor</h1>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => setCurrentView(AppView.Extractor)}
                className={navLinkClasses(AppView.Extractor)}
              >
                Extractor
              </button>
              <button
                onClick={() => setCurrentView(AppView.Dashboard)}
                className={navLinkClasses(AppView.Dashboard)}
              >
                Dashboard
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
                <div className="text-right">
                    <p className="text-sm font-medium text-brand-gray-800">{userEmail}</p>
                    <button onClick={onLogout} className="text-xs text-brand-blue hover:underline">
                        Logout
                    </button>
                </div>
            </div>
          </div>
          <div className="md:hidden">
            {/* Mobile menu user info and logout */}
             <div className="text-right">
                <p className="text-sm font-medium text-brand-gray-800 truncate">{userEmail}</p>
                <button onClick={onLogout} className="text-xs text-brand-blue hover:underline">
                    Logout
                </button>
            </div>
          </div>
        </div>
      </div>
       {/* Mobile Nav */}
      <div className="md:hidden border-t border-brand-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex justify-around gap-2">
            <button
              onClick={() => setCurrentView(AppView.Extractor)}
              className={`${navLinkClasses(AppView.Extractor)} w-full text-center`}
            >
              Extractor
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