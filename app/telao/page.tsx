'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PresentationPlaylist, PresentationSlide } from '@/types';
import { getAllPresentationPlaylists, getPresentationPlaylistById } from '@/lib/db';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Settings,
  Heart,
  Music,
} from 'lucide-react';

export default function TelaoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
          <Sparkles className="w-12 h-12 text-purple-400 animate-spin mb-4" />
          <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Carregando Telão...</p>
        </div>
      }
    >
      <TelaoPlayerContent />
    </Suspense>
  );
}

function TelaoPlayerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playlistId = searchParams.get('id');

  const [playlist, setPlaylist] = useState<PresentationPlaylist | null>(null);
  const [allPlaylists, setAllPlaylists] = useState<PresentationPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [playbackFeedback, setPlaybackFeedback] = useState<'play' | 'pause' | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);

  // Carrega as playlists
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const playlists = await getAllPresentationPlaylists();
        setAllPlaylists(playlists);

        let target: PresentationPlaylist | null = null;
        if (playlistId) {
          target = playlists.find((p) => p.id === playlistId) || null;
        }
        if (!target) {
          target = playlists.find((p) => p.is_active) || playlists[0] || null;
        }

        setPlaylist(target);
      } catch (err) {
        console.error('Erro ao carregar playlist para telão:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playlistId]);

  const currentSlide: PresentationSlide | undefined = playlist?.slides?.[currentIndex];
  const slideDuration = (currentSlide?.duration_seconds || playlist?.default_slide_duration || 8) * 1000;

  // Pré-carregamento das próximas imagens para transição sem atrasos no projetor
  useEffect(() => {
    if (!playlist?.slides || playlist.slides.length === 0) return;
    const nextIdx1 = (currentIndex + 1) % playlist.slides.length;
    const nextIdx2 = (currentIndex + 2) % playlist.slides.length;

    const preload = (url?: string) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
    };

    preload(playlist.slides[nextIdx1]?.photo_url);
    preload(playlist.slides[nextIdx2]?.photo_url);
  }, [currentIndex, playlist]);

  // Avança para o próximo slide
  const handleNext = useCallback(() => {
    if (!playlist?.slides || playlist.slides.length === 0) return;

    if (currentIndex < playlist.slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
      elapsedBeforePauseRef.current = 0;
    } else {
      // Chegou ao final
      if (playlist.mode === 'looping') {
        setCurrentIndex(0);
        setProgress(0);
        startTimeRef.current = Date.now();
        elapsedBeforePauseRef.current = 0;
      } else {
        // Modo Apresentação: Finalizar com tela de celebração
        setIsFinished(true);
        setIsPlaying(false);
        if (audioRef.current) {
          // Fade out suave de áudio
          const fadeAudio = setInterval(() => {
            if (audioRef.current && audioRef.current.volume > 0.05) {
              audioRef.current.volume -= 0.05;
            } else {
              clearInterval(fadeAudio);
              audioRef.current?.pause();
            }
          }, 100);
        }
      }
    }
  }, [currentIndex, playlist]);

  // Volta para o slide anterior
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
      elapsedBeforePauseRef.current = 0;
      setIsFinished(false);
    }
  }, [currentIndex]);

  // Alterna Play / Pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      setPlaybackFeedback(next ? 'play' : 'pause');
      setTimeout(() => setPlaybackFeedback(null), 800);

      if (next) {
        // Retomando
        startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;
        if (audioRef.current && playlist?.mode === 'presentation' && playlist.audio_url) {
          audioRef.current.play().catch(() => {});
        }
      } else {
        // Pausando
        elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
      return next;
    });
  }, [playlist]);

  // Gerencia o timer suave do frame atual com requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || isFinished || !currentSlide) return;

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min((elapsed / slideDuration) * 100, 100);
      setProgress(currentProgress);

      if (elapsed >= slideDuration) {
        handleNext();
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isFinished, currentIndex, slideDuration, handleNext, currentSlide]);

  // Alternar Fullscreen nativo
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Alternar Mudo
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  };

  // Ocultar cursor e controles automaticamente após inatividade
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isFinished) {
        setShowControls(false);
      }
    }, 2800);
  };

  // Atalhos de Teclado de Palco (Espaço, Setas, F, M, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora atalhos se o foco estiver num input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, handleNext, handlePrev]);

  // Início suave de áudio no modo apresentação ao carregar
  useEffect(() => {
    if (playlist?.mode === 'presentation' && playlist.audio_url && audioRef.current) {
      audioRef.current.volume = 0.8;
      audioRef.current.play().catch(() => {
        // Se autoplay for bloqueado pelo navegador antes do primeiro clique
        console.log('Autoplay com áudio aguardando interação do usuário.');
      });
    }
  }, [playlist]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Sparkles className="w-12 h-12 text-purple-400 animate-spin mb-4" />
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Carregando Telão...</p>
      </div>
    );
  }

  if (!playlist || !playlist.slides || playlist.slides.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 bg-purple-900/40 rounded-full flex items-center justify-center mb-4 border border-purple-500/30">
          <Heart className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-black mb-2">Nenhum slide encontrado</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          Esta playlist ainda não possui fotos adicionadas ou não foi selecionada nenhuma homenagem.
        </p>
        <button
          onClick={() => router.push('/admin')}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
        >
          Voltar ao Painel Admin
        </button>
      </div>
    );
  }

  // TELA DE ENCERRAMENTO (Modo Apresentação Solene)
  if (isFinished) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center animate-fade-in relative overflow-hidden">
        {/* Fundo com efeito de luzes e partículas */}
        <div className="absolute inset-0 bg-radial from-purple-900/30 via-black to-black pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-widest mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Fim da Apresentação
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            Fernanda Seppi <span className="text-purple-400">🌸 40 Anos</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 font-light italic leading-relaxed">
            &quot;Que cada foto e mensagem deste momento guarde o amor, o carinho e a alegria de quem celebra essa data com você!&quot;
          </p>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setProgress(0);
                setIsFinished(false);
                setIsPlaying(true);
                startTimeRef.current = Date.now();
                elapsedBeforePauseRef.current = 0;
                if (audioRef.current && playlist.audio_url) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.volume = 0.8;
                  audioRef.current.play().catch(() => {});
                }
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xl shadow-purple-600/30"
            >
              <RotateCcw className="w-4 h-4" /> Reiniciar Apresentação
            </button>

            {allPlaylists.length > 1 && (
              <button
                onClick={() => {
                  const loopingPl = allPlaylists.find((p) => p.mode === 'looping');
                  if (loopingPl) {
                    router.push(`/telao?id=${loopingPl.id}`);
                  }
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-400" /> Ativar Looping da Festa
              </button>
            )}

            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-3 bg-transparent hover:bg-slate-900 text-slate-400 border border-slate-800 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
            >
              Voltar ao Painel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative w-screen h-screen overflow-hidden bg-black select-none ${
        showControls ? 'cursor-default' : 'cursor-none'
      }`}
    >
      {/* Elemento de Áudio Oculto (Modo Apresentação) */}
      {playlist.audio_url && (
        <audio
          ref={audioRef}
          src={playlist.audio_url}
          loop={playlist.mode === 'looping'}
          preload="auto"
        />
      )}

      {/* CAMADA 1: BACKDROP BLUR CINEMATOGRÁFICO (Preenche 100% da tela sem faixas pretas) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          key={`backdrop-${currentSlide?.id}`}
          className="absolute inset-0 bg-cover bg-center scale-125 blur-3xl opacity-45 transition-all duration-1000 ease-out"
          style={{ backgroundImage: `url(${currentSlide?.photo_url})` }}
        />
        {/* Vinheta escura nas bordas para foco no centro */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90" />
      </div>

      {/* CAMADA 2: FOTO PRINCIPAL COM EFEITO KEN BURNS */}
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8 z-10">
        <div className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl">
          <img
            key={`slide-${currentSlide?.id}`}
            src={currentSlide?.photo_url}
            alt={currentSlide?.caption || 'Homenagem Telão'}
            className="max-h-[82vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl animate-ken-burns border border-white/10"
          />
        </div>
      </div>

      {/* CAMADA 3: LEGENDA / DEPOIMENTO CINEMATOGRÁFICO ("NESSE DIA...") */}
      {(currentSlide?.caption || currentSlide?.author_name) && (
        <div
          className={`absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 max-w-3xl w-[90%] z-20 transition-all duration-500 ${
            showControls ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-95'
          }`}
        >
          <div className="bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl p-4 md:p-6 text-center shadow-2xl space-y-1.5">
            {currentSlide.caption && (
              <p className="text-white text-base md:text-xl font-medium italic leading-relaxed drop-shadow-md">
                &ldquo;{currentSlide.caption}&rdquo;
              </p>
            )}

            {currentSlide.author_name && (
              <p className="text-purple-300 text-xs md:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-1.5 pt-1">
                <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                <span>{currentSlide.author_name}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* BARRA DE PROGRESSO DO SLIDE ATUAL (TOPO) */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 z-30 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all duration-100 ease-linear shadow-lg"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* OVERLAY DE FEEDBACK VISUAL DE PLAY / PAUSE */}
      {playbackFeedback && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            {playbackFeedback === 'play' ? (
              <Play className="w-10 h-10 fill-white ml-1" />
            ) : (
              <Pause className="w-10 h-10 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* CONTROLES DO OPERADOR (FADEM AUTOMATICAMENTE EM IDLE) */}
      <div
        className={`absolute top-4 left-4 right-4 flex items-center justify-between z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Lado Esquerdo: Info da Playlist e Voltar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:bg-black/80 transition-all cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="bg-black/60 backdrop-blur-md border border-white/15 px-4 py-2 rounded-xl text-left hidden sm:block">
            <h4 className="text-xs font-black text-white truncate max-w-[200px] md:max-w-xs">
              {playlist.title}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="capitalize">{playlist.mode === 'presentation' ? 'Solene com Trilha' : 'Looping Contínuo'}</span>
              <span>•</span>
              <span>Slide {currentIndex + 1} de {playlist.slides.length}</span>
            </div>
          </div>
        </div>

        {/* Centro: Controles de Navegação (Play/Pause, Prev, Next) */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/15 p-1.5 rounded-2xl shadow-xl">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            title="Slide Anterior (←)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md transition-all cursor-pointer"
            title={isPlaying ? 'Pausar (Espaço)' : 'Iniciar (Espaço)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button
            onClick={handleNext}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            title="Próximo Slide (→)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Lado Direito: Áudio, Fullscreen e Seletor */}
        <div className="flex items-center gap-2">
          {playlist.audio_url && (
            <button
              onClick={toggleMute}
              className={`p-2.5 rounded-xl bg-black/60 backdrop-blur-md border transition-all cursor-pointer ${
                isMuted
                  ? 'border-rose-500/40 text-rose-400 hover:bg-rose-950/40'
                  : 'border-white/15 text-white/80 hover:text-white hover:bg-black/80'
              }`}
              title={isMuted ? 'Ativar Som (M)' : 'Silenciar (M)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:bg-black/80 transition-all cursor-pointer"
            title={isFullscreen ? 'Sair de Tela Cheia (F)' : 'Tela Cheia (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ESTILOS CSS INLINE DO EFEITO KEN BURNS */}
      <style jsx global>{`
        @keyframes kenBurnsZoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.06);
          }
        }
        .animate-ken-burns {
          animation: kenBurnsZoom ${slideDuration}ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
          transform-origin: center center;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
