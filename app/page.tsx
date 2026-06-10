'use client';
import { useState, useEffect } from 'react';

export interface BookItem {
  id: string;
  title: string;
  type: 'PDF';
  fileUrl: string;
  size: string;
}

export interface SwapRequest {
  id: string;
  peerNode: string;
  bookRequested: string;
  bookOffered: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export default function LeafletApp() {
  // --- 1. CORE CLIENT STATE ---
  const [userCredits, setUserCredits] = useState<number>(3);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  
  // Starting inventory with 3 baseline books to fulfill your minimum constraint
  const [myShelf, setMyShelf] = useState<BookItem[]>([
    { id: '1', title: 'Quantum Computing Foundations.pdf', type: 'PDF', fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', size: '1.2 MB' },
    { id: '2', title: 'Intro to Rust Programming.pdf', type: 'PDF', fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', size: '2.5 MB' },
    { id: '3', title: 'The Problems of Philosophy.pdf', type: 'PDF', fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', size: '3.1 MB' },
  ]);

  const [globalPool, setGlobalPool] = useState<BookItem[]>([]);
  const [tradeRequests, setTradeRequests] = useState<SwapRequest[]>([]);

  // --- 2. UPLOAD/RESERVE LOGIC ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("❌ Only valid PDF files are accepted.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    const newBook: BookItem = {
      id: Date.now().toString(),
      title: file.name,
      type: 'PDF',
      fileUrl: objectUrl,
      size: fileSizeStr
    };

    setMyShelf(prev => [...prev, newBook]);
  };

  // --- 3. MARKET AND BARTER ACTIONS ---
  const sendToMarket = (book: BookItem) => {
    // Enforce strict constraint: Cannot go below 3 books owned locally
    if (myShelf.length <= 3) {
      alert("⚠️ Rule Block: Your inventory cannot drop below 3 books. Upload or swap another book first!");
      return;
    }

    // Move from local vault list to the global order book floor
    setMyShelf(prev => prev.filter(b => b.id !== book.id));
    setGlobalPool(prev => [...prev, book]);

    // Simulate incoming peer offers specifically targeting the book you just listed
    setTimeout(() => {
      const peerOffers = [
        { id: `req_${Date.now()}_1`, peerNode: `Node_${Math.floor(Math.random() * 800 + 100)}`, bookRequested: book.title, bookOffered: 'Macroeconomics Vol II.pdf', status: 'PENDING' as const },
        { id: `req_${Date.now()}_2`, peerNode: `Node_${Math.floor(Math.random() * 800 + 100)}`, bookRequested: book.title, bookOffered: 'Advanced Machine Learning.pdf', status: 'PENDING' as const }
      ];
      setTradeRequests(prev => [...peerOffers, ...prev]);
    }, 1200);
  };

  const handleAcceptTrade = (req: SwapRequest) => {
    // Generate the newly acquired asset profile
    const acquiredBook: BookItem = {
      id: Date.now().toString(),
      title: req.bookOffered,
      type: 'PDF',
      fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf', // Using open test file format
      size: '1.8 MB'
    };

    // Add acquired book to your collection and remove the asset from the market pool
    setMyShelf(prev => [...prev, acquiredBook]);
    setGlobalPool(prev => prev.filter(b => b.title !== req.bookRequested));
    
    // Finalize status ledger
    setTradeRequests(prev => prev.map(t => t.id === req.id ? { ...t, status: 'ACCEPTED' as const } : t));
    setUserCredits(prev => prev + 1);
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
    setMyShelf(prev => [...prev, item]); // Swapping straight into your library list
    setActivePdfUrl(item.fileUrl);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-mono">
      
      {/* Top Banner Context Wrapper */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-xl font-black tracking-tighter">🌿 LEAFLET REAL-TIME EXCHANGER</h1>
          <p className="text-xs text-slate-500 mt-1">Inter-Node Asset Relayer // Live Client Instance</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-right">
          <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Liquid Reserves</p>
          <p className="text-xl font-black">{userCredits}.00 CR</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: LOCAL HARD DRIVE DEPOSITORY */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Vault Storage ({myShelf.length} Owned)
            </h2>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${myShelf.length <= 3 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-900 text-slate-400'}`}>
              {myShelf.length <= 3 ? 'Floor Reached (3 Min)' : 'Stable Pool'}
            </span>
          </div>
          
          <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 rounded-xl p-4 text-center relative mb-4 transition-colors">
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            <span className="text-xs text-slate-400">📥 Drop Local PDF to Register</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-80">
            {myShelf.map(item => (
              <div 
                key={item.id} 
                className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col gap-3 transition-all"
              >
                <div 
                  onClick={() => setActivePdfUrl(item.fileUrl)}
                  className="min-w-0 cursor-pointer group"
                >
                  <p className="text-xs font-bold text-slate-300 line-clamp-1 group-hover:text-emerald-400">{item.title}</p>
                  <span className="text-[10px] text-slate-500">{item.size} // Open Document view</span>
                </div>
                
                <button 
                  onClick={() => sendToMarket(item)}
                  className="w-full bg-slate-900 hover:bg-emerald-950 text-slate-400 hover:text-emerald-400 border border-slate-800 hover:border-emerald-800 text-[10px] py-1 rounded font-bold uppercase tracking-wider transition-all"
                >
                  Send to Stock Market 📈
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* COLUMN 2: MARKET ORDER BOOK */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-900 pb-2">
            2. Global Market Pool (Active Listings)
          </h2>
          <div className="space-y-2">
            {globalPool.map(item => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/30 flex justify-between items-center text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-slate-200 line-clamp-1">{item.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Value: 1.00 CR // Weight: {item.size}</p>
                </div>
                <button 
                  onClick={() => handleBorrowFromPool(item)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded text-xs transition-colors"
                >
                  Swap
                </button>
              </div>
            ))}
            {globalPool.length === 0 && (
              <div className="text-center py-12 border border-slate-900 text-xs text-slate-600 italic">
                No active listings. Send a vaulted asset above to request cross-node market trading positions.
              </div>
            )}
          </div>
        </section>

        {/* COLUMN 3: REAL OVERLAY BARTER LOG */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-900 pb-2">
            3. Live Incoming Bids on Your Assets
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {tradeRequests.map(req => (
              <div key={req.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/20 text-xs flex flex-col gap-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-blue-400 font-bold">{req.peerNode}</span>
                  <span className={`font-bold ${req.status === 'ACCEPTED' ? 'text-emerald-500' : req.status === 'REJECTED' ? 'text-red-500' : 'text-amber-500'}`}>
                    {req.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Target Asset:</p>
                  <p className="text-slate-300 font-semibold line-clamp-1">{req.bookRequested}</p>
                  <p className="text-slate-500 text-[10px] mt-1">Incoming Offer:</p>
                  <p className="text-emerald-400 font-semibold line-clamp-1">🔄 {req.bookOffered}</p>
                </div>
                
                {req.status === 'PENDING' && (
                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={() => handleAcceptTrade(req)}
                      className="bg-slate-800 hover:bg-emerald-900 border border-slate-700 hover:border-emerald-600 text-slate-200 px-3 py-1 rounded text-[11px] font-bold flex-1 transition-colors"
                    >
                      Accept Trade
                    </button>
                    <button 
                      onClick={() => handleRejectTrade(req.id)}
                      className="bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 text-slate-400 px-2 py-1 rounded text-[11px] transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
            {tradeRequests.length === 0 && (
              <div className="text-center py-12 border border-slate-900 text-xs text-slate-600 italic">
                Awaiting market listings to initialize counter-node bids.
              </div>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER PIPELINE FRAME VIEWER */}
      <footer className="max-w-7xl mx-auto mt-6">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">🎛️ Local Sandbox Mount Stream</h2>
              <p className="text-[10px] text-slate-500 mt-1">Secure open CORS rendering engine pipeline.</p>
            </div>
            {activePdfUrl && (
              <button 
                onClick={() => setActivePdfUrl(null)}
                className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded text-xs uppercase tracking-wider transition-colors"
              >
                Clear Stream
              </button>
            )}
          </div>

          {activePdfUrl ? (
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-white">
              <iframe src={activePdfUrl} width="100%" height="550px" title="Active Client Pipeline Window" />
            </div>
          ) : (
            <div className="py-16 border border-dashed border-slate-800 rounded-lg text-center text-slate-600 text-xs italic">
              Terminal unmounted. Select any item from "Vault Storage" to stream text data.
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}