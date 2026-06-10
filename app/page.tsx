'use client';
import { useState } from 'react';

export interface BookItem {
  id: string;
  title: string;
  type: 'EBOOK';
  fileUrl: string;
  size: string;
}

export interface SwapRequest {
  id: string;
  peerNode: string;
  bookRequested: string;
  bookOffered: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  fileUrl: string;
  size: string;
}

export default function LeafletApp() {
  // --- CORE CLIENT STATE ---
  const [userCredits, setUserCredits] = useState<number>(3);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [tradeCount, setTradeCount] = useState<number>(0);
  
  // Search state for live query
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [myShelf, setMyShelf] = useState<BookItem[]>([
    { id: '1342', title: 'Pride and Prejudice', type: 'EBOOK', fileUrl: 'https://www.gutenberg.org/cache/epub/1342/pg1342-images.html', size: '1.1 MB' },
    { id: '1184', title: 'The Count of Monte Cristo', type: 'EBOOK', fileUrl: 'https://www.gutenberg.org/cache/epub/1184/pg1184-images.html', size: '4.8 MB' }
  ]);

  const [globalPool, setGlobalPool] = useState<BookItem[]>([]);
  const [tradeRequests, setTradeRequests] = useState<SwapRequest[]>([]);

  // --- 1. THE DYNAMIC NETWORK LOOKUP ---
  const handleLiveNetworkSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Point directly to our local Next.js server route instead of a public proxy
      const response = await fetch(`/api/books?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        alert("❌ No matching titles broadcasted on public directories.");
        return;
      }

      const topMatch = data.results[0];
      const bookId = topMatch.id;
      const dynamicUrl = `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}-images.html`;

      const discoveredBook: BookItem = {
        id: bookId.toString(),
        title: topMatch.title,
        type: 'EBOOK',
        fileUrl: dynamicUrl,
        size: '1.5 MB'
      };

      if (myShelf.some(b => b.id === discoveredBook.id)) {
        alert("⚠️ Node conflict: This asset already resides in your local vault.");
        return;
      }

      setMyShelf(prev => [discoveredBook, ...prev]);
      setSearchQuery('');
    } catch (err) {
      console.error("Network sync broken: ", err);
      alert("⚠️ Error fetching dynamic ledger metadata.");
    } finally {
      setIsSearching(false);
    }
  };

  // --- 2. UNIQUE PEER GENERATOR (AUTONOMOUS SELECTION) ---
  const generateDynamicPeerOffer = async (requestedBookTitle: string): Promise<SwapRequest> => {
    let peerOffer = { title: 'Moby Dick', url: 'https://www.gutenberg.org/cache/epub/2701/pg2701-images.html' };
    
    try {
      const topics = ['adventure', 'classic', 'science', 'history', 'mystery'];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      // Point to our local server route here too
      const response = await fetch(`/api/books?topic=${randomTopic}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const fallbackList = data.results.filter((b: any) => !myShelf.some(m => m.id === b.id.toString()));
        const selection = fallbackList[Math.floor(Math.random() * Math.min(fallbackList.length, 10))];
        if (selection) {
          peerOffer = {
            title: selection.title,
            url: `https://www.gutenberg.org/cache/epub/${selection.id}/pg${selection.id}-images.html`
          };
        }
      }
    } catch (e) {
      // Silent fallback
    }

    return {
      id: `req_${Date.now()}`,
      peerNode: `Node_${Math.floor(Math.random() * 899 + 100)}`,
      bookRequested: requestedBookTitle,
      bookOffered: peerOffer.title,
      fileUrl: peerOffer.url,
      size: '1.8 MB',
      status: 'PENDING'
    };
  };

  // --- 3. CORE INTERACTIVE HANDLERS ---
  const sendToMarket = async (book: BookItem) => {
    setMyShelf(prev => prev.filter(b => b.id !== book.id));
    setGlobalPool(prev => [...prev, book]);

    // Async generating dynamic trades based on actual public titles
    const incomingBid = await generateDynamicPeerOffer(book.title);
    setTradeRequests(prev => [incomingBid, ...prev]);
  };

  const handleAcceptTrade = (req: SwapRequest) => {
    const newlyAcquiredBook: BookItem = {
      id: Date.now().toString(),
      title: req.bookOffered,
      type: 'EBOOK',
      fileUrl: req.fileUrl,
      size: req.size
    };

    setMyShelf(prev => [...prev, newlyAcquiredBook]);
    setGlobalPool(prev => prev.filter(b => b.title !== req.bookRequested));
    
    setTradeRequests(prev => prev.map(t => {
      if (t.id === req.id) return { ...t, status: 'ACCEPTED' as const };
      if (t.bookRequested === req.bookRequested && t.status === 'PENDING') return { ...t, status: 'REJECTED' as const };
      return t;
    }));

    setUserCredits(prev => prev + 1);
    setTradeCount(prev => prev + 1);
  };

  const handleRejectTrade = (id: string) => {
    setTradeRequests(prev => prev.map(t => t.id === id ? { ...t, status: 'REJECTED' as const } : t));
  };

  const handleBorrowFromPool = (item: BookItem) => {
    if (userCredits < 1) {
      alert("❌ Insufficient account credits.");
      return;
    }
    setUserCredits(prev => prev - 1);
    setGlobalPool(prev => prev.filter(p => p.id !== item.id));
    setMyShelf(prev => [...prev, item]);
    setActivePdfUrl(item.fileUrl);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-mono">
      
      <header className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-xl font-black tracking-tighter">🌿 LEAFLET LIT-DISCOVERY NODE</h1>
          <p className="text-xs text-slate-500 mt-1">Mode: Dynamic API Sync Engine // Settled Trades: {tradeCount}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-right">
          <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Liquid Reserves</p>
          <p className="text-xl font-black">{userCredits}.00 CR</p>
        </div>
      </header>

      {/* NEW DYNAMIC SEARCH BAR */}
      <section className="max-w-7xl mx-auto mb-6 bg-slate-950 border border-slate-800 p-4 rounded-xl">
        <form onSubmit={handleLiveNetworkSearch} className="flex gap-2">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type any book title or author (e.g., Dracula, Charles Dickens, H.G. Wells)..." 
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button 
            type="submit" 
            disabled={isSearching}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold px-6 py-2 rounded-lg text-sm tracking-wide transition-all"
          >
            {isSearching ? 'SYNCING...' : 'FETCH BOOK 📡'}
          </button>
        </form>
      </section>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* VAULT CONTROL BLOCK */}
        <section className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-900 pb-2">
            1. Vault Storage ({myShelf.length} Loaded)
          </h2>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-96">
            {myShelf.map(item => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div onClick={() => setActivePdfUrl(item.fileUrl)} className="min-w-0 cursor-pointer group flex-1">
                    <p className="text-xs font-bold text-slate-300 line-clamp-2 group-hover:text-emerald-400">{item.title}</p>
                    <span className="text-[10px] text-slate-500">ID: #{item.id} // Open View 📖</span>
                  </div>
                  
                  <a 
                    href={item.fileUrl} 
                    download={`${item.title}.html`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold tracking-tight transition-colors"
                  >
                    Save 💾
                  </a>
                </div>
                
                <button 
                  onClick={() => sendToMarket(item)}
                  className="w-full bg-slate-900 hover:bg-emerald-950 text-slate-400 hover:text-emerald-400 border border-slate-800 hover:border-emerald-800 text-[10px] py-1.5 rounded font-bold uppercase tracking-wider transition-all mt-1"
                >
                  Export To Ledger Book 📈
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* MARKET POOL */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-900 pb-2">
            2. Global Market Pool
          </h2>
          <div className="space-y-2">
            {globalPool.map(item => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/30 flex justify-between items-center text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-slate-200 line-clamp-1">{item.title}</p>
                </div>
                <button 
                  onClick={() => handleBorrowFromPool(item)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded text-xs transition-colors"
                >
                  Recall
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* TRADE SWAPS */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-900 pb-2">
            3. Dynamic Peer Network Swaps
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px]">
            {tradeRequests.map(req => (
              <div 
                key={req.id} 
                className={`p-3 rounded-lg border text-xs flex flex-col gap-2 ${
                  req.status === 'ACCEPTED' 
                    ? 'border-emerald-900 bg-emerald-950/10' 
                    : req.status === 'REJECTED' 
                    ? 'border-slate-800 opacity-40' 
                    : 'border-slate-800 bg-slate-900/20'
                }`}
              >
                <div className="flex justify-between text-[10px]">
                  <span className="text-blue-400 font-bold">{req.peerNode}</span>
                  <span className={`font-bold ${req.status === 'ACCEPTED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {req.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Requested Asset:</p>
                  <p className="text-slate-300 font-semibold line-clamp-1">{req.bookRequested}</p>
                  <p className="text-slate-500 text-[10px] mt-1">Offered Counter-Asset (Fetched Live):</p>
                  <p className="text-emerald-400 font-semibold line-clamp-1">🔄 {req.bookOffered}</p>
                </div>
                
                {req.status === 'PENDING' && (
                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={() => handleAcceptTrade(req)}
                      className="bg-slate-800 hover:bg-emerald-900 border border-slate-700 hover:border-emerald-600 text-slate-200 px-3 py-1 rounded text-[11px] font-bold flex-1 transition-colors"
                    >
                      Settle Barter
                    </button>
                    <button 
                      onClick={() => handleRejectTrade(req.id)}
                      className="bg-slate-900 border border-slate-800 text-slate-500 px-2 py-1 rounded text-[11px] transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* THE VIEW SANDBOX */}
      <footer className="max-w-7xl mx-auto mt-6">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">🎛️ Virtualized Isolation Sandbox Reader</h2>
              <p className="text-[10px] text-slate-500 mt-1">Direct Gutenberg mirror streaming pipeline active.</p>
            </div>
            {activePdfUrl && (
              <button 
                onClick={() => setActivePdfUrl(null)}
                className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded text-xs uppercase tracking-wider transition-colors"
              >
                Close Sandbox
              </button>
            )}
          </div>

          {activePdfUrl ? (
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-white">
              <iframe src={activePdfUrl} width="100%" height="650px" className="bg-white" />
            </div>
          ) : (
            <div className="py-16 border border-dashed border-slate-800 rounded-lg text-center text-slate-600 text-xs italic">
              Sandbox empty. Search a book above, click its title in Vault Storage, and read it here instantly!
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}