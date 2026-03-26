import React, { useState } from 'react';
import Login from './components/Login';
import MainLayout from './components/MainLayout';

function App(): React.JSX.Element {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Premium User');

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
        <MainLayout apiKey={apiKey} userName={userName} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
