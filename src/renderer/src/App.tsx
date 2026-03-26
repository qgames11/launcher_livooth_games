import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import MainLayout from './components/MainLayout';

export type Language = 'ko' | 'en' | 'id';

function App(): React.JSX.Element {
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('livooth-api-key'));
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('livooth-user-name') || 'Premium User');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [trueApiKey, setTrueApiKey] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('ko');

  useEffect(() => {
    const saved = localStorage.getItem('livooth-lang') as Language;
    if (saved === 'ko' || saved === 'en' || saved === 'id') {
      setLanguage(saved);
    } else {
      const isId = navigator.language.startsWith('id');
      const isKo = navigator.language.startsWith('ko');
      setLanguage(isKo ? 'ko' : isId ? 'id' : 'en');
    }
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkSubscription = async () => {
      if (!apiKey) return;
      try {
        const res = await fetch(`https://livoothgames-production.up.railway.app/launcher/login?apiKey=${apiKey}`);
        const data = await res.json();
        if (data.success) {
          setUserName(data.name);
          setIsSubscribed(data.isSubscribed);
          setTrueApiKey(data.trueApiKey);
        } else if (data.error === 'Invalid or inactive API Key') {
          handleLogout(); // Kick user out if API key was revoked
        }
      } catch (err) {
        console.error('Failed to sync auth state', err);
      }
    };

    if (apiKey) {
      checkSubscription(); // Initial check
      interval = setInterval(checkSubscription, 10000); // Poll every 10 seconds
    }

    return () => clearInterval(interval);
  }, [apiKey]);

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('livooth-lang', lang);
  };

  const handleLogin = (key: string, name: string) => {
    setApiKey(key);
    setUserName(name);
    localStorage.setItem('livooth-api-key', key);
    localStorage.setItem('livooth-user-name', name);
  };

  const handleLogout = () => {
    setApiKey(null);
    localStorage.removeItem('livooth-api-key');
    localStorage.removeItem('livooth-user-name');
  };

  return (
    <>
      {!apiKey ? (
        <Login onLoginSuccess={handleLogin} />
      ) : (
        <MainLayout 
          apiKey={apiKey} 
          userName={userName} 
          isSubscribed={isSubscribed}
          trueApiKey={trueApiKey}
          onLogout={handleLogout} 
          language={language} 
          onLangChange={handleLangChange} 
        />
      )}
    </>
  );
}

export default App;
