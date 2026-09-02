'use client';

import React from 'react';
import { HeartHandshake, MapPin, Gift, Armchair } from 'lucide-react';

export type ActiveTabType = 'rsvp' | 'location' | 'gifts';

interface MobileBottomNavProps {
  activeTab: ActiveTabType;
  onChangeTab: (tab: ActiveTabType) => void;
  hasAssignedTable?: boolean;
}

export function MobileBottomNav({ activeTab, onChangeTab, hasAssignedTable }: MobileBottomNavProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-t border-purple-500/20 px-3 py-2 text-slate-300 shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => onChangeTab('rsvp')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'rsvp'
              ? 'text-amber-300 font-bold bg-purple-600/30 ring-1 ring-purple-500/40 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HeartHandshake className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Convite & RSVP</span>
        </button>

        <button
          onClick={() => onChangeTab('location')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all relative ${
            activeTab === 'location'
              ? 'text-amber-300 font-bold bg-purple-600/30 ring-1 ring-purple-500/40 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MapPin className="w-5 h-5" />
            {hasAssignedTable && (
              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight">Local & Mesa</span>
        </button>

        <button
          onClick={() => onChangeTab('gifts')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'gifts'
              ? 'text-amber-300 font-bold bg-purple-600/30 ring-1 ring-purple-500/40 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Presentes & Pix</span>
        </button>
      </div>
    </nav>
  );
}
