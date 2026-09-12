'use client';

import React, { useState } from 'react';
import { EventConfig, Invite, Table, Person } from '@/types';
import { SeatCard } from './SeatCard';
import { EventLocationCard } from './EventLocationCard';
import {
  Building2,
  Globe,
  Phone,
  Play,
  Sparkles,
  Camera,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';

interface VenueBuffetShowcaseProps {
  config: EventConfig;
  invite: Invite;
  tables: Table[];
  persons?: Person[];
}

function parseYouTubeEmbedUrl(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Direct video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube-nocookie.com/embed/${trimmed}`;
  }

  // standard youtube.com link or youtu.be link
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}`;
  }

  return null;
}

export function VenueBuffetShowcase({
  config,
  invite,
  tables,
  persons,
}: VenueBuffetShowcaseProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const embedUrl = parseYouTubeEmbedUrl(config.location_video_url);
  const photos =
    config.location_photos && config.location_photos.length > 0
      ? config.location_photos
      : [
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
        ];

  const venuePhone = config.location_phone
    ? `https://wa.me/55${config.location_phone.replace(/\D/g, '')}`
    : null;

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {/* 1. Header do Buffet / Espaço */}
      <section className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-[#6d44e4] rounded-2xl shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-[#6d44e4] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/60 mb-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Espaço do Evento
            </span>
            <h2 className="text-xl font-black text-[#1e152d] leading-tight">
              {config.location_name}
            </h2>
          </div>
        </div>

        {/* Descrição "Sobre o Buffet" */}
        {config.location_about && (
          <p className="text-xs text-slate-600 leading-relaxed font-medium bg-[#f9f7fd] p-4 rounded-2xl border border-purple-100">
            {config.location_about}
          </p>
        )}

        {/* CTAs de Contato Direto do Buffet */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {config.location_website && (
            <a
              href={config.location_website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-[#6d44e4] border border-purple-200/80 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Globe className="w-3.5 h-3.5" /> Site do Espaço
            </a>
          )}

          {venuePhone && (
            <a
              href={venuePhone}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" /> Falar com o Buffet
            </a>
          )}
        </div>
      </section>

      {/* 2. Vídeo de Apresentação no YouTube (Se Configurado) */}
      {embedUrl && (
        <section className="bg-white rounded-3xl p-5 shadow-xl border border-purple-100 space-y-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1e152d]">
              Conheça a Estrutura do Espaço
            </h3>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md bg-black border border-purple-100">
            <iframe
              src={embedUrl}
              title={`Vídeo do ${config.location_name}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* 3. Galeria de Fotos do Buffet */}
      {photos.length > 0 && (
        <section className="bg-white rounded-3xl p-5 shadow-xl border border-purple-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1e152d]">
                Fotos das Instalações
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Clique para ampliar</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photos.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPhoto(url)}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-purple-50 border border-purple-100 hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                <img
                  src={url}
                  alt={`Foto do Espaço ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 4. Mesa Reservada da Família */}
      {invite.status === 'confirmed' && (
        <SeatCard invite={invite} tables={tables} persons={persons} />
      )}

      {/* 5. Endereço e Rotas GPS (Google Maps / Waze) */}
      <EventLocationCard config={config} />

      {/* Modal Lightbox para Ampliar Fotos da Galeria */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl space-y-2 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={selectedPhoto}
              alt="Ampliação da Foto do Espaço"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
