import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in (e.g. after clicking Magic Link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        validateAndLogin(session.user.email);
      }
    };

    checkSession();

    // Listen for auth changes (redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        validateAndLogin(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [onLogin]);

  const validateAndLogin = (userEmail: string) => {
    if (userEmail.endsWith('@andersonwebb.com') || userEmail.endsWith('@valenta.io') || userEmail === 'dev@andersonwebb.com' || userEmail === 'danielrrq@gmail.com') {
      onLogin(userEmail);
    } else {
      setError('Access restricted to authorized domains.');
      supabase.auth.signOut();
    }
  }

  // Step 1: Send OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Domain Validation
    if (!email.endsWith('@andersonwebb.com') && !email.endsWith('@valenta.io') && email !== 'dev@andersonwebb.com' && email !== 'danielrrq@gmail.com') {
      setError('Access restricted to authorized domains.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;

      setStep('OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (error) throw error;

      if (data.session) {
        onLogin(email);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('EMAIL');
    setOtpCode('');
    setError('');
  };

  return (
    <div className="relative flex min-h-screen w-full">
      {/* LEFT PANEL - High Fidelity Visuals (Unchanged) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBQ50FMsfPBmUUJ2jTwgjD4V6KTz28G4vzWGknPt0RzzSpma4SJcGbqAfhAuVCenAH4wThQ8561v5cQzn02otbRBqmtEkZeCVkOT8MgcxbezGV4C6LX8U74bDwAkGCYbi8CY3bzKtEc-TUdKQeyBQLNy5cbQCOGK3Ffy82PFjxg4TIaLF7XMaSUIvMrsZzMZjiCr19zqww9lGQZehyCqfrd0VyjmHFHxC5LeAurdG8-7Cri1yR3HLMQMN0MmZHm17p6fkdwK1y0tEg')" }}></div>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10"></div>

        {/* Top Text: Valenta Logo (SVG Embed) */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20">
          {/* Embedded SVG to ensure visibility without external assets */}
          <svg width="240" height="100" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
            <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="48" fontFamily="Inter, sans-serif" fontWeight="bold" letterSpacing="0.05em">VALENTA</text>
            <text x="50%" y="75%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontFamily="Inter, sans-serif" fontWeight="400" letterSpacing="0.05em" opacity="0.9">Save Time. Save Money.</text>
          </svg>
        </div>

        <div className="relative z-20 text-center">
          <h2 className="text-4xl font-bold text-white drop-shadow-lg">
            Bill of Materials Extractor
          </h2>
          <p className="mt-4 text-xl text-white/80 drop-shadow-lg">
            Extracting data with accuracy.
          </p>
        </div>

        {/* Bottom Text */}
        <h2 className="absolute bottom-28 left-1/2 transform -translate-x-1/2 text-xl font-normal text-white/80 drop-shadow-lg z-20 w-full text-center leading-tight">
          An AI Solution<br />
          for<br />
          Anderson Webb Limited
        </h2>
      </div>

      {/* RIGHT PANEL - Authentication Logic */}
      <main className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="bg-background-light/80 dark:bg-background-dark/50 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/20 ring-1 ring-black/10 dark:ring-white/10 p-8 transition-all duration-500">

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
                {step === 'EMAIL' ? 'BOM Extractor Login' : 'Verify Identity'}
              </h1>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                {step === 'EMAIL'
                  ? 'Anderson Webb Limited Internal Tool'
                  : `Please enter the code sent to ${email}`
                }
              </p>
            </div>

            {step === 'EMAIL' ? (
              // --- STEP 1: EMAIL INPUT ---
              <form onSubmit={handleSendCode} className="space-y-6 animate-fade-in">
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">mail</span>
                  <input
                    type="email"
                    className="w-full rounded-lg border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 py-3 pl-12 pr-4 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:border-primary focus:ring-primary/50 focus:ring-2 transition-all"
                    placeholder="Enter authorized email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {error && <p className="text-red-500 text-sm text-left">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center rounded-lg bg-primary py-3 px-4 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Login Code'
                  )}
                </button>
              </form>
            ) : (
              // --- STEP 2: OTP INPUT ---
              <form onSubmit={handleVerifyCode} className="space-y-6 animate-fade-in">
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">lock</span>
                  <input
                    type="text"
                    maxLength={8}
                    className="w-full rounded-lg border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 py-3 pl-12 pr-4 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:border-primary focus:ring-primary/50 focus:ring-2 tracking-[0.5em] font-mono text-center text-lg transition-all"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    autoFocus
                  />
                </div>

                {error && <p className="text-red-500 text-sm text-left">{error}</p>}

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length < 6}
                    className="group relative flex w-full justify-center rounded-lg bg-primary py-3 px-4 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="w-full justify-center text-sm text-black/50 dark:text-white/50 hover:text-primary transition-colors"
                  >
                    ← Back to verify a different email
                  </button>
                </div>
              </form>
            )}

            <p className="mt-8 text-center text-xs text-black/50 dark:text-white/50">
              © 2025 Anderson Webb Limited — Internal Engineering Tool
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
