'use client';

import React, { useState } from 'react';
import { bulkImportInvites } from '@/lib/db';
import { InviteTier } from '@/types';
import { Upload, X, CheckCircle, FileText, Sparkles, Users, Crown, ListFilter } from 'lucide-react';

interface BulkImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImporter({ isOpen, onClose, onSuccess }: BulkImporterProps) {
  const [rawText, setRawText] = useState(
    'Ana Paula Seppi\nCarlos Eduardo\nMariana Souza\nRodrigo Alves, 11977776666, 3'
  );
  const [defaultTier, setDefaultTier] = useState<InviteTier>('main');
  const [defaultMaxGuests, setDefaultMaxGuests] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    setLoading(true);
    setResultMsg(null);

    try {
      const lines = rawText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const parsedRows = lines.map((line) => {
        // Se a linha tiver vírgula, separa os parâmetros. Se for só um nome, pega o nome puro!
        if (line.includes(',')) {
          const parts = line.split(',').map((p) => p.trim());
          const namePart = parts[0] || 'Convidado';
          const phonePart = parts[1] && parts[1].match(/\d/) ? parts[1] : '';
          const maxPart = parseInt(parts[2] || `${defaultMaxGuests}`, 10) || defaultMaxGuests;
          
          let tierPart: InviteTier = defaultTier;
          const lastPart = parts[parts.length - 1].toLowerCase();
          if (lastPart.includes('reserva')) tierPart = 'reserve';
          if (lastPart.includes('oficial') || lastPart.includes('main')) tierPart = 'main';

          return {
            head_name: namePart,
            phone: phonePart,
            max_guests: maxPart,
            tier: tierPart,
          };
        } else {
          // Nome puro (1 por linha)
          return {
            head_name: line,
            phone: '',
            max_guests: defaultMaxGuests,
            tier: defaultTier,
          };
        }
      });

      if (parsedRows.length === 0) {
        alert('Nenhum convidado válido encontrado no texto.');
        setLoading(false);
        return;
      }

      const created = await bulkImportInvites(parsedRows);
      setResultMsg(`🎉 ${created} convidados cadastrados no sistema com sucesso!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Erro na importação:', err);
      alert('Ocorreu um erro ao importar a lista de convidados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 text-slate-100">
        <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-400/20 text-purple-300 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Cadastrar Lista de Nomes (Em Massa)</h3>
              <p className="text-xs text-purple-200">Cole a lista crua de nomes (1 por linha)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Como importar:
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Cole a sua lista simples de nomes abaixo (um por linha). Não precisa de telefone ou mesa agora — você poderá editar mesas e números individualmente no painel!
            </p>
          </div>

          {/* Configuração de Padrão do Lote */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Destino do Lote:
              </label>
              <select
                value={defaultTier}
                onChange={(e) => setDefaultTier(e.target.value as InviteTier)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="main">👑 Lista Oficial</option>
                <option value="reserve">📋 Lista Reserva</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Acompanhantes por Padrão:
              </label>
              <select
                value={defaultMaxGuests}
                onChange={(e) => setDefaultMaxGuests(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value={1}>1 pessoa (Individual)</option>
                <option value={2}>2 pessoas (Casal)</option>
                <option value={3}>3 pessoas</option>
                <option value={4}>4 pessoas (Família)</option>
              </select>
            </div>
          </div>

          {resultMsg && (
            <div className="bg-emerald-500/10 text-emerald-300 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-500/30">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{resultMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Cole a lista de nomes abaixo:
            </label>
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Ana Paula Seppi&#10;Carlos Eduardo&#10;Mariana Souza&#10;Rodrigo Alves"
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-100 placeholder-slate-600"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 font-medium">
              Linhas detectadas: <strong className="text-amber-300">{rawText.split('\n').filter((l) => l.trim()).length} nomes</strong>
            </span>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Cadastrando Nomes...' : 'Cadastrar Todos os Nomes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
