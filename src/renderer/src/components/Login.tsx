import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLoginSuccess: (apiKey: string, userName: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for the deep link login payload from the Main process
    const removeListener = window.electron.ipcRenderer.on('launcher-login', (_event, args) => {
      if (args && args.apiKey) {
        onLoginSuccess(args.apiKey, args.name || 'Livooth User');
      }
    });

    return () => {
      // Clean up listener
      removeListener();
    };
  }, [onLoginSuccess]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Automatically switch between localhost for dev and livoothgames.com for prod
    const isDev = import.meta.env.DEV;
    const loginUrl = isDev 
      ? 'http://localhost:5173/launcher-login' 
      : 'https://livoothgames.com/launcher-login';
      
    // Open the user's default web browser
    window.open(loginUrl, '_blank');
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-950 text-white w-full h-full absolute inset-0 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-gray-950 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md p-10 bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col items-center transform transition-all hover:scale-[1.01] duration-500 relative z-10">
        
        {/* Animated Logo */}
        <div className="relative group mb-8 cursor-pointer">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>
          <div className="relative w-24 h-24 rounded-full bg-gray-950 flex shadow-2xl items-center justify-center border border-gray-800/80">
            <span className="bg-clip-text text-transparent bg-gradient-to-tr from-blue-400 to-purple-400 text-2xl font-extrabold text-center leading-tight tracking-tighter">Livooth<br/>Games</span>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-2 text-center text-white tracking-tight">Welcome Back</h2>
        <p className="text-gray-400 text-sm mb-10 text-center font-medium">Continue securely with your Web Browser</p>
        
        <form onSubmit={handleLogin} className="w-full space-y-6">
          <button
            type="submit"
            className="group relative w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.5)] flex justify-center items-center overflow-hidden"
          >
            {/* Shimmer effect inside button - CSS pure translate */}
            <div className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1500ms] ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
            
            <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Waiting for Authentication...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                  </svg>
                  Login with Web Browser
                </>
              )}
            </span>
          </button>
        </form>
        
        <div className="mt-10 text-center text-sm text-gray-500">
          Need a subscription? <a href="https://livoothgames.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-medium transition-colors border-b border-transparent hover:border-blue-300 ml-1">Visit Livooth Games</a>
        </div>
      </div>
    </div>
  );
}
