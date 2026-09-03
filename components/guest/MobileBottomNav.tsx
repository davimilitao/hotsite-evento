'use client';

import React from 'react';
import { Mail, MapPin, Gift } from 'lucide-react';

export type ActiveTabType = 'rsvp' | 'location' | 'gifts';

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
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#c5a059]/30 shadow-2xl px-3 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Aba 1: RSVP & Convite */}
        <button
          onClick={() => onChangeTab('rsvp')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
            activeTab === 'rsvp'
              ? 'text-[#6b4684] font-bold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl ${
              activeTab === 'rsvp' ? 'bg-[#6b4684]/15 border border-[#6b4684]/30' : ''
            }`}
          >
            <Mail className="w-5 h-5" />
          </div>
          <span className="text-[10px]">RSVP & Convite</span>
        </button>

        {/* Aba 2: Local & Mesa */}
        <button
          onClick={() => onChangeTab('location')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative ${
            activeTab === 'location'
              ? 'text-[#6b4684] font-bold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl ${
              activeTab === 'location' ? 'bg-[#6b4684]/15 border border-[#6b4684]/30' : ''
            }`}
          >
            <MapPin className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Local & Mesa</span>

          {hasAssignedTable && (
            <span className="absolute top-1.5 right-3 w-2 h-2 bg-[#c5a059] rounded-full animate-ping" />
          )}
        </button>

        {/* Aba 3: Presentes & Pix */}
        <button
          onClick={() => onChangeTab('gifts')}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
            activeTab === 'gifts'
              ? 'text-[#6b4684] font-bold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl ${
              activeTab === 'gifts' ? 'bg-[#6b4684]/15 border border-[#6b4684]/30' : ''
            }`}
          >
            <Gift className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Presentes & Pix</span>
        </button>
      </div>
    </nav>
  );
}
