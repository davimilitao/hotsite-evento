'use client';

import React from 'react';
import { EventConfig } from '@/types';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface EventLocationCardProps {
  config: EventConfig;
}

export function EventLocationCard({ config }: EventLocationCardProps) {
  return (
    <section className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 text-[#6d44e4] rounded-2xl">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#1e152d]">Local da Festa</h2>
          <p className="text-sm font-extrabold text-[#6d44e4]">{config.location_name}</p>
        </div>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed bg-[#f9f7fd] p-3.5 rounded-xl border border-purple-100 font-medium">
        {config.address}
      </p>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {config.maps_url && (
          <a
            href={config.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <Navigation className="w-4 h-4" /> Google Maps
          </a>
        )}

        {config.waze_url && (
          <a
            href={config.waze_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" /> Abrir no Waze
          </a>
        )}
      </div>
    </section>
  );
}
