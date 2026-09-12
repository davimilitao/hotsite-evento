'use client';

import React from 'react';
import { EventConfig } from '@/types';
import { MapPin, Send, ExternalLink } from 'lucide-react';

interface EventLocationCardProps {
  config: EventConfig;
}

export function EventLocationCard({ config }: EventLocationCardProps) {
  return (
    <section className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 text-[#6d44e4] rounded-2xl shrink-0">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#1e152d]">Como chegar</h2>
          <p className="text-sm font-extrabold text-[#6d44e4]">{config.location_name}</p>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium pt-1">
        {config.address}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {config.maps_url && (
          <a
            href={config.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[#059669] hover:bg-[#047857] text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Google Maps</span>
          </a>
        )}

        {config.waze_url && (
          <a
            href={config.waze_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir no Waze</span>
          </a>
        )}
      </div>
    </section>
  );
}
