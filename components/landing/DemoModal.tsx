'use client';

import React, { useState } from 'react';
import { X, Calendar, User, Phone, Mail, MessageSquare, Send, Sparkles, ShieldCheck } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eventType, setEventType] = useState('Aniversário de 40 Anos');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = `Olá! Gostaria de agendar uma apresentação comercial da plataforma Festify para meu evento.\n\n` +
      `👤 *Nome*: ${name}\n` +
      `📞 *Telefone*: ${phone}\n` +
      `✉️ *E-mail*: ${email}\n` +
      `🎉 *Tipo de Evento*: ${eventType}\n` +
      (notes ? `💬 *Observações*: ${notes}\n` : '');

    const salesPhone = '5511999998888'; // Telefone Comercial
    const waUrl = `https://wa.me/${salesPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-extrabold border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Demonstração Comercial
          </div>
          <h3 className="text-2xl font-black text-white">Agendar uma Apresentação</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Preencha seus dados abaixo para que nosso especialista comercial apresente a plataforma <strong>Festify</strong> sob medida para a sua festa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" /> Seu Nome Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Fernanda Seppi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-400" /> WhatsApp com DDD *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: (11) 99999-8888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" /> E-mail de Contato
              </label>
              <input
                type="email"
                placeholder="Ex: contato@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" /> Tipo de Evento
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="Aniversário de 40 Anos">Aniversário Adulto (40 Anos, 50 Anos...)</option>
              <option value="Casamento / Bodas">Casamento / Bodas</option>
              <option value="Festa de 15 Anos">Festa de 15 Anos</option>
              <option value="Evento Corporativo / Gala">Evento Corporativo / Gala</option>
              <option value="Outro Celebrativo">Outra Comemoração</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Observações ou Dúvidas (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Gostaria de personalizar o hotsite com as cores do meu convite de casamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Solicitar Apresentação no WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Seus dados estão protegidos. Atendimento humano e personalizado.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
