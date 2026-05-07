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
  EMAIL: { text: "text-blue-400", bg: "bg-blue-400/10", ring: "ring-blue-400/30", pillbg: "bg-blue-950/30" },
  CPF: { text: "text-amber-500", bg: "bg-amber-500/10", ring: "ring-amber-500/30", pillbg: "bg-amber-950/30" },
  PHONE: { text: "text-primary", bg: "bg-primary/10", ring: "ring-primary/30", pillbg: "bg-primary/5" },
  INVALIDO: { text: "text-red-500", bg: "bg-red-500/10", ring: "ring-red-500/50", pillbg: "bg-red-950/30" }
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in relative z-10 w-full text-foreground">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.2)] border border-primary/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Chaves PIX</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Gerenciamento inteligente com classificação sistêmica.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground hover:border-border transition-all bg-muted/20 hover:bg-muted/40 shadow-sm">
          <RefreshCw className="w-3.5 h-3.5" />
          Sync
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="glass-card border border-border/30 hover:border-primary/30 transition-all hover:-translate-y-1 rounded-xl p-4 flex flex-col items-center justify-center py-5">
           <span className="text-3xl font-black text-foreground drop-shadow-sm">{keys.length}</span>
           <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Total</span>
        </div>
        <div className="glass-card border border-primary/30 hover:border-primary/50 transition-all hover:-translate-y-1 rounded-xl p-4 flex flex-col items-center justify-center py-5 shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
           <span className="text-3xl font-black text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]">{getCountStatus('DISPONIVEL')}</span>
           <span className="text-[10px] text-primary/80 font-bold uppercase tracking-widest mt-1">Disponíveis</span>
        </div>
        <div className="glass-card border border-orange-900/40 hover:border-orange-500/40 transition-all hover:-translate-y-1 rounded-xl p-4 flex flex-col items-center justify-center py-5 shadow-[0_0_20px_rgba(249,115,22,0.05)]">
           <span className="text-3xl font-black text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">{getCountStatus('USADA')}</span>
           <span className="text-[10px] text-orange-500/80 font-bold uppercase tracking-widest mt-1">Usadas</span>
        </div>
        <div className="glass-card border border-border/30 hover:border-primary/30 transition-all hover:-translate-y-1 rounded-xl p-4 flex flex-col items-center justify-center py-5">
           <span className="text-3xl font-black text-primary drop-shadow-sm">{getCountType('PHONE')}</span>
           <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Phone</span>
        </div>
        <div className="glass-card border border-border/30 hover:border-amber-500/30 transition-all hover:-translate-y-1 rounded-xl p-4 flex flex-col items-center justify-center py-5">
           <span className="text-3xl font-black text-amber-500 drop-shadow-sm">{getCountType('CPF')}</span>
           <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">CPF</span>
        </div>
        <div className="glass-card border border-border/30 hover:border-blue-500/30 transition-all hover:-translate-y-1 rounded-xl p-4 flex flex-col items-center justify-center py-5">
           <span className="text-3xl font-black text-blue-500 drop-shadow-sm">{getCountType('EMAIL')}</span>
           <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Email</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Import) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="glass-card border border-border/40 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.15)]">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Importar lote</h3>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Detecta CPF, Tel e Email automaticamente</p>
              </div>
            </div>

            <div className="mb-5">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-36 bg-background/50 border border-border/50 rounded-xl p-4 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none font-mono placeholder:text-muted-foreground/30 shadow-inner"
                placeholder={`11999887766\n123.456.789-00\noperador@email.com`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest mb-2 block uppercase">Banco <span className="opacity-50">(Opcional)</span></label>
                <input
                  type="text"
                  value={bankInput}
                  onChange={(e) => setBankInput(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary shadow-inner"
                  placeholder="Ex: Inter"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest mb-2 block uppercase">Lote <span className="opacity-50">(Opcional)</span></label>
                <input
                  type="text"
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary shadow-inner"
                  placeholder="Ex: Lote A"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleImport}
                disabled={!inputText.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_hsl(var(--primary)/0.3)] hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Importar chaves
              </button>
            </div>
            
            {lastImportCount > 0 && (
              <p className="text-[11px] font-bold text-primary text-center mt-3 animate-pulse">✨ {lastImportCount} chave(s) processada(s) com sucesso</p>
            )}
          </div>

          <div className="glass-card border border-border/40 rounded-2xl p-6">
            <h3 className="text-base font-extrabold text-foreground mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button 
                onClick={copyAllAvailable}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:scale-[1.02]"
                disabled={getCountStatus('DISPONIVEL') === 0}
              >
                <Copy className="w-4 h-4" />
                Copiar Disponíveis ({getCountStatus('DISPONIVEL')})
              </button>
              <button 
                onClick={exportTxt}
                className="w-full bg-muted/20 hover:bg-muted/40 text-foreground font-bold py-3 rounded-xl border border-border/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
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
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar chave, banco, lote..." 
                className="w-full bg-background/50 border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors shadow-inner text-foreground"
              />
            </div>
            
            <div className="flex bg-muted/20 border border-border/50 rounded-xl p-1.5 overflow-x-auto hide-scrollbar shrink-0">
              {['TODOS', 'DISPONIVEL', 'USADA', 'PHONE', 'CPF', 'EMAIL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as typeof filter)}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all uppercase tracking-widest ${
                    filter === f 
                      ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm' 
                      : 'bg-transparent text-muted-foreground border border-transparent hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {f === 'DISPONIVEL' ? 'DISPONÍVEIS' : f === 'USADA' ? 'USADAS' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 px-2 border-b border-border/20 pb-3">
            <span className="text-xs text-muted-foreground font-bold tracking-widest uppercase">{filteredKeys.length} chave(s) encontrada(s)</span>
          </div>

          <div className="space-y-3 flex-1">
            {filteredKeys.length === 0 ? (
              <div className="h-48 flex items-center justify-center border border-dashed border-border/40 rounded-2xl glass-card">
                <p className="text-sm font-bold text-muted-foreground">Nenhuma chave encontrada neste filtro.</p>
              </div>
            ) : (
              filteredKeys.map((key) => (
                <div key={key.id} className={`glass-card border border-border/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/40 hover:shadow-[0_4px_20px_hsl(var(--primary)/0.05)] transition-all ${key.status === 'USADA' ? 'opacity-60 hover:opacity-100' : ''}`}>
                  <div className="flex items-center gap-4 border-l-[3px] border-transparent pl-3" style={{ borderLeftColor: PixColorClass[key.type]?.text?.split('-')[1] || 'hsl(var(--primary))' }}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[11px] font-black lowercase tracking-widest border shadow-inner ${PixColorClass[key.type].pillbg} ${PixColorClass[key.type].text} ${PixColorClass[key.type].ring}`}>
                      {key.type}
                    </div>
                    <div>
                      <p className={`text-base font-extrabold tracking-tight ${key.status === 'USADA' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{key.keyValue}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${PixColorClass[key.type].pillbg} ${PixColorClass[key.type].text}`}>
                          {key.type}
                        </span>
                        {key.bank && (
                           <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                             🏦 {key.bank}
                           </span>
                        )}
                        {key.batch && (
                           <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                             📦 {key.batch}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 md:pl-0">
                    <button 
                      onClick={() => toggleStatus(key.id)}
                      className={`px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                        key.status === 'DISPONIVEL' 
                        ? 'border-primary/30 text-primary hover:bg-primary/10 shadow-[0_0_10px_hsl(var(--primary)/0.1)]' 
                        : 'border-orange-500/30 text-orange-500 hover:bg-orange-500/10'
                      }`}
                    >
                      {key.status === 'DISPONIVEL' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {key.status}
                    </button>
                    
                    <button 
                      onClick={() => handleCopy(key.keyValue)}
                      className="w-9 h-9 rounded-xl border border-border/50 bg-muted/20 hover:bg-primary/10 hover:border-primary/30 hover:text-primary flex items-center justify-center transition-all text-muted-foreground"
                      title="Copiar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(key.id)}
                      className="w-9 h-9 rounded-xl border border-red-900/30 bg-red-950/20 hover:bg-red-900/40 hover:text-red-400 flex items-center justify-center transition-all text-red-500/70"
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
