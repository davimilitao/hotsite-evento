'use client';

import React, { useState } from 'react';
import { bulkImportInvites } from '@/lib/db';
import { Upload, X, CheckCircle, FileText, AlertCircle } from 'lucide-react';

interface BulkImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImporter({ isOpen, onClose, onSuccess }: BulkImporterProps) {
  const [rawText, setRawText] = useState(
    'Carlos Silva, 11999998888, 4\nMariana Souza, 11988887777, 2\nRodrigo Alves, 11977776666, 3'
  );
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
        const parts = line.split(',').map((p) => p.trim());
        return {
          head_name: parts[0] || 'Convidado',
          phone: parts[1] || '',
          max_guests: parseInt(parts[2] || '1', 10) || 1,
        };
      });

      if (parsedRows.length === 0) {
        alert('Nenhum convidado válido encontrado no texto.');
        setLoading(false);
        return;
      }

      const created = await bulkImportInvites(parsedRows);
      setResultMsg(`🎉 ${created.length} convites importados e tokens gerados com sucesso!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Erro na importação:', err);
      alert('Ocorreu um erro ao importar os convites.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-400/20 text-purple-300 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Importação em Massa (100 Convidados)</h3>
              <p className="text-xs text-purple-200">Cole a lista separada por vírgula</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <FileText className="w-4 h-4 text-purple-500" /> Formato por linha:
            </p>
            <code className="block bg-white dark:bg-slate-900 p-2 rounded-lg font-mono text-[11px] text-purple-600 dark:text-purple-300 border border-slate-200 dark:border-slate-800">
              Nome Titular, Telefone com DDD, Limite Vagas
            </code>
          </div>

          {resultMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{resultMsg}</span>
            </div>
          )}

          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Ex:\nCarlos Silva, 11999998888, 4\nFernanda Lima, 11988887777, 2"
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? 'Gerando Tokens...' : 'Importar & Gerar Tokens'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
