'use client';

import React, { useState, useEffect } from 'react';
import { EventConfig, Invite, EventTheme } from '@/types';
import { Calendar, MapPin, Sparkles } from 'lucide-react';

interface HeaderHeroProps {
  config: EventConfig;
  invite: Invite;
}

export function HeaderHero({ config, invite }: HeaderHeroProps) {
  const theme: EventTheme = config.theme || {
    preset: 'lavender_floral',
    primary_color: '#6b4684',
    accent_color: '#c5a059',
    bg_color: '#faf6f0',
    card_bg_color: '#ffffff',
    text_color: '#2d2138',
    font_family: 'serif',
    banner_image_url: '',
  };

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(config.date_time).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [config.date_time]);

  return (
    <header className="relative text-center space-y-6 pt-6 px-4">
      {/* Moldura de Boas-Vindas Floral Elegante */}
      <div className="bg-white/90 rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-[#c5a059]/40 relative overflow-hidden backdrop-blur-sm">
        {/* Detalhe de Aquarela sutil de fundo */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#6b4684]/10 text-[#6b4684] rounded-full text-xs font-extrabold border border-[#6b4684]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" /> Convite Exclusivo para {invite.head_name}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#c5a059] block">
              SAVE THE DATE
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#6b4684] font-serif tracking-tight">
              {config.birthday_person}
            </h1>
            <p className="text-sm font-extrabold text-[#c5a059] uppercase tracking-wider">
              {config.age_celebrating} Anos 🌸✨
            </p>
          </div>

          {/* Banner da Arte do Convite (se cadastrado) */}
          {theme.banner_image_url && (
            <div className="my-4 rounded-2xl overflow-hidden shadow-lg border border-[#c5a059]/30">
              <img
                src={theme.banner_image_url}
                alt="Arte do Convite"
                className="w-full h-auto max-h-64 object-cover"
              />
            </div>
          )}

          {/* Data & Localização Detalhada */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs font-bold text-[#2d2138]">
            <div className="flex items-center gap-1.5 bg-[#faf6f0] px-3.5 py-2 rounded-xl border border-[#c5a059]/30">
              <Calendar className="w-4 h-4 text-[#6b4684]" />
              <span>Sábado, 07 de Novembro • 17h às 23h</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#faf6f0] px-3.5 py-2 rounded-xl border border-[#c5a059]/30">
              <MapPin className="w-4 h-4 text-[#6b4684]" />
              <span>{config.location_name}</span>
            </div>
          </div>

          {/* Contador Regressivo Dourado */}
          <div className="pt-4 border-t border-[#c5a059]/20">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6b4684] block mb-2">
              Contagem Regressiva para a Festa
            </span>
            <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
              {[
                { label: 'Dias', value: timeLeft.days },
                { label: 'Horas', value: timeLeft.hours },
                { label: 'Minutos', value: timeLeft.minutes },
                { label: 'Segundos', value: timeLeft.seconds },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-b from-[#faf6f0] to-white p-2 rounded-2xl border border-[#c5a059]/40 shadow-sm text-center"
                >
                  <span className="block text-xl font-black text-[#6b4684] font-serif">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold text-[#c5a059] uppercase">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
