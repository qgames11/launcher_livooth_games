import { useState } from 'react';
import Library from './Library';
import Store from './Store';
import { LogOut, Gamepad2, ShoppingCart } from 'lucide-react';

interface MainLayoutProps {
  apiKey: string;
  userName: string;
  onLogout: () => void;
}

export default function MainLayout({ apiKey, userName, onLogout }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState<'store' | 'library'>('library');

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
            <span>Store</span>
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
            <span>Library</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-800 relative z-10 bg-gray-900/80">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
              {userName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userName}</p>
              <p className="text-xs text-green-400 font-medium">● Online</p>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 border border-transparent rounded-lg transition-all"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#0b0c10] relative flex overflow-hidden">
        {/* Ambient glow in main area */}
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none"></div>
        
        {activeTab === 'store' ? <Store apiKey={apiKey} /> : <Library apiKey={apiKey} userName={userName} onLogout={onLogout} isEmbedded />}
      </div>
    </div>
  );
}
