'use client';

import React, { useState, useRef } from 'react';
import { Invite } from '@/types';
import { saveSurpriseSubmission } from '@/lib/db';
import { compressImageFile } from '@/lib/utils';
import { Camera, Image as ImageIcon, Sparkles, Send, X, RefreshCw, CheckCircle2, Heart, Trash2 } from 'lucide-react';

interface SurpriseTributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  invite: Invite;
  onSaved: (updatedInvite: Invite) => void;
}

export function SurpriseTributeModal({
  isOpen,
  onClose,
  invite,
  onSaved,
}: SurpriseTributeModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string>(invite.surprise_photo_url || '');
  const [message, setMessage] = useState<string>(invite.surprise_message || '');
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      // Compacta no cliente para ~100-180KB mantendo resolução HD para o telão
      const compressed = await compressImageFile(file, 1200, 1200, 0.78);
      setPhotoUrl(compressed);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      alert('Não foi possível carregar a imagem. Tente outra foto.');
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl && !message.trim()) {
      alert('Por favor, adicione uma foto ou escreva uma mensagem para a homenagem.');
      return;
    }

    setLoading(true);
    try {
      const submission = await saveSurpriseSubmission(invite.id, {
        photo_url: photoUrl,
        message: message.trim(),
        guest_name: invite.head_name,
      });

      const updatedInvite: Invite = {
        ...invite,
        surprise_sent: true,
        surprise_photo_sent: !!submission.photo_url,
        surprise_text_sent: !!submission.message,
        surprise_photo_url: submission.photo_url,
        surprise_message: submission.message,
        surprise_submitted_at: submission.submitted_at,
      };

      setSavedSuccess(true);
      onSaved(updatedInvite);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Erro ao enviar homenagem surpresa:', err);
      alert('Ocorreu um erro ao enviar sua homenagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-pink-200 text-left relative flex flex-col max-h-[90vh]">
        {/* Header com Gradiente Romântico / Festivo */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="bg-white/25 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> Segredo / Surpresa
            </span>
          </div>

          <h3 className="text-lg font-black mt-1">
            Homenagem no Telão da Festa 📸✨
          </h3>
          <p className="text-xs text-pink-100/90 leading-relaxed font-medium mt-0.5">
            Envie uma foto marcante e um recado carinhoso. A Fernanda não tem acesso a esta tela, guarde o segredo!
          </p>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-5 overflow-y-auto space-y-4">
          {savedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-base font-black text-slate-800">
                Homenagem Enviada com Sucesso! 💖
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Sua foto e mensagem foram salvas e farão parte do momento surpresa no telão da festa da Fernanda!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* UPLOAD OU CÂMERA DE FOTO */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-[#1e152d]">
                  1. Foto de vocês juntos (ou da família com a Fê):
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {photoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-pink-300 bg-slate-900 group shadow-md max-h-56">
                    <img
                      src={photoUrl}
                      alt="Prévia da Homenagem"
                      className="w-full h-52 object-contain bg-slate-950"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5 text-pink-600" /> Trocar Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="p-1.5 bg-rose-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Foto Selecionada
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-pink-200 hover:border-pink-400 bg-pink-50/50 hover:bg-pink-50/80 transition-all rounded-2xl p-6 text-center cursor-pointer space-y-2"
                  >
                    <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                      {compressing ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-pink-600" />
                      ) : (
                        <Camera className="w-6 h-6 text-pink-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#1e152d]">
                        {compressing ? 'Otimizando imagem...' : 'Tirar foto ou escolher da galeria'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Formatos JPG, PNG ou câmera do celular
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* MENSAGEM / DEPOIMENTO PARA O TELÃO */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-[#1e152d]">
                  2. Mensagem especial para passar no telão:
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva uma lembrança marcante, um depoimento ou uma homenagem carinhosa..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-purple-200 focus:border-pink-500 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all shadow-xs"
                />
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading || compressing}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Enviando Homenagem...</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 text-pink-200 fill-pink-200" />
                      <span>Salvar Foto & Mensagem Secreta</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors text-center cursor-pointer"
                >
                  Enviar mais tarde
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
