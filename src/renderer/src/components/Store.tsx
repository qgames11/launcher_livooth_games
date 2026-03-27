import { useState, useEffect } from 'react';
import { ShoppingCart, ExternalLink, Search, Loader2, Gamepad2 } from 'lucide-react';

import { Language } from '../App';

interface StoreProps {
  apiKey: string;
  language: Language;
}

export default function Store({ apiKey, language }: StoreProps) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isKo = language === 'ko';
  const isId = language === 'id';

  const tFree = isKo ? '무료' : isId ? 'Gratis' : 'Free';
  const tDiscover = isKo ? '새로운 게임 탐색' : isId ? 'TEMUKAN GAME' : 'DISCOVER GAMES';
  const tSearch = isKo ? '게임 검색...' : isId ? 'Cari game...' : 'Search games...';
  const tLoading = isKo ? '게임 불러오는 중...' : isId ? 'Memuat game terbaik...' : 'Loading amazing games...';
  const tRetry = isKo ? '다시 연결' : isId ? 'Coba Lagi' : 'Retry Connection';
  const tF2p = isKo ? '무료 플레이' : isId ? 'MAIN GRATIS' : 'FREE TO PLAY';
  const tPremium = isKo ? '프리미엄' : isId ? 'PREMIUM' : 'PREMIUM';
  const tNoDesc = isKo ? '이 게임에 대한 설명이 없습니다.' : isId ? 'Tidak ada deskripsi yang tersedia.' : 'No description available for this awesome game.';
  const tBrowser = isKo ? '브라우저에서 실행' : isId ? 'Main di Browser' : 'Get in Browser';
  const tPurchase = isKo ? '구매하기' : isId ? 'Beli' : 'Purchase';

  const formatCurrency = (amountInKrw: number) => {
    if (amountInKrw === 0 || amountInKrw === null) return tFree;
    
    // Convert native KRW price exactly like Web Platform
    if (language === 'en') {
      const usd = amountInKrw / 1450;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(usd);
    } else if (language === 'id') {
      const idr = (amountInKrw / 1450) * 16500;
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(idr);
    } else {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0
      }).format(amountInKrw);
    }
  };

  const API_URL = 'https://livoothgames-production.up.railway.app';

  const fetchGames = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null); // Clear previous errors
      const res = await fetch(`${API_URL}/launcher/games?apiKey=${apiKey}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setGames(data.games);
      } else {
        console.error('Failed to load games:', data.error);
        setError(data.error || 'Could not load store');
        if (data.error === 'Invalid or inactive API Key') {
          // Handled at App root level via pooling
        }
      }
    } catch (err: any) {
      console.error('Network error loading store', err);
      setError(err.message || 'Could not load store');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames(true);
    const interval = setInterval(() => fetchGames(false), 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [apiKey]);

  const handlePurchase = (gameId: string) => {
    // Open the browser directly to the payment page or game detail page
    window.open(`https://livoothgames.com/games/${gameId}`, '_blank');
  };

  const filteredGames = games.filter(g => 
    g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col relative z-10">
      {/* Top Bar */}
      <div className="h-20 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex items-center justify-between px-8 flex-shrink-0">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
          <ShoppingCart className="text-blue-500" />
          {tDiscover}
        </h2>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder={tSearch} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950/80 border border-gray-800 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-200 placeholder-gray-500 transition-all"
          />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
            <p className="font-medium animate-pulse">{tLoading}</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center justify-center max-w-lg mx-auto mt-20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-400 font-medium mb-4 text-center">{error}</p>
            <button onClick={() => fetchGames(true)} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium">
              {tRetry}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredGames.map((game: any) => (
              <div 
                key={game.id}
                className="group bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:-translate-y-1 flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-950">
                  {game.imageUrl ? (
                    <img 
                      src={game.imageUrl} 
                      alt={game.title} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Gamepad2 size={40} className="text-gray-600" />
                    </div>
                  )}
                  {game.price === 0 || game.price === null ? (
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-md">
                      {tF2p}
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                      {tPremium}
                    </div>
                  )}
                  
                  {/* Category Type */}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="bg-blue-600/90 text-white text-xs font-semibold px-2 py-1 rounded backdrop-blur-md">
                      {game.type?.toUpperCase() || 'PC'}
                    </span>
                    {game.category && (
                      <span className="bg-gray-900/80 text-gray-300 text-xs px-2 py-1 rounded backdrop-blur-md border border-gray-700">
                        {game.category.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{game.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">{game.description || tNoDesc}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/80">
                    <div className="text-sm">
                      <span className={game.price === 0 || game.price === null ? "text-green-400 font-bold text-lg" : "text-white font-bold text-lg"}>
                        {formatCurrency(game.price)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handlePurchase(game.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
                    >
                      <span>{game.price === 0 || game.price === null ? tBrowser : tPurchase}</span>
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}
