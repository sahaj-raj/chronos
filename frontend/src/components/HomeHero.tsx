import React, { useRef, useState } from 'react';
import { Loader2, Search, ArrowUp } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading = false,
  placeholder = 'Search or synthesize any historical timeline...',
  autoFocus = false,
  initialValue = '',
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed && !isLoading) {
      onSearch(trimmed);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl relative flex items-center bg-[#111115] hover:bg-[#131318] focus-within:bg-[#131318] border border-[#1f1f28] focus-within:border-[#383848] rounded-full px-4 py-2.5 shadow-2xl shadow-black/80 transition-all duration-200"
    >
      <Search className="w-4 h-4 text-[#52525c] shrink-0 ml-1" />

      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        autoFocus={autoFocus}
        className="w-full bg-transparent text-sm text-[#ececf1] placeholder-[#52525c] outline-none px-3 font-sans disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={!inputValue.trim() || isLoading}
        className="w-8 h-8 rounded-full bg-[#22222a] hover:bg-white hover:text-black text-[#d4d4d8] flex items-center justify-center transition-all shrink-0 cursor-pointer disabled:opacity-20 disabled:hover:bg-[#22222a] disabled:hover:text-[#d4d4d8] disabled:cursor-not-allowed"
        title="Synthesize timeline"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <ArrowUp className="w-4 h-4" />
        )}
      </button>
    </form>
  );
};

interface HomeHeroProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const PREBUILT_CHIPS = [
  'Indus Valley Civilization',
  'Vedic Age & Mahajanapadas',
  'Buddhism & Jainism',
  'Mauryan Empire',
  'Gupta Golden Age',
  'Mughal Empire',
  'Maratha Empire',
  'Modern Freedom Struggle'
];

export const HomeHero: React.FC<HomeHeroProps> = ({ onSearch, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleChipClick = (chip: string) => {
    if (!isLoading) {
      onSearch(chip);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center bg-[#070708] text-[#8e8e98] px-4 py-6 overflow-hidden select-none">
      {/* Background Subtle Cosmos / Stardust */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <span className="absolute top-[12%] left-[8%] text-[#383842] text-[10px] opacity-40 font-mono">+</span>
        <span className="absolute top-[22%] left-[24%] text-[#2e2e38] text-[8px] opacity-30 font-mono">•</span>
        <span className="absolute top-[15%] right-[18%] text-[#383842] text-[10px] opacity-30 font-mono">•</span>
        <span className="absolute top-[28%] right-[8%] text-[#444452] text-[12px] opacity-40 font-mono">+</span>
        <span className="absolute top-[52%] left-[14%] text-[#383842] text-[11px] opacity-35 font-mono">+</span>
        <span className="absolute top-[48%] left-[45%] text-[#282832] text-[9px] opacity-25 font-mono">•</span>
        <span className="absolute top-[56%] right-[32%] text-[#383842] text-[11px] opacity-40 font-mono">+</span>
        <span className="absolute top-[62%] right-[12%] text-[#444452] text-[10px] opacity-30 font-mono">+</span>
        <span className="absolute top-[75%] left-[28%] text-[#2e2e38] text-[8px] opacity-25 font-mono">•</span>
        <span className="absolute top-[82%] right-[22%] text-[#383842] text-[9px] opacity-30 font-mono">•</span>
        <span className="absolute bottom-[10%] left-[10%] text-[#383842] text-[11px] opacity-35 font-mono">+</span>
        <span className="absolute bottom-[16%] right-[8%] text-[#282832] text-[8px] opacity-25 font-mono">•</span>
      </div>

      {/* Top Header */}
      <header className="w-full max-w-6xl flex items-center justify-between z-10 h-10">
        {/* Minimal */}
      </header>

      {/* Center Hero: Standard Chronicles Title, Rounded Search Bar & Pre-built Chips */}
      <main className="w-full max-w-2xl flex flex-col items-center text-center z-10 my-auto py-8">
        {/* Brand Title: Pure Chronos in Grok Editorial Serif */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="font-serif-editorial text-4xl sm:text-5xl md:text-6xl font-normal text-[#f4f4f6] tracking-tight">
            Chronos
          </h1>
        </div>

        {/* Unified Oblong Search Bar */}
        <SearchBar
          onSearch={onSearch}
          isLoading={isLoading}
          placeholder="Search Indian historical eras, empires, or key figures..."
          autoFocus
        />

        {/* Loading Indicator Pill */}
        {isLoading && (
          <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14141c] border border-[#22222e] text-xs text-[#a1a1aa] animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            <span>Retrieving historical milestones...</span>
          </div>
        )}

        {/* Pre-built Search Chips: Seamless Flowing Track */}
        <div className="relative w-full max-w-2xl mt-5">
          {/* Subtle Edge Fade Masks for Smooth In/Out Flow */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#070708] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#070708] to-transparent z-10" />

          {/* Flowing Chips Track */}
          <div
            ref={scrollRef}
            onWheel={(e) => {
              if (e.deltaY !== 0 && scrollRef.current) {
                scrollRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="w-full flex items-center gap-2 overflow-x-auto py-1 px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth select-none"
          >
            {PREBUILT_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                disabled={isLoading}
                className="whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full bg-[#0d0d12] hover:bg-[#16161e] border border-[#1a1a24] hover:border-[#2b2b3a] text-xs text-[#90909c] hover:text-[#f4f4f6] transition-all cursor-pointer disabled:opacity-40"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="w-full max-w-6xl flex items-center justify-center text-xs text-[#52525c] pt-8 pb-3 z-10">
        <p className="tracking-wide">Timeline Engine</p>
      </footer>
    </div>
  );
};
