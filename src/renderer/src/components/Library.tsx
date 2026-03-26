import { useState, useEffect } from 'react';

interface Game {
  id: string;
  title: string;
  developer: string;
  imageUrl: string;
  status: 'installed' | 'uninstalled' | 'downloading';
  progress?: number;
  type?: string;
  url?: string;
}

import { Language } from '../App';

interface LibraryProps {
  apiKey: string;
  userName: string;
  onLogout: () => void;
  isEmbedded?: boolean;
  language?: Language;
}

// Removed mockGames. Games will be fetched from the backend.

export default function Library({ apiKey, userName, onLogout, isEmbedded, language = 'ko' }: LibraryProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const isKo = language === 'ko';
  const isId = language === 'id';

  const tLibraryTitle = isKo ? '내 게임' : isId ? 'Pustaka' : 'Library';
  const tAllGames = isKo ? '모든 게임' : isId ? 'Semua Game' : 'All Games';
  const tInstalled = isKo ? '설치됨' : isId ? 'Terinstal' : 'Installed';
  const tLoadingMsg = isKo ? '라이브러리 불러오는 중...' : isId ? 'Memuat pustaka...' : 'Loading library...';
  const tEmptyLib = isKo ? '라이브러리가 비어 있습니다.' : isId ? 'Pustaka Anda kosong.' : 'Your library is empty.';
  const tBuyHint = isKo ? '웹사이트 상점에서 게임을 구매하면 여기에 즉시 표시됩니다.' : isId ? 'Beli game di toko situs web untuk melihatnya di sini.' : 'Purchase a game on the website to see it here.';
  const tDownloading = isKo ? '다운로드 중...' : isId ? 'Mengunduh...' : 'Downloading...';
  const tPlay = isKo ? '실행' : isId ? 'Main' : 'Play';
  const tInstall = isKo ? '설치' : isId ? 'Instal' : 'Install';
  const tInstalling = isKo ? '설치 중...' : isId ? 'Menginstal...' : 'Installing...';

  // Always use production server
  const API_URL = 'https://livoothgames-production.up.railway.app';

  // Fetch games from Railway backend
  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/launcher/library?apiKey=${apiKey}`);
        const data = await res.json();
        
        if (res.ok && data.success) {
          setGames(data.games);
        } else {
          console.error('Failed to load library:', data.error);
        }
      } catch (err) {
        console.error('Network error loading library', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, [apiKey]);

  useEffect(() => {
    // Register IPC listeners
    window.api.onDownloadProgress(({ gameId, progress }) => {
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, status: 'downloading', progress } : g));
    });

    window.api.onDownloadComplete((gameId) => {
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, status: 'installed', progress: undefined } : g));
      alert(isKo ? `${gameId} 설치가 성공적으로 완료되었습니다!` : isId ? `${gameId} berhasil diinstal!` : `Game ${gameId} successfully installed!`);
    });

    window.api.onDownloadError(({ gameId, error }) => {
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, status: 'uninstalled', progress: undefined } : g));
      alert(isKo ? `${gameId} 다운로드 오류: ${error}` : isId ? `Kesalahan unduhan untuk ${gameId}: ${error}` : `Download Error for ${gameId}: ${error}`);
    });
  }, []);

  useEffect(() => {
    // Handle external magic links (web platform clicking "Play")
    const removeLaunchListener = window.electron.ipcRenderer.on('deep-link-launch', (_event, args) => {
      if (args && args.gameId) {
        const game = games.find(g => g.id === args.gameId);
        if (game) {
           if (game.status === 'installed') {
             handleAction(game.id, 'play', game.type, game.url);
           } else if (game.status === 'uninstalled') {
             handleAction(game.id, 'install');
           }
        } else if (!loading && games.length > 0) {
           // If apps loaded but game not found in library
           alert(isKo ? `라이브러리에서 ${args.gameId} 게임을 찾을 수 없습니다. 구매했는지 확인하세요.` : 
                 isId ? `Game ${args.gameId} tidak ditemukan di pustaka Anda. Pastikan Anda memilikinya.` : 
                 `Game ${args.gameId} not found in your library. Please make sure you own it.`);
        }
      }
    });

    return () => {
      removeLaunchListener();
    };
  }, [games, loading, apiKey]);

  const handleAction = async (gameId: string, action: 'install' | 'play', type?: string, url?: string) => {
    if (action === 'install') {
      try {
        setGames(games.map(g => g.id === gameId ? { ...g, status: 'downloading', progress: 0 } : g));
        
        // 1. Fetch Presigned URL from Railway
        const res = await fetch(`${API_URL}/launcher/download-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, gameId })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to get download link');
        }

        // 2. Trigger Node.js download
        window.electron.ipcRenderer.send('download-game', {
          gameId,
          downloadUrl: data.downloadUrl
        });

      } catch (err: any) {
        alert(`CDN Error: ${err.message}`);
        setGames(games.map(g => g.id === gameId ? { ...g, status: 'uninstalled', progress: undefined } : g));
      }

    } else if (action === 'play') {
      if (type === 'web') {
        window.electron.ipcRenderer.send('launch-web-game', { gameId, url, apiKey });
      } else {
        window.electron.ipcRenderer.send('launch-game', { gameId, apiKey });
        alert(`Launching Game: ${gameId}... DRM check initiated.`);
      }
    }
  };

  return (
    <div className={`w-full h-full text-white overflow-hidden flex-1 ${!isEmbedded ? 'flex absolute inset-0 bg-gray-950' : 'flex flex-col relative z-10 bg-transparent'}`}>
      {/* Sidebar - Only show if not embedded */}
      {!isEmbedded && (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col pt-8 shrink-0">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xs leading-none text-center">LG</div>
          <span className="font-bold text-xl tracking-tight">Livooth Games</span>
        </div>
        
        <div className="px-4 flex-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">{tLibraryTitle}</h3>
          <ul className="space-y-1">
            <li className="bg-gray-800/50 text-blue-400 px-3 py-2 rounded-lg cursor-pointer font-medium text-sm border-l-2 border-blue-500 transition-all">
              {tAllGames}
            </li>
            <li className="text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 px-3 py-2 rounded-lg cursor-pointer font-medium text-sm transition-all border-l-2 border-transparent">
              {tInstalled}
            </li>
          </ul>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white uppercase shadow-sm">
              {userName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium truncate">{userName}</div>
              <div className="text-xs text-green-400">Active Subscription</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2 text-sm text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm flex items-center px-8 shrink-0">
          <h1 className="text-xl font-bold">{tLibraryTitle}</h1>
        </header>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto w-full p-8 flex flex-col">
          {loading ? (
             <div className="flex items-center justify-center h-full w-full flex-1">
               <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></span>
               <span className="ml-3 text-gray-400">{tLoadingMsg}</span>
             </div>
          ) : games.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full w-full flex-1 text-gray-500">
               <div className="text-4xl mb-4">🎮</div>
               <p>{tEmptyLib}</p>
               <p className="text-sm">{tBuyHint}</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map(game => (
                <div key={game.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group hover:border-gray-700 transition-colors">
                <div className="aspect-video w-full bg-gray-800 relative">
                  <img src={game.imageUrl} alt={game.title} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                  {game.status === 'downloading' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                      <div className="w-full max-w-xs">
                        <div className="flex justify-between text-xs mb-2 text-white">
                          <span>{tDownloading}</span>
                          <span>{game.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${game.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{game.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{game.developer}</p>
                  
                  {game.status === 'installed' ? (
                    <button 
                      onClick={() => handleAction(game.id, 'play', game.type, game.url)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
                    >
                      {tPlay}
                    </button>
                  ) : game.status === 'uninstalled' ? (
                    <button 
                      onClick={() => handleAction(game.id, 'install')}
                      className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-colors border border-gray-700 hover:border-gray-600"
                    >
                      {tInstall}
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full py-2 bg-gray-800 text-gray-500 font-semibold rounded-lg border border-gray-800 cursor-not-allowed"
                    >
                      {tInstalling}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
