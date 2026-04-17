import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CreditCard, RefreshCw, Plus, Upload, Copy, Download, Search, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

type PixType = 'CPF' | 'PHONE' | 'EMAIL' | 'INVALIDO';
type PixStatus = 'DISPONIVEL' | 'USADA';

interface PixKey {
  id: string;
  keyValue: string;
  type: PixType;
  bank?: string;
  batch?: string;
  status: PixStatus;
}

const classifyPixKey = (key: string): PixType => {
  const cleanKey = key.trim();
  
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanKey)) return 'EMAIL';

  // Phone: +5511999999999, (11) 99999-9999 or 11999999999
  if (/^(\+55)?\s?(\(?\d{2}\)?)\s?(9\d{4})[-.\s]?(\d{4})$/.test(cleanKey)) return 'PHONE';

  // CPF or CNPJ
  if (/^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/.test(cleanKey) || /^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})$/.test(cleanKey)) return 'CPF';
  
  return 'INVALIDO';
};

const PixColorClass: Record<PixType, { text: string, bg: string, ring: string, pillbg: string }> = {
  EMAIL: { text: "text-blue-400", bg: "bg-blue-400/10", ring: "ring-blue-400/30", pillbg: "bg-[#1e293b]" },
  CPF: { text: "text-amber-500", bg: "bg-amber-500/10", ring: "ring-amber-500/30", pillbg: "bg-[#451a03]" },
  PHONE: { text: "text-primary", bg: "bg-primary/10", ring: "ring-primary/30", pillbg: "bg-[#4F3E17]" },
  INVALIDO: { text: "text-red-500", bg: "bg-red-500/10", ring: "ring-red-500/50", pillbg: "bg-red-950" }
};

