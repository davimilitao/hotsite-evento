'use client';

import React, { useState } from 'react';
import { EventConfig, Invite, Table, Person } from '@/types';
import { triggerHaptic } from '@/lib/utils';
import {
  Building2,
  Globe,
  Phone,
  Play,
  Camera,
  CheckCircle2,
  X,
  Info,
} from 'lucide-react';

interface VenueBuffetShowcaseProps {
  config: EventConfig;
  invite?: Invite;
  tables?: Table[];
  persons?: Person[];
}

function parseYouTubeEmbedUrl(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube-nocookie.com/embed/${trimmed}`;
  }

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}`;
  }

  return null;
}

export function VenueBuffetShowcase({ config }: VenueBuffetShowcaseProps) {
  const [activeTab, setActiveTab] = useState<'sobre' | 'video' | 'fotos'>('sobre');
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

  const handleTabChange = (tab: 'sobre' | 'video' | 'fotos') => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-purple-100 space-y-5 animate-fade-in">
      {/* Header do Card Unificado */}
      <div className="flex items-center justify-between gap-3 border-b border-purple-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-[#6d44e4] rounded-2xl shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-[#6d44e4] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/60 mb-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Espaço do Evento
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#1e152d] leading-tight">
              {config.location_name}
            </h2>
          </div>
        </div>
      </div>

      {/* Navegador Interno de 3 Tabs (Sobre, Vídeo, Fotos) */}
      <div className="bg-[#f7f4fc] p-1.5 rounded-2xl flex items-center gap-1 border border-purple-100">
        <button
          onClick={() => handleTabChange('sobre')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'sobre'
              ? 'bg-[#6d44e4] text-white shadow-md'
              : 'text-slate-600 hover:text-[#6d44e4]'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Sobre</span>
        </button>

        {embedUrl && (
          <button
            onClick={() => handleTabChange('video')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'video'
                ? 'bg-[#6d44e4] text-white shadow-md'
                : 'text-slate-600 hover:text-[#6d44e4]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Vídeo</span>
          </button>
        )}

        {photos.length > 0 && (
          <button
            onClick={() => handleTabChange('fotos')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'fotos'
                ? 'bg-[#6d44e4] text-white shadow-md'
                : 'text-slate-600 hover:text-[#6d44e4]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Fotos ({photos.length})</span>
          </button>
        )}
      </div>

      {/* Conteúdo Alternável das Tabs */}
      <div className="pt-1">
        {/* ABA 1: Sobre o Espaço */}
        {activeTab === 'sobre' && (
          <div className="space-y-4 animate-fade-in">
            {config.location_about ? (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-[#f9f7fd] p-4 rounded-2xl border border-purple-100">
                {config.location_about}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic bg-[#f9f7fd] p-4 rounded-2xl border border-purple-100">
                O Buffet Espaço Estupendo oferece alta gastronomia e infraestrutura completa para momentos inesquecíveis.
              </p>
            )}

            {/* CTAs de Contato e Website */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {config.location_website && (
                <a
                  href={config.location_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 bg-[#f4effd] hover:bg-purple-100 text-[#6d44e4] border border-purple-200/80 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
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
          </div>
        )}

        {/* ABA 2: Vídeo de Apresentação (YouTube) */}
        {activeTab === 'video' && embedUrl && (
          <div className="space-y-3 animate-fade-in">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md bg-black border border-purple-100">
              <iframe
                src={embedUrl}
                title={`Vídeo do ${config.location_name}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* ABA 3: Galeria de Fotos */}
        {activeTab === 'fotos' && photos.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pb-1">
              <span>Instalações & Estrutura</span>
              <span>Toque para ampliar</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedPhoto(url);
                  }}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-purple-50 border border-purple-100 hover:opacity-90 transition-all cursor-pointer shadow-sm"
                >
                  <img
                    src={url}
                    alt={`Foto do Espaço ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const fallbacks = [
                        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
                      ];
                      (e.target as HTMLImageElement).src = fallbacks[idx % fallbacks.length];
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Lightbox para Ampliar Foto */}
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
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}
