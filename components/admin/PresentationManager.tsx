'use client';

import React, { useState, useEffect } from 'react';
import { PresentationPlaylist, PresentationSlide, SurpriseSubmission } from '@/types';
import {
  getAllPresentationPlaylists,
  savePresentationPlaylist,
  deletePresentationPlaylist,
  seedDefaultPlaylists,
} from '@/lib/db';
import { compressImageFile } from '@/lib/utils';
import {
  Play,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Music,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Edit,
  Check,
  X,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  Heart,
  Sliders,
  Maximize2,
  Copy,
  ChevronRight,
  Info,
  Eye,
  Download,
  MessageSquareHeart,
  RefreshCw,
} from 'lucide-react';

interface PresentationManagerProps {
  submissions: SurpriseSubmission[];
}

export function PresentationManager({ submissions }: PresentationManagerProps) {
  const [playlists, setPlaylists] = useState<PresentationPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddPhotosModalOpen, setIsAddPhotosModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<PresentationSlide | null>(null);
  const [previewSlide, setPreviewSlide] = useState<PresentationSlide | null>(null);

  // Form de nova playlist
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMode, setNewMode] = useState<'presentation' | 'looping'>('presentation');
  const [newDefaultDuration, setNewDefaultDuration] = useState(8);
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [newAudioTitle, setNewAudioTitle] = useState('');

  // Upload local de foto
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('Fernanda Seppi');
  const [uploadDuration, setUploadDuration] = useState(8);

  // Carrega playlists
  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const data = await getAllPresentationPlaylists();
      setPlaylists(data);
      if (data.length > 0 && !selectedPlaylistId) {
        const active = data.find((p) => p.is_active) || data[0];
        setSelectedPlaylistId(active.id);
      }
    } catch (err) {
      console.error('Erro ao carregar playlists de apresentação:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, [submissions.length]);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0] || null;

  // Calcula o tempo total estimado da playlist
  const calculateTotalTime = (slides: PresentationSlide[], defaultDuration: number) => {
    const totalSeconds = slides.reduce((acc, s) => acc + (s.duration_seconds || defaultDuration || 8), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  // Criação de nova playlist
  const handleCreatePlaylist = async () => {
    if (!newTitle.trim()) return;

    const newPl: PresentationPlaylist = {
      id: `playlist-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      mode: newMode,
      default_slide_duration: newDefaultDuration || 8,
      audio_url: newAudioUrl.trim() || undefined,
      audio_title: newAudioTitle.trim() || undefined,
      is_active: playlists.length === 0,
      slides: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await savePresentationPlaylist(newPl);
    await loadPlaylists();
    setSelectedPlaylistId(newPl.id);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewAudioUrl('');
    setNewAudioTitle('');
  };

  // Exclusão de playlist
  const handleDeletePlaylist = async (id: string) => {
    if (playlists.length <= 1) {
      alert('É necessário manter pelo menos uma playlist ativa para o telão.');
      return;
    }
    const confirmDelete = confirm('Tem certeza que deseja excluir esta playlist?');
    if (!confirmDelete) return;

    await deletePresentationPlaylist(id);
    await loadPlaylists();
    if (selectedPlaylistId === id) {
      const remaining = playlists.filter((p) => p.id !== id);
      setSelectedPlaylistId(remaining[0]?.id || null);
    }
  };

  // Adiciona fotos ou depoimentos da galeria de homenagens
  const handleAddSubmissionToPlaylist = async (sub: SurpriseSubmission) => {
    if (!selectedPlaylist || (!sub.photo_url && !sub.message)) return;

    const newSlide: PresentationSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      photo_url: sub.photo_url || '',
      caption: sub.message || 'Com todo carinho para a Fernanda! ✨',
      author_name: sub.guest_name,
      duration_seconds: selectedPlaylist.default_slide_duration || 8,
      order: selectedPlaylist.slides.length + 1,
      source: 'surprise_submission',
      submission_id: sub.id,
      ken_burns_effect: selectedPlaylist.slides.length % 2 === 0 ? 'zoom-in' : 'pan-left',
    };

    const updatedPl: PresentationPlaylist = {
      ...selectedPlaylist,
      slides: [...selectedPlaylist.slides, newSlide],
    };

    await savePresentationPlaylist(updatedPl);
    await loadPlaylists();
  };

  // Sincroniza de uma vez todos os envios da galeria que ainda não estão na playlist
  const handleSyncAllFromGallery = async () => {
    if (!selectedPlaylist) return;
    const validSubs = submissions.filter((s) => Boolean(s.photo_url || s.message));
    const missingSubs = validSubs.filter(
      (sub) =>
        !selectedPlaylist.slides.some(
          (sl) =>
            sl.submission_id === sub.id ||
            (sub.photo_url && sl.photo_url === sub.photo_url) ||
            (sl.author_name?.trim().toLowerCase() === sub.guest_name?.trim().toLowerCase() &&
              sl.caption === sub.message)
        )
    );

    if (missingSubs.length === 0) {
      alert('Todos os envios da Galeria já estão incluídos nesta playlist!');
      return;
    }

    const newSlides: PresentationSlide[] = missingSubs.map((sub, idx) => ({
      id: `slide-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      photo_url: sub.photo_url || '',
      caption: sub.message || 'Com todo carinho para a Fernanda! ✨',
      author_name: sub.guest_name,
      duration_seconds: selectedPlaylist.default_slide_duration || 8,
      order: selectedPlaylist.slides.length + idx + 1,
      source: 'surprise_submission',
      submission_id: sub.id,
      ken_burns_effect: (selectedPlaylist.slides.length + idx) % 2 === 0 ? 'zoom-in' : 'pan-left',
    }));

    const updatedPl: PresentationPlaylist = {
      ...selectedPlaylist,
      slides: [...selectedPlaylist.slides, ...newSlides],
    };

    await savePresentationPlaylist(updatedPl);
    await loadPlaylists();
  };

  // Adiciona foto por upload local do computador (com compressão automática leve)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlaylist) return;

    try {
      const compressedBase64 = await compressImageFile(file, 900, 900, 0.72);
      if (!compressedBase64) return;

      const newSlide: PresentationSlide = {
        id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        photo_url: compressedBase64,
        caption: uploadCaption.trim() || 'Nesse dia inesquecível...',
        author_name: uploadAuthor.trim() || 'Fernanda Seppi',
        duration_seconds: uploadDuration || 8,
        order: selectedPlaylist.slides.length + 1,
        source: 'upload',
        ken_burns_effect: 'zoom-in',
      };

      const updatedPl: PresentationPlaylist = {
        ...selectedPlaylist,
        slides: [...selectedPlaylist.slides, newSlide],
      };

      await savePresentationPlaylist(updatedPl);
      await loadPlaylists();
      setUploadCaption('');
    } catch (err) {
      console.error('Erro ao comprimir/enviar foto para o telão:', err);
      alert('Não foi possível processar esta foto. Tente outra imagem.');
    } finally {
      e.target.value = '';
    }
  };

  // Remove slide da playlist
  const handleRemoveSlide = async (slideId: string) => {
    if (!selectedPlaylist) return;

    const updatedSlides = selectedPlaylist.slides
      .filter((s) => s.id !== slideId)
      .map((s, idx) => ({ ...s, order: idx + 1 }));

    const updatedPl: PresentationPlaylist = {
      ...selectedPlaylist,
      slides: updatedSlides,
    };

    await savePresentationPlaylist(updatedPl);
    await loadPlaylists();
  };

  // Reordenação de slide (Mover para Cima ou para Baixo)
  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    if (!selectedPlaylist) return;
    const slides = [...selectedPlaylist.slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const temp = slides[index];
    slides[index] = slides[targetIndex];
    slides[targetIndex] = temp;

    const reordered = slides.map((s, idx) => ({ ...s, order: idx + 1 }));

    const updatedPl: PresentationPlaylist = {
      ...selectedPlaylist,
      slides: reordered,
    };

    await savePresentationPlaylist(updatedPl);
    await loadPlaylists();
  };

  // Salva edição rápida de um slide
  const handleSaveSlideEdit = async () => {
    if (!selectedPlaylist || !editingSlide) return;

    const updatedSlides = selectedPlaylist.slides.map((s) =>
      s.id === editingSlide.id ? editingSlide : s
    );

    const updatedPl: PresentationPlaylist = {
      ...selectedPlaylist,
      slides: updatedSlides,
    };

    await savePresentationPlaylist(updatedPl);
    await loadPlaylists();
    setEditingSlide(null);
  };

  // Atualiza áudio da playlist
  const handleUpdateAudio = async (url: string, title?: string) => {
    if (!selectedPlaylist) return;
    const updatedPl: PresentationPlaylist = {
      ...selectedPlaylist,
      audio_url: url.trim() || undefined,
      audio_title: title?.trim() || undefined,
    };
    await savePresentationPlaylist(updatedPl);
    await loadPlaylists();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        <Sparkles className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
        Carregando Módulo de Telão & Apresentações...
      </div>
    );
  }

  const galleryValidSubmissions = submissions.filter((s) => Boolean(s.photo_url || s.message));

  return (
    <div className="space-y-6">
      {/* BANNER PRINCIPAL COM BOTÃO DE PROJETAR NO TELÃO */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-500/40 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-black border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> APRESENTAÇÃO CINEMATOGRÁFICA FULL-SCREEN
          </div>
          <h3 className="text-xl md:text-2xl font-black">
            Telão & Histórias da Festa
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Clique em qualquer slide abaixo para <strong>abrir a foto em tamanho grande e ler a mensagem completa</strong>, ou projete no telão do buffet em tela cheia.
          </p>
        </div>

        {/* CTA Master: Abrir Player em Nova Janela */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
          {selectedPlaylist && (
            <a
              href={`/telao?id=${selectedPlaylist.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition-all active:scale-95 border border-emerald-400/40 text-center"
              title="Abre o player limpo em tela cheia para conectar ao projetor"
            >
              <Maximize2 className="w-4 h-4 text-emerald-200" />
              <span>Projetar Telão Full-Screen (▶)</span>
            </a>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-purple-400" /> Nova Playlist
          </button>
        </div>
      </div>

      {/* SELETOR DE PLAYLISTS CRIADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((pl) => {
          const isSelected = pl.id === selectedPlaylist?.id;
          const totalDuration = calculateTotalTime(pl.slides, pl.default_slide_duration);

          return (
            <div
              key={pl.id}
              onClick={() => setSelectedPlaylistId(pl.id)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-4 ${
                isSelected
                  ? 'bg-slate-900 border-purple-500 ring-2 ring-purple-500/30 shadow-xl'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      pl.mode === 'presentation'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }`}
                  >
                    {pl.mode === 'presentation' ? 'Solene (Com Música)' : 'Looping Contínuo'}
                  </span>

                  <div className="flex items-center gap-1">
                    <a
                      href={`/telao?id=${pl.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Testar este Telão"
                    >
                      <Play className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(pl.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Excluir Playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-black text-white">{pl.title}</h4>
                {pl.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{pl.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-300">
                  {pl.slides.length} slides • ~{totalDuration}
                </span>

                <span className="text-[11px] text-purple-400 font-extrabold flex items-center gap-1">
                  {isSelected ? '✓ Selecionada' : 'Selecionar'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ÁREA DE GESTÃO DA PLAYLIST SELECIONADA */}
      {selectedPlaylist && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          {/* Cabeçalho da Playlist Ativa */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black text-white">{selectedPlaylist.title}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {selectedPlaylist.slides.length} Slides
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Duração total estimada: <strong className="text-white">{calculateTotalTime(selectedPlaylist.slides, selectedPlaylist.default_slide_duration)}</strong> • Ritmo padrão: {selectedPlaylist.default_slide_duration}s por slide
              </p>
            </div>

            {/* Ações de Adicionar Fotos & Mensagens */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddPhotosModalOpen(true)}
                className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Puxar da Galeria ({galleryValidSubmissions.length})</span>
              </button>

              {galleryValidSubmissions.length > 0 && (
                <button
                  type="button"
                  onClick={handleSyncAllFromGallery}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/30 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  title="Importa automaticamente todas as fotos e mensagens recebidas que ainda não estão neste slide"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Importar Todos Envios</span>
                </button>
              )}

              <label className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Foto do PC</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <a
                href={`/telao?id=${selectedPlaylist.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Abrir Player</span>
              </a>
            </div>
          </div>

          {/* Configuração de Trilha Sonora (Apenas se for Modo Apresentação) */}
          {selectedPlaylist.mode === 'presentation' && (
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-extrabold text-white">Trilha Sonora da Apresentação</h5>
                  <p className="text-[11px] text-slate-400">
                    {selectedPlaylist.audio_url
                      ? `Áudio ativo: ${selectedPlaylist.audio_title || selectedPlaylist.audio_url}`
                      : 'Nenhuma música vinculada (a apresentação rodará silenciosa).'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="URL do arquivo MP3 (ex: https://.../musica.mp3)"
                  defaultValue={selectedPlaylist.audio_url || ''}
                  onBlur={(e) => handleUpdateAudio(e.target.value, selectedPlaylist.audio_title)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 w-full md:w-72 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* LISTA DE SLIDES ORDENÁVEIS E CLICÁVEIS PARA ABRIR FOTO/MENSAGEM */}
          {selectedPlaylist.slides.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-extrabold text-white">Nenhum slide nesta playlist ainda</h5>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Adicione fotos e mensagens que os convidados já enviaram pelo formulário de homenagens ou envie fotos do seu computador.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPhotosModalOpen(true)}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Puxar Fotos & Mensagens da Galeria ({galleryValidSubmissions.length})
                </button>
                {galleryValidSubmissions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncAllFromGallery}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Importar Todos Automaticamente
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Ordem dos Slides ({selectedPlaylist.slides.length}) — Clique em qualquer slide para abrir a Foto e a Mensagem
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {selectedPlaylist.slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    onClick={() => setPreviewSlide(slide)}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 hover:border-purple-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group"
                  >
                    {/* Lado Esquerdo: Posição, Miniatura e Informações */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className="text-xs font-black text-slate-500 w-5 text-center shrink-0">
                        {index + 1}
                      </span>

                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 relative flex items-center justify-center group-hover:border-pink-500 transition-colors">
                        {slide.photo_url ? (
                          <>
                            <img
                              src={slide.photo_url}
                              alt={slide.author_name || 'Slide'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-pink-400 p-1 text-center">
                            <MessageSquareHeart className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Depoimento</span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-pink-300">
                            {slide.author_name || 'Convidado Especial'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                            {slide.duration_seconds}s
                          </span>
                          {!slide.photo_url && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold">
                              Somente Mensagem
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-200 line-clamp-2 italic">
                          &ldquo;{slide.caption || 'Sem mensagem em texto'}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Lado Direito: Ações (Abrir/Ver, Baixar, Subir, Descer, Editar, Excluir) */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewSlide(slide)}
                        className="px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 rounded-lg text-[11px] font-extrabold flex items-center gap-1 cursor-pointer mr-1"
                        title="Abrir Foto e Ler Mensagem Completa"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-300" />
                        <span className="hidden sm:inline">Ver Slide</span>
                      </button>

                      {slide.photo_url && (
                        <a
                          href={slide.photo_url}
                          download={`slide-${(slide.author_name || 'convidado').replace(/\s+/g, '-').toLowerCase()}.jpg`}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="Baixar Foto deste Slide"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleMoveSlide(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="Subir Posição"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveSlide(index, 'down')}
                        disabled={index === selectedPlaylist.slides.length - 1}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="Descer Posição"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingSlide(slide)}
                        className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="Editar Legenda e Tempo"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveSlide(slide.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="Remover Slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL LIGHTBOX: ABRIR E VER FOTO + MENSAGEM COMPLETA PELO SLIDE */}
      {previewSlide && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewSlide(null)}
        >
          <div
            className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300 font-black text-sm">
                  {(previewSlide.author_name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {previewSlide.author_name || 'Convidado Especial'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Exibição no Telão: {previewSlide.duration_seconds} segundos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewSlide.photo_url && (
                  <a
                    href={previewSlide.photo_url}
                    download={`foto-telao-${(previewSlide.author_name || 'convidado').replace(/\s+/g, '-').toLowerCase()}.jpg`}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Foto
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const target = previewSlide;
                    setPreviewSlide(null);
                    setEditingSlide(target);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSlide(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {previewSlide.photo_url ? (
                <div className="bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center max-h-[55vh]">
                  <img
                    src={previewSlide.photo_url}
                    alt={previewSlide.author_name || 'Foto do Slide'}
                    className="max-h-[55vh] w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="bg-gradient-to-br from-purple-950/60 via-pink-950/40 to-slate-950 border border-pink-500/30 rounded-2xl p-8 text-center space-y-2">
                  <MessageSquareHeart className="w-10 h-10 text-pink-400 mx-auto" />
                  <p className="text-xs font-bold uppercase tracking-widest text-pink-300">
                    Slide de Depoimento / Mensagem Especial
                  </p>
                </div>
              )}

              <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 block">
                  💬 Mensagem / Legenda Completa do Slide:
                </span>
                <p className="text-sm sm:text-base text-slate-100 italic leading-relaxed whitespace-pre-wrap">
                  &ldquo;{previewSlide.caption || 'Sem mensagem cadastrada neste slide.'}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CRIAR NOVA PLAYLIST */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-black flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Nova Playlist para Telão
              </h4>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-extrabold mb-1">Título da Playlist</label>
                <input
                  type="text"
                  placeholder="Ex: Homenagem Principal 40 Anos"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-extrabold mb-1">Descrição Curta</label>
                <input
                  type="text"
                  placeholder="Ex: Fotos com histórias e músicas para o ápice da festa"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-extrabold mb-1">Modo de Operação</label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="presentation">Solene (Com Música & Fim)</option>
                    <option value="looping">Looping da Festa (Sem Som)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-extrabold mb-1">Tempo Padrão por Slide</label>
                  <select
                    value={newDefaultDuration}
                    onChange={(e) => setNewDefaultDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value={5}>5 segundos (Rápido)</option>
                    <option value={7}>7 segundos</option>
                    <option value={8}>8 segundos (Recomendado)</option>
                    <option value={10}>10 segundos</option>
                    <option value={12}>12 segundos (Mais texto)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreatePlaylist}
                disabled={!newTitle.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold cursor-pointer"
              >
                Salvar Playlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SELECIONAR FOTOS E MENSAGENS DA GALERIA DE HOMENAGENS */}
      {isAddPhotosModalOpen && selectedPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[85vh] rounded-3xl p-6 space-y-4 text-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <h4 className="text-base font-black flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400 fill-pink-400" /> Fotos & Depoimentos Recebidos ({galleryValidSubmissions.length})
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clique em qualquer envio (foto ou mensagem) para adicioná-lo à playlist &quot;{selectedPlaylist.title}&quot;.
                </p>
              </div>
              <button
                onClick={() => setIsAddPhotosModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {galleryValidSubmissions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                Nenhuma foto ou mensagem enviada pelos convidados até o momento.
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {galleryValidSubmissions.map((sub) => {
                  const alreadyInPlaylist = selectedPlaylist.slides.some(
                    (s) =>
                      s.submission_id === sub.id ||
                      (sub.photo_url && s.photo_url === sub.photo_url)
                  );

                  return (
                    <div
                      key={sub.id}
                      onClick={() => !alreadyInPlaylist && handleAddSubmissionToPlaylist(sub)}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                        alreadyInPlaylist
                          ? 'bg-slate-950/40 border-slate-800 opacity-60 cursor-default'
                          : 'bg-slate-950 border-slate-800 hover:border-pink-500 cursor-pointer hover:scale-[1.02]'
                      }`}
                    >
                      <div className="w-full h-32 rounded-xl overflow-hidden bg-black relative flex items-center justify-center">
                        {sub.photo_url ? (
                          <img
                            src={sub.photo_url}
                            alt={sub.guest_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="p-3 text-center space-y-1 bg-gradient-to-br from-purple-950/80 to-pink-950/60 w-full h-full flex flex-col items-center justify-center">
                            <MessageSquareHeart className="w-7 h-7 text-pink-400" />
                            <span className="text-[10px] font-black uppercase text-pink-200">
                              Depoimento em Texto
                            </span>
                          </div>
                        )}
                        {alreadyInPlaylist && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="px-2 py-1 rounded-md bg-emerald-600/90 text-white text-[10px] font-black uppercase">
                              ✓ No Telão
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h6 className="text-xs font-black text-white truncate">{sub.guest_name}</h6>
                        <p className="text-[10px] text-slate-300 line-clamp-3 italic">
                          &ldquo;{sub.message || 'Enviou foto especial'}&rdquo;
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyInPlaylist}
                        className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          alreadyInPlaylist
                            ? 'bg-slate-800 text-slate-500'
                            : 'bg-pink-600 hover:bg-pink-500 text-white shadow-sm'
                        }`}
                      >
                        {alreadyInPlaylist ? 'Já Adicionado' : '+ Incluir no Telão'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={handleSyncAllFromGallery}
                className="px-4 py-2 bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                + Adicionar Todos de Uma Vez
              </button>
              <button
                type="button"
                onClick={() => setIsAddPhotosModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDITAR SLIDE ESPECÍFICO */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-black flex items-center gap-2">
                <Edit className="w-4 h-4 text-purple-400" /> Editar Slide
              </h4>
              <button
                onClick={() => setEditingSlide(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-extrabold mb-1">
                  Legenda / Mensagem Completa
                </label>
                <textarea
                  rows={4}
                  value={editingSlide.caption || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, caption: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  placeholder="Escreva uma frase emocionante..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-extrabold mb-1">
                  Autor / Nome em Destaque
                </label>
                <input
                  type="text"
                  value={editingSlide.author_name || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, author_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-extrabold mb-1">
                  Duração deste Slide (Segundos)
                </label>
                <select
                  value={editingSlide.duration_seconds}
                  onChange={(e) =>
                    setEditingSlide({ ...editingSlide, duration_seconds: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value={5}>5 segundos (Rápido)</option>
                  <option value={6}>6 segundos</option>
                  <option value={8}>8 segundos (Padrão)</option>
                  <option value={10}>10 segundos</option>
                  <option value={12}>12 segundos (Mais tempo para ler)</option>
                  <option value={15}>15 segundos (Textão)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSlideEdit}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-extrabold cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
