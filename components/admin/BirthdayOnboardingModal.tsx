'use client';

import React, { useState } from 'react';
import { EventConfig } from '@/types';
import { Sparkles, Calendar, MapPin, Armchair, ChevronRight, ChevronLeft, CheckCircle2, Crown, X } from 'lucide-react';

interface BirthdayOnboardingModalProps {
  isOpen: boolean;
  config: EventConfig;
  onClose: () => void;
  onSave: (updatedConfig: EventConfig) => Promise<void>;
}

export function BirthdayOnboardingModal({ isOpen, config, onClose, onSave }: BirthdayOnboardingModalProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Estados locais dos dados da festa
  const [birthdayPerson, setBirthdayPerson] = useState(config.birthday_person || 'Fernanda Seppi');
  const [ageCelebrating, setAgeCelebrating] = useState(config.age_celebrating || 40);
  const [dateTime, setDateTime] = useState(
    config.date_time ? new Date(config.date_time).toISOString().slice(0, 16) : '2026-11-07T17:00'
  );
  const [deadlineRsvp, setDeadlineRsvp] = useState(
    config.deadline_rsvp ? new Date(config.deadline_rsvp).toISOString().slice(0, 10) : '2026-10-25'
  );
  const [locationName, setLocationName] = useState(config.location_name || 'Buffet Espaço Estupendo');
  const [address, setAddress] = useState(config.address || 'São Bernardo do Campo - SP');
  const [mapsUrl, setMapsUrl] = useState(config.maps_url || '');
  const [buffetCapacity, setBuffetCapacity] = useState(config.buffet_capacity || 100);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setLoading(true);
    try {
      const updated: EventConfig = {
        ...config,
        birthday_person: birthdayPerson.trim(),
        title: `${birthdayPerson.trim()} - ${ageCelebrating} Anos 🌸✨`,
        age_celebrating: Number(ageCelebrating),
        date_time: new Date(dateTime).toISOString(),
        deadline_rsvp: new Date(deadlineRsvp).toISOString(),
        location_name: locationName.trim(),
        address: address.trim(),
        maps_url: mapsUrl.trim(),
        buffet_capacity: Number(buffetCapacity),
      };

      await onSave(updated);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar onboarding da aniversariante:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden animate-scale-up">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header do Wizard */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-2xl shadow-lg">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block">
                Seja Bem-Vinda!
              </span>
              <h2 className="text-lg font-black text-white font-serif flex items-center gap-1.5">
                Confirmação do Evento <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de Passos */}
        <div className="flex items-center justify-between gap-2 px-1">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="flex-1 flex flex-col gap-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx <= step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-800'
                }`}
              />
              <span className={`text-[10px] font-bold text-center ${idx === step ? 'text-amber-300' : 'text-slate-500'}`}>
                {idx === 1 ? 'Aniversariante' : idx === 2 ? 'Data & Hora' : idx === 3 ? 'Local & Endereço' : 'Vagas'}
              </span>
            </div>
          ))}
        </div>

        {/* CONTEÚDO DOS PASSOS */}
        <div className="space-y-4 pt-2">
          {/* PASSO 1: Nome da Aniversariante & Idade */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-2xl space-y-1">
                <h3 className="text-sm font-extrabold text-purple-200 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" /> 1. Quem estamos celebrando?
                </h3>
                <p className="text-xs text-slate-400">
                  Confirme o nome que aparecerá nos convites e no hotsite da festa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome da Aniversariante:
                </label>
                <input
                  type="text"
                  value={birthdayPerson}
                  onChange={(e) => setBirthdayPerson(e.target.value)}
                  placeholder="Ex: Fernanda Seppi"
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Idade a ser Celebrada:
                </label>
                <input
                  type="number"
                  value={ageCelebrating}
                  onChange={(e) => setAgeCelebrating(Number(e.target.value))}
                  placeholder="Ex: 40"
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs font-bold text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* PASSO 2: Data & Horário */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-2xl space-y-1">
                <h3 className="text-sm font-extrabold text-purple-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" /> 2. Quando será o evento?
                </h3>
                <p className="text-xs text-slate-400">
                  Defina o dia, horário de início e a data limite para confirmação do buffet.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Data e Horário do Evento:
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Data Limite para Confirmação de Presença (RSVP):
                </label>
                <input
                  type="date"
                  value={deadlineRsvp}
                  onChange={(e) => setDeadlineRsvp(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs font-bold text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* PASSO 3: Local & Endereço Completo */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-2xl space-y-1">
                <h3 className="text-sm font-extrabold text-purple-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" /> 3. Onde será a recepção?
                </h3>
                <p className="text-xs text-slate-400">
                  Informe o nome do buffet e o endereço completo por extenso para orientação dos convidados.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome do Local / Buffet:
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ex: Buffet Espaço Estupendo"
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Endereço Completo (Rua, Número, Bairro, Cidade):
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Kennedy, 1200 - São Bernardo do Campo, SP"
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Link de Localização do Google Maps / Waze <span className="text-slate-500 font-normal">(Opcional)</span>:
                </label>
                <input
                  type="url"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs font-medium text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* PASSO 4: Capacidade do Buffet */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-2xl space-y-1">
                <h3 className="text-sm font-extrabold text-purple-200 flex items-center gap-1.5">
                  <Armchair className="w-4 h-4 text-amber-400" /> 4. Capacidade Contratada do Buffet
                </h3>
                <p className="text-xs text-slate-400">
                  Informe a quantidade total de lugares contratados com o buffet para o cálculo automático das mesas.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Capacidade Total do Buffet (Assentos):
                </label>
                <input
                  type="number"
                  value={buffetCapacity}
                  onChange={(e) => setBuffetCapacity(Number(e.target.value))}
                  placeholder="Ex: 100"
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs font-bold text-white focus:outline-none text-lg text-amber-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* NAVEGAÇÃO DO WIZARD */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          ) : (
            <div />
          )}

          <div>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-1 cursor-pointer"
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 text-xs font-black rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Tudo Certo, Ir para o Meu Painel!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
