import React, { useState } from 'react';
import Spinner from './common/Spinner';
import Icon from './common/Icon';

interface LoginProps {
  onLogin: (email: string) => void;
}

const AndersonWebbLogo = () => (
    <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="95" fill="#1C1C1E" stroke="#007AFF" strokeWidth="10"/>
        <path d="M60 140L100 60L140 140" stroke="#007AFF" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M80 110H120" stroke="white" strokeWidth="12" strokeLinecap="round"/>
    </svg>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call for authentication
    setTimeout(() => {
      // Use hardcoded credentials for this mock implementation
      if (email === 'user@valenta.io' && password === 'password') {
        onLogin(email);
      } else {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <div className="mx-auto mb-6 flex justify-center">
                 <AndersonWebbLogo />
            </div>
          <h1 className="text-2xl font-bold text-brand-gray-900 mb-2">BOM Extractor Login</h1>
          <p className="text-brand-gray-500 mb-8">Anderson Webb Limited Internal Tool</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              placeholder="Email (user@valenta.io)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-brand-gray-100 border-2 border-transparent text-brand-gray-900 placeholder:text-brand-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
            />
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (password)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-brand-gray-100 border-2 border-transparent text-brand-gray-900 placeholder:text-brand-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition pr-10"
              />
               <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-gray-500 hover:text-brand-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eyeSlash' : 'eye'} className="w-5 h-5" />
                </button>
            </div>
             {error && <p className="text-red-500 text-sm text-left">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-all duration-300 disabled:bg-brand-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <Spinner size="sm" /> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;