export default function PixKeys() {
  const [keys, setKeys] = useLocalStorage<PixKey[]>('nytzer-pix-keys', []);
  const [inputText, setInputText] = useState('');
  const [bankInput, setBankInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [filter, setFilter] = useState<'TODOS' | PixType | PixStatus>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastImportCount, setLastImportCount] = useState(0);

  const handleImport = () => {
    if (!inputText.trim()) return;

    const lines = inputText.split('\n').map(l => l.trim()).filter(l => l);
    const newKeys: PixKey[] = lines.map(line => {
      const type = classifyPixKey(line);
      return {
        id: crypto.randomUUID(),
        keyValue: line,
        type,
        bank: bankInput.trim() || undefined,
        batch: batchInput.trim() || undefined,
        status: 'DISPONIVEL'
      }
    });

    setKeys(prev => [...newKeys, ...prev]);
    setInputText('');
    setBankInput('');
    setBatchInput('');
    setLastImportCount(newKeys.length);
    toast.success(`${newKeys.length} chave(s) importada(s) com sucesso`);
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Chave copiada para a área de transferência");
  };

  const handleDelete = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  const toggleStatus = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: k.status === 'DISPONIVEL' ? 'USADA' : 'DISPONIVEL' } : k));
  };

  const copyAllAvailable = () => {
    const validKeys = keys.filter(k => k.status === 'DISPONIVEL' && k.type !== 'INVALIDO').map(k => k.keyValue).join('\n');
    if (validKeys) {
      navigator.clipboard.writeText(validKeys);
      toast.success("Chaves disponíveis copiadas");
    }
  };

  const exportTxt = () => {
    const validKeys = keys.filter(k => k.status === 'DISPONIVEL' && k.type !== 'INVALIDO').map(k => k.keyValue).join('\n');
    if (!validKeys) return;
    const blob = new Blob([validKeys], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chaves_pix_disponiveis.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredKeys = keys.filter(k => {
    if (filter !== 'TODOS') {
      if (filter === 'DISPONIVEL' || filter === 'USADA') {
        if (k.status !== filter) return false;
      } else if (k.type !== filter) {
        return false;
      }
    }
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      if (!k.keyValue.toLowerCase().includes(lowerQ) && !(k.bank && k.bank.toLowerCase().includes(lowerQ)) && !(k.batch && k.batch.toLowerCase().includes(lowerQ))) return false;
    }
    return true;
  });

  const getCountType = (type: PixType) => keys.filter(k => k.type === type).length;
  const getCountStatus = (status: PixStatus) => keys.filter(k => k.status === status).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in relative z-10 w-full text-zinc-300">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Chaves PIX</h1>
            <p className="text-sm text-zinc-400 mt-1">Gerenciamento inteligente com classificação sistêmica.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors bg-zinc-950/50">
          <RefreshCw className="w-3 h-3" />
          Sync
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-[#0f1115] border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center py-5">
           <span className="text-2xl font-bold text-white">{keys.length}</span>
           <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">Total</span>
        </div>
        <div className="bg-[#0f1115] border border-primary/20 rounded-xl p-4 flex flex-col items-center justify-center py-5 shadow-[0_0_15px_rgba(201,168,76,0.05)]">
           <span className="text-2xl font-bold text-primary">{getCountStatus('DISPONIVEL')}</span>
           <span className="text-[10px] text-primary/70 font-bold uppercase tracking-wider mt-1">Disponíveis</span>
        </div>
        <div className="bg-[#0f1115] border border-orange-900/40 rounded-xl p-4 flex flex-col items-center justify-center py-5 shadow-[0_0_15px_rgba(249,115,22,0.05)]">
           <span className="text-2xl font-bold text-orange-500">{getCountStatus('USADA')}</span>
           <span className="text-[10px] text-orange-600/70 font-bold uppercase tracking-wider mt-1">Usadas</span>
        </div>
        <div className="bg-[#0f1115] border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center py-5">
           <span className="text-2xl font-bold text-primary">{getCountType('PHONE')}</span>
           <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">Phone</span>
        </div>
        <div className="bg-[#0f1115] border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center py-5">
           <span className="text-2xl font-bold text-amber-500">{getCountType('CPF')}</span>
           <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">CPF</span>
        </div>
        <div className="bg-[#0f1115] border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center py-5">
           <span className="text-2xl font-bold text-blue-500">{getCountType('EMAIL')}</span>
           <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">Email</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Import) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-[#12141a] border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Importar lote</h3>
                <p className="text-[10px] text-zinc-500">Detecta CPF, Tel e Email</p>
              </div>
            </div>

            <div className="mb-4">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-32 bg-[#090a0c] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 resize-none font-mono placeholder:text-zinc-600"
                placeholder={`11999887766\n123.456.789-00\noperador@email.com`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-wider mb-2 block uppercase">Banco <span className="opacity-50">(Opcional)</span></label>
                <input
                  type="text"
                  value={bankInput}
                  onChange={(e) => setBankInput(e.target.value)}
                  className="w-full bg-[#090a0c] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="Ex: Inter"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-wider mb-2 block uppercase">Lote <span className="opacity-50">(Opcional)</span></label>
                <input
                  type="text"
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  className="w-full bg-[#090a0c] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="Ex: Lote A"
                />
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <button 
                onClick={handleImport}
                disabled={!inputText.trim()}
                className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Importar chaves
              </button>
            </div>
            
            {lastImportCount > 0 && (
              <p className="text-[10px] font-semibold text-primary text-center mt-2">{lastImportCount} chave(s) processada(s)</p>
            )}
          </div>

          <div className="bg-[#12141a] border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button 
                onClick={copyAllAvailable}
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                disabled={getCountStatus('DISPONIVEL') === 0}
              >
                <Copy className="w-4 h-4" />
                Copiar Disponíveis ({getCountStatus('DISPONIVEL')})
              </button>
              <button 
                onClick={exportTxt}
                className="w-full bg-transparent hover:bg-zinc-800 text-zinc-300 font-semibold text-sm py-2.5 rounded-lg border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
                disabled={getCountStatus('DISPONIVEL') === 0}
              >
                <Download className="w-4 h-4" />
                Exportar Texto (.txt)
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (List) */}
        <div className="lg:col-span-8 flex flex-col">
          
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar chave, banco, lote..." 
                className="w-full bg-[#090a0c] border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
            
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              {['TODOS', 'DISPONIVEL', 'USADA', 'PHONE', 'CPF', 'EMAIL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as typeof filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                    filter === f 
                      ? 'bg-zinc-800 text-white border-zinc-700' 
                      : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  {f === 'DISPONIVEL' ? 'DISPONÍVEIS' : f === 'USADA' ? 'USADAS' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs text-zinc-400 font-semibold">{filteredKeys.length} chave(s) encontrada(s)</span>
          </div>

          <div className="space-y-3 flex-1">
            {filteredKeys.length === 0 ? (
              <div className="h-40 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-[#0b0d10]">
                <p className="text-sm text-zinc-600">Nenhuma chave encontrada neste filtro.</p>
              </div>
            ) : (
              filteredKeys.map((key) => (
                <div key={key.id} className={`bg-[#12141a] border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between group hover:border-zinc-700 transition-all ${key.status === 'USADA' ? 'opacity-50 grayscale hover:grayscale-0 focus-within:grayscale-0' : ''}`}>
                  <div className="flex items-center gap-4 border-l-2 border-transparent" style={{ borderLeftColor: PixColorClass[key.type]?.text?.split('-')[1] }}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold lowercase tracking-wider border ${PixColorClass[key.type].pillbg} ${PixColorClass[key.type].text} ${PixColorClass[key.type].ring}`}>
                      {key.type}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${key.status === 'USADA' ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>{key.keyValue}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${PixColorClass[key.type].pillbg} ${PixColorClass[key.type].text}`}>
                          {key.type}
                        </span>
                        {key.bank && (
                           <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                             🏦 {key.bank}
                           </span>
                        )}
                        {key.batch && (
                           <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                             📦 {key.batch}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleStatus(key.id)}
                      className={`px-3 py-1.5 rounded border text-[10px] font-bold uppercase transition-colors flex items-center gap-1.5 ${
                        key.status === 'DISPONIVEL' 
                        ? 'border-primary/30 text-primary hover:bg-primary/10' 
                        : 'border-orange-500/30 text-orange-500 hover:bg-orange-500/10'
                      }`}
                    >
                      {key.status === 'DISPONIVEL' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {key.status}
                    </button>
                    
                    <button 
                      onClick={() => handleCopy(key.keyValue)}
                      className="w-8 h-8 rounded border border-zinc-800 bg-[#0b0d10] hover:bg-zinc-800 flex items-center justify-center transition-colors text-zinc-400 hover:text-white"
                      title="Copiar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(key.id)}
                      className="w-8 h-8 rounded border border-red-900/30 bg-red-950/20 hover:bg-red-900/40 flex items-center justify-center transition-colors text-red-500"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
