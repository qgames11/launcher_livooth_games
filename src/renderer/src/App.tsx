import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import MainLayout from './components/MainLayout';

export type Language = 'ko' | 'en' | 'id';

function App(): React.JSX.Element {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Premium User');
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
  }, []);

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('livooth-lang', lang);
  };

  const handleLogin = (key: string, name: string) => {
    setApiKey(key);
    setUserName(name);
  };

  const handleLogout = () => {
    setApiKey(null);
  };

  return (
    <>
      {!apiKey ? (
        <Login onLoginSuccess={handleLogin} />
      ) : (
        <MainLayout apiKey={apiKey} userName={userName} onLogout={handleLogout} language={language} onLangChange={handleLangChange} />
      )}
    </>
  );
}

export default App;
