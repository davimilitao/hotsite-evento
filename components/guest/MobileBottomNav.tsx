'use client';

import React from 'react';
import { Mail, MapPin, Gift, HelpCircle } from 'lucide-react';

export type ActiveTabType = 'rsvp' | 'location' | 'gifts' | 'ajuda';

interface MobileBottomNavProps {
  activeTab: ActiveTabType;
  onChangeTab: (tab: ActiveTabType) => void;
  hasAssignedTable?: boolean;
}

export function MobileBottomNav({
  activeTab,
  onChangeTab,
  hasAssignedTable,
}: MobileBottomNavProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-purple-100/80 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] px-3 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Aba 1: RSVP & Convite */}
        <button
          onClick={() => onChangeTab('rsvp')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'rsvp' ? 'scale-105' : 'opacity-85 hover:opacity-100'
          }`}
        >
          <div
            className={`p-2 rounded-2xl transition-all ${
              activeTab === 'rsvp'
                ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-700 text-white shadow-md shadow-purple-500/40 ring-2 ring-purple-200'
                : 'bg-purple-100/90 text-purple-700 border border-purple-200/80 shadow-xs'
            }`}
          >
            <Mail className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] leading-tight font-extrabold tracking-tight ${
              activeTab === 'rsvp' ? 'text-purple-700 font-black' : 'text-slate-600'
            }`}
          >
            RSVP
          </span>
        </button>

        {/* Aba 2: Local & Mesa */}
        <button
          onClick={() => onChangeTab('location')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 relative cursor-pointer ${
            activeTab === 'location' ? 'scale-105' : 'opacity-85 hover:opacity-100'
          }`}
        >
          <div
            className={`p-2 rounded-2xl transition-all ${
              activeTab === 'location'
                ? 'bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 text-white shadow-md shadow-amber-500/40 ring-2 ring-amber-200'
                : 'bg-amber-100/90 text-amber-800 border border-amber-200/80 shadow-xs'
            }`}
          >
            <MapPin className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] leading-tight font-extrabold tracking-tight ${
              activeTab === 'location' ? 'text-amber-800 font-black' : 'text-slate-600'
            }`}
          >
            Local & Mesa
          </span>

          {hasAssignedTable && (
            <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
          )}
        </button>

        {/* Aba 3: Presentes & Pix */}
        <button
          onClick={() => onChangeTab('gifts')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'gifts' ? 'scale-105' : 'opacity-85 hover:opacity-100'
          }`}
        >
          <div
            className={`p-2 rounded-2xl transition-all ${
              activeTab === 'gifts'
                ? 'bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-600 text-white shadow-md shadow-pink-500/40 ring-2 ring-pink-200'
                : 'bg-pink-100/90 text-pink-700 border border-pink-200/80 shadow-xs'
            }`}
          >
            <Gift className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] leading-tight font-extrabold tracking-tight ${
              activeTab === 'gifts' ? 'text-pink-700 font-black' : 'text-slate-600'
            }`}
          >
            Presentes
          </span>
        </button>

        {/* Aba 4: Ajuda */}
        <button
          onClick={() => onChangeTab('ajuda')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'ajuda' ? 'scale-105' : 'opacity-85 hover:opacity-100'
          }`}
        >
          <div
            className={`p-2 rounded-2xl transition-all ${
              activeTab === 'ajuda'
                ? 'bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-sky-500/40 ring-2 ring-sky-200'
                : 'bg-sky-100/90 text-sky-700 border border-sky-200/80 shadow-xs'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] leading-tight font-extrabold tracking-tight ${
              activeTab === 'ajuda' ? 'text-sky-800 font-black' : 'text-slate-600'
            }`}
          >
            Ajuda
          </span>
        </button>
      </div>
    </nav>
  );
}
