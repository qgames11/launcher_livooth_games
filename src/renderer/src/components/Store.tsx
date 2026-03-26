import { useState, useEffect } from 'react';
import { ShoppingCart, ExternalLink, Search, Loader2, Gamepad2 } from 'lucide-react';

interface StoreProps {
  apiKey: string;
}

export default function Store({ apiKey: _apiKey }: StoreProps) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isKo = navigator.language.startsWith('ko');

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    if (amount === 0 || amount === null) return isKo ? '무료' : 'Free';
    
    if (isKo && currencyCode === 'USD') {
      const krw = amount * 1450;
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0
      }).format(krw);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  };

  const SUPABASE_URL = 'https://osxvjqlrzizwvuorjodg.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zeHZqcWxyeml6d3Z1b3Jqb2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTg3OTgsImV4cCI6MjA3OTYzNDc5OH0.UcU_ErS7UpGoaV2D3AVQqGTznGXVNMATnw3wH7Newxc';

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/games?select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch store games');
      const data = await res.json();
      setGames(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load store');
    } finally {
      setLoading(false);
    }
  };

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
          {isKo ? '새로운 게임 탐색' : 'DISCOVER GAMES'}
        </h2>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder={isKo ? '게임 검색...' : 'Search games...'} 
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
            <p className="font-medium animate-pulse">{isKo ? '게임 불러오는 중...' : 'Loading amazing games...'}</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center justify-center max-w-lg mx-auto mt-20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-400 font-medium mb-4 text-center">{error}</p>
            <button onClick={fetchGames} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium">
              {isKo ? '다시 연결' : 'Retry Connection'}
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
                  {game.thumbnail ? (
                    <img 
                      src={game.thumbnail} 
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
                      {isKo ? '무료 플레이' : 'FREE TO PLAY'}
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                      {isKo ? '프리미엄' : 'PREMIUM'}
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
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">{game.description || (isKo ? '이 게임에 대한 설명이 없습니다.' : 'No description available for this awesome game.')}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/80">
                    <div className="text-sm">
                      <span className={game.price === 0 || game.price === null ? "text-green-400 font-bold text-lg" : "text-white font-bold text-lg"}>
                        {formatCurrency(game.price, game.currency)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handlePurchase(game.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
                    >
                      <span>{game.price === 0 || game.price === null ? (isKo ? '브라우저에서 실행' : 'Get in Browser') : (isKo ? '구매하기' : 'Purchase')}</span>
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
