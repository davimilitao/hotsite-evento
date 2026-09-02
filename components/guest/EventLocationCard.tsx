'use client';

import React from 'react';
import { EventConfig } from '@/types';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface EventLocationCardProps {
  config: EventConfig;
}

export function EventLocationCard({ config }: EventLocationCardProps) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700/60 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-2xl">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Local da Festa</h2>
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">{config.location_name}</p>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-700/40">
        {config.address}
      </p>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {config.maps_url && (
          <a
            href={config.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <Navigation className="w-4 h-4" /> Google Maps
          </a>
        )}

        {config.waze_url && (
          <a
            href={config.waze_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" /> Abrir no Waze
          </a>
        )}
      </div>
    </section>
  );
}
