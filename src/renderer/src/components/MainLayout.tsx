import { useState, useEffect } from 'react';
import Library from './Library';
import Store from './Store';
import { LogOut, Gamepad2, ShoppingCart, RefreshCw } from 'lucide-react';
import { Language } from '../App';

interface MainLayoutProps {
  apiKey: string;
  userName: string;
  isSubscribed: boolean;
  trueApiKey: string | null;
  onLogout: () => void;
  language: Language;
  onLangChange: (lang: Language) => void;
}

export default function MainLayout({ apiKey, userName, isSubscribed, trueApiKey, onLogout, language, onLangChange }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState<'store' | 'library'>('store');
  const [appVersion, setAppVersion] = useState<string>('...');
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const isKo = language === 'ko';
  const isId = language === 'id';

  const tStore = isKo ? '상점' : isId ? 'Toko' : 'Store';
  const tLibrary = isKo ? '내 게임' : isId ? 'Pustaka' : 'Library';
  const tSignOut = isKo ? '로그아웃' : isId ? 'Keluar' : 'Sign Out';

  useEffect(() => {
    // Get version
    window.electron.ipcRenderer.invoke('get-app-version').then((v: string) => setAppVersion(v));

    // Listen to updates
    window.electron.ipcRenderer.on('update-status', (_, msg) => {
      setUpdateMsg(msg);
      if (msg === 'Update Ready!') {
        setShowUpdateModal(true);
      }
    });
    window.electron.ipcRenderer.on('update-progress', (_, percent) => {
      setUpdateMsg(`Downloading Update... ${Math.round(percent)}%`);
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners('update-status');
      window.electron.ipcRenderer.removeAllListeners('update-progress');
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col pt-6 z-20 shadow-xl relative backdrop-blur-3xl">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-purple-900/10 opacity-50 z-0"></div>
        <div className="px-6 mb-8 relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <div>
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Livooth</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Launcher</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <button
            onClick={() => setActiveTab('store')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'store' 
                ? 'bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <ShoppingCart size={20} className={activeTab === 'store' ? 'text-white' : ''} />
            <span>{tStore}</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'library' 
                ? 'bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <Gamepad2 size={20} className={activeTab === 'library' ? 'text-white' : ''} />
            <span>{tLibrary}</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-800 relative z-10 bg-gray-900/80">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${isSubscribed ? 'bg-gradient-to-tr from-purple-500 to-pink-500' : 'bg-gray-700'}`}>
              {userName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate flex items-center gap-1">{userName} {isSubscribed && <span className="text-yellow-400 text-xs">👑</span>}</p>
              <p className={`text-[10px] font-bold ${isSubscribed ? 'text-green-400' : 'text-gray-400'}`}>
                {isSubscribed ? '● Premium' : '○ Free Plan'} <span className="text-gray-500 font-normal ml-1">v{appVersion}</span>
              </p>
            </div>
          </div>
          
          {/* Subscription / API Key State */}
          {isSubscribed && trueApiKey ? (
             <div className="mb-4 px-2">
               <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-gray-700/50">
                  <div className="flex flex-col overflow-hidden mr-2">
                    <span className="text-[9px] text-gray-500 font-bold mb-0.5">DEV API KEY</span>
                    <span className="text-xs font-mono text-purple-300 truncate w-24 opacity-80">{trueApiKey.substring(0, 15)}...</span>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(trueApiKey); alert(isKo ? 'API 키가 복사되었습니다!' : isId ? 'Kunci API disalin!' : 'API Key Copied!'); }} className="text-[10px] font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-md transition-all shadow-md">
                    {isKo ? '복사' : isId ? 'Salin' : 'Copy'}
                  </button>
               </div>
             </div>
          ) : !isSubscribed ? (
             <div className="mb-4 px-2">
               <button onClick={() => window.open('https://livoothgames.com/profile', '_blank')} className="w-full text-[11px] font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-white py-2.5 rounded-lg shadow-lg shadow-purple-500/20 hover:from-pink-500 hover:to-purple-500 transition-all flex items-center justify-center gap-1.5 group">
                 <span className="group-hover:rotate-12 transition-transform">👑</span> {isKo ? '프리미엄 혜택 구독하기' : isId ? 'Dapatkan Akses Premium' : 'Get Premium Access'}
               </button>
             </div>
          ) : null}
          
          {updateMsg && (
            <div className="mb-4 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-2">
              <RefreshCw size={14} className="text-blue-400 animate-spin flex-shrink-0" />
              <p className="text-[11px] font-bold text-blue-300 leading-tight">{updateMsg}</p>
            </div>
          )}

          <div className="flex gap-2 mb-4 px-2">
             <button onClick={() => onLangChange('ko')} className={`flex-1 py-1 rounded text-[11px] px-1 ${language === 'ko' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : 'bg-gray-800/80 text-gray-400 hover:text-white'}`}>한국어</button>
             <button onClick={() => onLangChange('en')} className={`flex-1 py-1 rounded text-[11px] px-1 ${language === 'en' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : 'bg-gray-800/80 text-gray-400 hover:text-white'}`}>EN</button>
             <button onClick={() => onLangChange('id')} className={`flex-1 py-1 rounded text-[11px] px-1 ${language === 'id' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : 'bg-gray-800/80 text-gray-400 hover:text-white'}`}>ID</button>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 border border-transparent rounded-lg transition-all"
          >
            <LogOut size={16} />
            <span>{tSignOut}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#0b0c10] relative flex overflow-hidden">
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-900 border border-blue-500/50 p-7 rounded-2xl w-full max-w-sm flex flex-col items-center shadow-[0_0_50px_rgba(59,130,246,0.2)]">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mb-4 animate-bounce text-2xl">🚀</div>
              <h2 className="text-xl font-bold mb-2 text-white">{isKo ? '업데이트 준비 완료!' : isId ? 'Pembaruan Siap!' : 'Update Ready!'}</h2>
              <p className="text-gray-400 text-center text-sm mb-6 leading-relaxed">
                {isKo ? '새로운 버전의 런처가 다운로드되었습니다. 지금 재시작하여 적용하시겠습니까?' : 
                 isId ? 'Versi baru telah diunduh. Mulai ulang sekarang untuk menerapkan pembaruan?' : 
                 'A new version of the launcher has been downloaded. Restart now to apply the updates?'}
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setShowUpdateModal(false)} 
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 font-bold hover:bg-gray-700 hover:text-white transition-all"
                >
                  {isKo ? '나중에' : isId ? 'Nanti' : 'Later'}
                </button>
                <button 
                  onClick={() => window.electron.ipcRenderer.send('install-update')} 
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30"
                >
                  {isKo ? '재시작' : isId ? 'Mulai Ulang' : 'Restart'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ambient glow in main area */}
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none"></div>
        
        {activeTab === 'store' ? <Store apiKey={apiKey} language={language} /> : <Library apiKey={apiKey} userName={userName} onLogout={onLogout} isEmbedded language={language} isSubscribed={isSubscribed} />}
      </div>
    </div>
  );
}
