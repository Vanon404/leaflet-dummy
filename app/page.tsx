'use client';
import { useState } from 'react';

interface BookItem {
  id: string;
  title: string;
  type: 'PDF';
  fileUrl: string;
  daysUnlent: number;
}

export default function LeafletApp() {
  // --- 1. STATE MANAGEMENT (KISS: Single source of truth in one file) ---
  const [userCredits, setUserCredits] = useState<number>(3);
  
  const [myShelf, setMyShelf] = useState<BookItem[]>([
    { id: '1', title: 'The Problems of Philosophy (Classic Study).pdf', type: 'PDF', fileUrl: 'https://archive.org/download/problemsofphilos00russuoft/problemsofphilos00russuoft.pdf', daysUnlent: 12 },
    { id: '2', title: 'Advanced Quantum Mechanical Concepts.pdf', type: 'PDF', fileUrl: 'https://arxiv.org/pdf/quant-ph/0201082', daysUnlent: 35 }, // Stale item (>30 days)
  ]);

  const [globalPool, setGlobalPool] = useState<BookItem[]>([
    { id: '101', title: 'Think and Grow Rich (Public Domain Edition).pdf', type: 'PDF', fileUrl: 'https://archive.org/download/think-and-grow-rich-napoleon-hill/Think%20and%20Grow%20Rich%20-%20Napoleon%20Hill.pdf', daysUnlent: 2 },
    { id: '102', title: 'Biomimicry Engineering Guide.pdf', type: 'PDF', fileUrl: 'https://unworldispossible.files.wordpress.com/2012/06/biomimicry-nature-as-model-measure-and-mentor.pdf', daysUnlent: 5 },
  ]);

  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // --- 2. CORE LOGIC ---
  const handleAddToShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (myShelf.length >= 5) {
      alert("Your shelf is full (Max 5 items)! Retire a stale book before adding more.");
      return;
    }

    const newItem: BookItem = {
      id: Date.now().toString(),
      title: newTitle.endsWith('.pdf') ? newTitle : `${newTitle}.pdf`,
      type: 'PDF',
      daysUnlent: 0,
      fileUrl: 'https://archive.org/download/think-and-grow-rich-napoleon-hill/Think%20and%20Grow%20Rich%20-%20Napoleon%20Hill.pdf' // System fallback test PDF
    };

    setMyShelf([...myShelf, newItem]);
    setNewTitle('');
  };

  const handleRetireItem = (id: string) => {
    setMyShelf(myShelf.filter(item => item.id !== id));
  };

  const handleBorrowItem = (item: BookItem) => {
    if (userCredits < 1) {
      alert("You don't have enough credits! Lend your books to earn credits.");
      return;
    }
    setUserCredits(userCredits - 1);
    setGlobalPool(globalPool.filter(p => p.id !== item.id));
    setActivePdfUrl(item.fileUrl);
  };

  const handleSimulateLending = (id: string) => {
    const itemToLend = myShelf.find(item => item.id === id);
    if (!itemToLend) return;

    setUserCredits(userCredits + 1);
    setMyShelf(myShelf.filter(item => item.id !== id));
    setGlobalPool([...globalPool, { ...itemToLend, daysUnlent: 0 }]);
  };

  // --- 3. THE UI LAYOUT (Clean, Modern Tailwind Blocks) ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans">
      
      {/* Header Banner */}
      <header className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">🌿 Leaflet</h1>
          <p className="text-sm text-slate-500 mt-1">The Equal-Value Digital Swap Network</p>
        </div>
        
        {/* Wallet Display */}
        <div className="mt-4 md:mt-0 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Your Balance</p>
            <p className="text-2xl font-black text-emerald-950">{userCredits} Credits</p>
          </div>
          <div className="bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
            $
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: User's Private Shelf */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">My Shelf</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${myShelf.length >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
              {myShelf.length} / 5 Slots Used
            </span>
          </div>

          {/* KISS Add Book Form */}
          <form onSubmit={handleAddToShelf} className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Add private PDF title..." 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-sm font-medium rounded-lg transition-colors">
              Deposit
            </button>
          </form>

          {/* Shelf Items List */}
          <div className="space-y-3">
            {myShelf.map(item => {
              const isStale = item.daysUnlent >= 30;
              return (
                <div key={item.id} className={`p-4 rounded-xl border transition-all ${isStale ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Unlent for {item.daysUnlent} days</p>
                    </div>
                    {isStale && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium shrink-0">Stale</span>}
                  </div>
                  
                  <div className="flex gap-2 mt-3 pt-3 border-t border-dashed border-slate-200">
                    <button 
                      onClick={() => handleSimulateLending(item.id)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                      Simulate Peer Borrowing (+1 Cr)
                    </button>
                    <button 
                      onClick={() => handleRetireItem(item.id)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-md ml-auto transition-colors ${isStale ? 'bg-amber-200 hover:bg-amber-300 text-amber-900' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                    >
                      {isStale ? "⚠️ Prune" : "Remove"}
                    </button>
                  </div>
                </div>
              );
            })}
            {myShelf.length === 0 && (
              <p className="text-xs text-center py-8 text-slate-400 italic">Your digital shelf is empty. Deposit a file to start.</p>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Network Marketplace Pool */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Available Network Pool</h2>
          
          <div className="space-y-3">
            {globalPool.map(item => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{item.title}</h3>
                  <span className="inline-block mt-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">Digital PDF</span>
                </div>
                <button 
                  onClick={() => handleBorrowItem(item)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shrink-0 shadow-sm transition-colors"
                >
                  Borrow (1 Cr)
                </button>
              </div>
            ))}
            {globalPool.length === 0 && (
              <p className="text-xs text-center py-8 text-slate-400 italic">No files available right now. Check back later!</p>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER LAYER: Sandboxed Secure Reader */}
      <footer className="max-w-5xl mx-auto mt-8">
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold tracking-wide text-slate-100">🪪 Secure PDF Sandbox Viewer</h2>
              <p className="text-xs text-slate-400 mt-0.5">Access tokens automatically expire or unmount upon document return.</p>
            </div>
            {activePdfUrl && (
              <button 
                onClick={() => setActivePdfUrl(null)}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-xl self-start sm:self-auto shadow-sm transition-colors"
              >
                Return Asset (Revoke Stream)
              </button>
            )}
          </div>

          {activePdfUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-white">
              <iframe 
                src={activePdfUrl} 
                width="100%" 
                height="550px" 
                title="Secure Web Viewer"
                className="bg-white"
              />
            </div>
          ) : (
            <div className="py-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-sm italic">
              No digital file loaded. Spend 1 credit from the pool above to request a secure link.
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}