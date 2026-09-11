'use client';

import React from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  altText = 'Arte do Convite',
}: ImageLightboxModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in cursor-zoom-out"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center justify-center cursor-default space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior de Ações */}
        <div className="w-full flex items-center justify-between px-2 text-white text-xs font-bold">
          <span className="flex items-center gap-1.5 opacity-80">
            <ZoomIn className="w-4 h-4 text-amber-400" /> Clique na imagem para dar zoom
          </span>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download="convite_fernanda_seppi.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors"
              title="Baixar Convite"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 bg-slate-800/80 hover:bg-rose-600 text-white rounded-full transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Imagem Ampliada */}
        <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl border border-white/20 bg-slate-900 flex items-center justify-center max-h-[82vh]">
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-auto max-h-[80vh] object-contain mx-auto block"
          />
        </div>
      </div>
    </div>
  );
}
