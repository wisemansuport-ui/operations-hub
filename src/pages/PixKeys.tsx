import React, { useState } from 'react';
import { useSyncedState } from '../hooks/useSyncedState';
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

const PixColorClass: Record<PixType, { text: string, pillbg: string, ring: string }> = {
  EMAIL: { text: "text-primary", pillbg: "bg-primary/10", ring: "border-primary/30" },
  CPF: { text: "text-warning", pillbg: "bg-warning/10", ring: "border-warning/30" },
  PHONE: { text: "text-success", pillbg: "bg-success/10", ring: "border-success/30" },
  INVALIDO: { text: "text-destructive", pillbg: "bg-destructive/10", ring: "border-destructive/40" }
};
export default function PixKeys() {
  const [keys, setKeys] = useSyncedState<PixKey[]>('nytzer-pix-keys', []);
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
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Chaves PIX</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerenciamento inteligente com classificação sistêmica.</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-accent/10 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Sync
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: keys.length, tone: 'text-foreground' },
          { label: 'Disponíveis', value: getCountStatus('DISPONIVEL'), tone: 'text-success' },
          { label: 'Usadas', value: getCountStatus('USADA'), tone: 'text-warning' },
          { label: 'Phone', value: getCountType('PHONE'), tone: 'text-success' },
          { label: 'CPF', value: getCountType('CPF'), tone: 'text-warning' },
          { label: 'Email', value: getCountType('EMAIL'), tone: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4 hover:border-primary/40 transition-colors">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums tracking-tight ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (Import) */}
        <div className="lg:col-span-4 space-y-4">

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Importar lote</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Detecta CPF, Tel e Email automaticamente</p>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-36 bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 resize-none font-mono placeholder:text-muted-foreground/50 mb-4"
              placeholder={`11999887766\n123.456.789-00\noperador@email.com`}
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground tracking-widest mb-1.5 block uppercase">Banco <span className="opacity-60">(Opcional)</span></label>
                <input
                  type="text"
                  value={bankInput}
                  onChange={(e) => setBankInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="Ex: Inter"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground tracking-widest mb-1.5 block uppercase">Lote <span className="opacity-60">(Opcional)</span></label>
                <input
                  type="text"
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="Ex: Lote A"
                />
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={!inputText.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar chaves
            </button>

            {lastImportCount > 0 && (
              <p className="text-[11px] font-semibold text-success text-center mt-3">{lastImportCount} chave(s) processada(s) com sucesso</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <button
                onClick={copyAllAvailable}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold py-2.5 rounded-lg border border-primary/30 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                disabled={getCountStatus('DISPONIVEL') === 0}
              >
                <Copy className="w-4 h-4" />
                Copiar Disponíveis ({getCountStatus('DISPONIVEL')})
              </button>
              <button
                onClick={exportTxt}
                className="w-full bg-secondary hover:bg-accent/10 text-foreground font-semibold py-2.5 rounded-lg border border-border flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4 mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar chave, banco, lote..."
                className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="flex bg-secondary border border-border rounded-lg p-1 overflow-x-auto hide-scrollbar shrink-0">
              {['TODOS', 'DISPONIVEL', 'USADA', 'PHONE', 'CPF', 'EMAIL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as typeof filter)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors uppercase tracking-widest ${
                    filter === f
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'DISPONIVEL' ? 'DISPONÍVEIS' : f === 'USADA' ? 'USADAS' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] text-muted-foreground font-semibold tracking-widest uppercase">{filteredKeys.length} chave(s) encontrada(s)</span>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur divide-y divide-border/60 flex-1">
            {filteredKeys.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm font-medium text-muted-foreground">Nenhuma chave encontrada neste filtro.</p>
              </div>
            ) : (
              filteredKeys.map((key) => (
                <div key={key.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-accent/5 transition-colors ${key.status === 'USADA' ? 'opacity-60 hover:opacity-100' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest border ${PixColorClass[key.type].pillbg} ${PixColorClass[key.type].text} ${PixColorClass[key.type].ring}`}>
                      {key.type}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold tracking-tight truncate ${key.status === 'USADA' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{key.keyValue}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {key.bank && (
                           <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest bg-secondary text-muted-foreground border border-border">
                             {key.bank}
                           </span>
                        )}
                        {key.batch && (
                           <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest bg-secondary text-muted-foreground border border-border">
                             {key.batch}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleStatus(key.id)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 ${
                        key.status === 'DISPONIVEL'
                        ? 'border-success/30 text-success bg-success/10 hover:bg-success/20'
                        : 'border-warning/30 text-warning bg-warning/10 hover:bg-warning/20'
                      }`}
                    >
                      {key.status === 'DISPONIVEL' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {key.status}
                    </button>
                    
                    <button
                      onClick={() => handleCopy(key.keyValue)}
                      className="w-9 h-9 rounded-lg border border-border bg-secondary hover:bg-primary/10 hover:border-primary/30 hover:text-primary flex items-center justify-center transition-colors text-muted-foreground"
                      title="Copiar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="w-9 h-9 rounded-lg border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center transition-colors"
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
