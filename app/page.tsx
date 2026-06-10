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

// Fixed Gutenberg Cache Stream Pool
const DISCOVERY_POOL = [
  { title: 'Pride and Prejudice.html', url: 'https://www.gutenberg.org/cache/epub/1342/pg1342-images.html', size: '1.1 MB' },
  { title: 'The Count of Monte Cristo.html', url: 'https://www.gutenberg.org/cache/epub/1184/pg1184-images.html', size: '4.8 MB' },
  { title: 'The Adventures of Sherlock Holmes.html', url: 'https://www.gutenberg.org/cache/epub/1661/pg1661-images.html', size: '1.5 MB' },
  { title: 'Alice in Wonderland (Illustrated).html', url: 'https://www.gutenberg.org/cache/epub/11/pg11-images.html', size: '0.9 MB' },
  { title: 'The Time Machine.html', url: 'https://www.gutenberg.org/cache/epub/35/pg35-images.html', size: '0.6 MB' },
  { title: 'Frankenstein (1818 Edition).html', url: 'https://www.gutenberg.org/cache/epub/84/pg84-images.html', size: '1.2 MB' },
  { title: 'The Art of War.html', url: 'https://www.gutenberg.org/cache/epub/132/pg132-images.html', size: '0.5 MB' }
];

export default function LeafletApp() {
  // --- 1. CORE CLIENT STATE ---
  const [userCredits, setUserCredits] = useState<number>(3);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [tradeCount, setTradeCount] = useState<number>(0);
  
  const [myShelf, setMyShelf] = useState<BookItem[]>([
    { id: 'init_1', title: 'Pride and Prejudice.html', type: 'EBOOK', fileUrl: 'https://www.gutenberg.org/cache/epub/1342/pg1342-images.html', size: '1.1 MB' },
    { id: 'init_2', title: 'The Count of Monte Cristo.html', type: 'EBOOK', fileUrl: 'https://www.gutenberg.org/cache/epub/1184/pg1184-images.html', size: '4.8 MB' },
    { id: 'init_3', title: 'The Time Machine.html', type: 'EBOOK', fileUrl: 'https://www.gutenberg.org/cache/epub/35/pg35-images.html', size: '0.6 MB' }
  ]);

  const [globalPool, setGlobalPool] = useState<BookItem[]>([]);
  const [tradeRequests, setTradeRequests] = useState<SwapRequest[]>([]);

  // --- 2. UNIQUE DISCOVERY FILTER GENERATOR ---
  const generateUniquePeerOffer = (requestedBookTitle: string, existingBids: SwapRequest[]): SwapRequest => {
    const ownedTitles = myShelf.map(b => b.title);
    const pooledTitles = globalPool.map(b => b.title);
    const activeBidTitles = [...tradeRequests, ...existingBids].map(r => r.bookOffered);
    const forbiddenTitles = [...ownedTitles, ...pooledTitles, ...activeBidTitles];

    const availablePool = DISCOVERY_POOL.filter(item => !forbiddenTitles.includes(item.title));

    const chosenSelection = availablePool.length > 0
      ? availablePool[Math.floor(Math.random() * availablePool.length)]
      : { title: 'Moby Dick (Surplus Copy).html', url: 'https://www.gutenberg.org/cache/epub/2701/pg2701-images.html', size: '3.2 MB' };

    return {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      peerNode: `Node_${Math.floor(Math.random() * 899 + 100)}`,
      bookRequested: requestedBookTitle,
      bookOffered: chosenSelection.title,
      fileUrl: chosenSelection.url,
      size: chosenSelection.size,
      status: 'PENDING'
    };
  };

  // --- 3. CORE INTERACTIVE HANDLERS ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const newBook: BookItem = {
      id: Date.now().toString(),
      title: file.name,
      type: 'EBOOK',
      fileUrl: objectUrl,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    };

    setMyShelf(prev => [...prev, newBook]);
  };

  const sendToMarket = (book: BookItem) => {
    setMyShelf(prev => prev.filter(b => b.id !== book.id));
    setGlobalPool(prev => [...prev, book]);

    const quantityOfOffersToSpawn = tradeCount >= 5 ? 4 : tradeCount >= 2 ? 3 : 2;
    
    setTimeout(() => {
      const freshBids: SwapRequest[] = [];
      for (let i = 0; i < quantityOfOffersToSpawn; i++) {
        freshBids.push(generateUniquePeerOffer(book.title, freshBids));
      }
      setTradeRequests(prev => [...freshBids, ...prev]);
    }, 600);
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
          <p className="text-xs text-slate-500 mt-1">Mode: Serendipitous Archive // Settled Trades: {tradeCount}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-right">
          <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Liquid Reserves</p>
          <p className="text-xl font-black">{userCredits}.00 CR</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* VAULT CONTROL BLOCK */}
        <section className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Vault Storage ({myShelf.length} Owned)
            </h2>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${myShelf.length === 0 ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-slate-900 text-slate-400'}`}>
              {myShelf.length === 0 ? 'EMPTY VAULT' : 'Active Pool'}
            </span>
          </div>
          
          <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 rounded-xl p-4 text-center relative mb-4 transition-colors">
            <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            <span className="text-xs text-slate-400">📥 Drop Local Document to Register</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-96">
            {myShelf.map(item => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div onClick={() => setActivePdfUrl(item.fileUrl)} className="min-w-0 cursor-pointer group flex-1">
                    <p className="text-xs font-bold text-slate-300 line-clamp-2 group-hover:text-emerald-400">{item.title}</p>
                    <span className="text-[10px] text-slate-500">{item.size} // Open View 📖</span>
                  </div>
                  
                  <a 
                    href={item.fileUrl} 
                    download={item.title}
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

            {myShelf.length === 0 && (
              <div className="text-center py-8 text-xs text-red-400/70 border border-red-950 bg-red-950/10 p-4 rounded-xl italic">
                ⚠️ All local assets deployed. Recall a market listing to continue.
              </div>
            )}
          </div>
        </section>

        {/* MARKET BOOK LISTINGS */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-900 pb-2">
            2. Global Market Pool (Active Listings)
          </h2>
          <div className="space-y-2">
            {globalPool.map(item => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/30 flex justify-between items-center text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-slate-200 line-clamp-1">{item.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Weight: {item.size}</p>
                </div>
                <button 
                  onClick={() => handleBorrowFromPool(item)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded text-xs transition-colors"
                >
                  Recall
                </button>
              </div>
            ))}
            {globalPool.length === 0 && (
              <div className="text-center py-12 border border-slate-900 text-xs text-slate-600 italic">
                Order book idle. Export items out of your Vault instance to collect cross-node bids.
              </div>
            )}
          </div>
        </section>

        {/* SWAP TRANSACTIONS DEMANDS */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-900 pb-2">
            3. Unique Peer Network Swap Demands
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px]">
            {tradeRequests.map(req => (
              <div key={req.id} className={`p-3 rounded-lg border text-xs flex flex-col gap-2 ${req.status === 'ACCEPTED' ? 'border-emerald-900 bg-emerald-950/10' : req.status === 'REJECTED' ? 'border-slate-800 opacity-40' : 'border-slate-800 bg-slate-900/20'}`}>
                <div className="flex justify-between text-[10px]">
                  <span className="text-blue-400 font-bold">{req.peerNode}</span>
                  <span className={`font-bold ${req.status === 'ACCEPTED' ? 'text-emerald-500' : req.status === 'REJECTED' ? 'text-red-500' : 'text-amber-500'}`}>
                    {req.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Requested Asset:</p>
                  <p className="text-slate-300 font-semibold line-clamp-1">{req.bookRequested}</p>
                  <p className="text-slate-500 text-[10px] mt-1">Offered Counter-Asset:</p>
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
            {tradeRequests.length === 0 && (
              <div className="text-center py-12 border border-slate-900 text-xs text-slate-600 italic">
                Awaiting tokenized asset exports to sync market bid positions.
              </div>
            )}
          </div>
        </section>

      </main>

      {/* ISOLATED INTERACTIVE READER VIEW */}
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
              <iframe 
                src={activePdfUrl} 
                width="100%" 
                height="650px" 
                title="Gutenberg Document Viewer Instance"
                className="bg-white" 
              />
            </div>
          ) : (
            <div className="py-16 border border-dashed border-slate-800 rounded-lg text-center text-slate-600 text-xs italic">
              Sandbox reader unmounted. Click on an asset's title card info in your vault storage to launch full HTML pages.
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}