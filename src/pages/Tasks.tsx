import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Target, Plus, X, Search, ArrowUpRight, ArrowLeft, AlertTriangle, CheckSquare, Trash2, RotateCcw, BarChart2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { pushNotify, requestNotificationPermission } from '../lib/notifications';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export interface Remessa {
  id: string;
  titulo: string;
  tipo: string;
  saldoIni: number;
  contas: number;
  contasNormais?: number;
  contasBaixas?: number;
  deposito: number;
  saque: number;
  status: string;
  notas: string;
  data: string;
  apv?: number;
}

export interface OperationMeta {
  id: string;
  plataforma: string;
  rede: string;
  titulo: string;
  contas: number;
  modelo: string;
  operador?: string;
  totalApv?: number;
  createdAt: string;
  status?: 'ativa' | 'fechada' | 'lixeira';
  remessas?: Remessa[];
  salarioOperador?: number;
  pagamentoOperador?: number;
  isAdminMeta?: boolean;
}

const redes = ['Selecione', 'WE', 'W1', 'VOY', '91', 'DZ', 'A8', 'OKOK', 'ANJO', 'XW', 'EK', 'DY', '777', '888', 'WP', 'BRA', 'GAME', 'ALFA', 'KK', 'MK'];

// --- SUBCOMPONENT: Meta Dashboard (Inside a Meta) ---
const MetaInterior = ({ meta, onBack, onUpdateMeta }: { meta: OperationMeta, onBack: () => void, onUpdateMeta: (m: OperationMeta) => void }) => {
  const [isFinishing, setIsFinishing] = useState(false);
  const [rTitulo, setRTitulo] = useState(String((meta.remessas?.length || 0) + 1));
  const [rTipo, setRTipo] = useState('Remessa');
  const [rSaldoIni, setRSaldoIni] = useState('');
  const [rContasNormais, setRContasNormais] = useState('');
  const [rContasBaixas, setRContasBaixas] = useState('');
  const [rDeposito, setRDeposito] = useState('');
  const [rSaque, setRSaque] = useState('');
  const [rStatus, setRStatus] = useState('Normal');
  const [rNotas, setRNotas] = useState('');
  const [rApv, setRApv] = useState('');

  const [editingRemessaId, setEditingRemessaId] = useState<string | null>(null);
  const [eTitulo, setETitulo] = useState('');
  const [eTipo, setETipo] = useState('Remessa');
  const [eSaldoIni, setESaldoIni] = useState('');
  const [eContasNormais, setEContasNormais] = useState('');
  const [eContasBaixas, setEContasBaixas] = useState('');
  const [eDeposito, setEDeposito] = useState('');
  const [eSaque, setESaque] = useState('');
  const [eStatus, setEStatus] = useState('Normal');
  const [eNotas, setENotas] = useState('');
  const [eApv, setEApv] = useState('');

  const remessas = meta.remessas || [];
  
  const isRecarga = meta.modelo === 'Recarga';
  const totalCompletedContas = remessas.reduce((acc, r) => acc + r.contas, 0);
  const depositoTotal = remessas.reduce((acc, r) => acc + r.deposito, 0);
  const progresso = Math.min(((isRecarga ? depositoTotal : totalCompletedContas) / meta.contas) * 100, 100);
  const saqueTotal = remessas.reduce((acc, r) => acc + r.saque, 0);
  const resultadoBruto = saqueTotal - depositoTotal;
  const resultadoLiquido = resultadoBruto + (meta.salarioOperador || 0);
  const lucroAcumulado = remessas.reduce((acc, r) => r.saque > r.deposito ? acc + (r.saque - r.deposito) : acc, 0);
  const prejuizoAcumulado = remessas.reduce((acc, r) => r.deposito > r.saque ? acc + (r.deposito - r.saque) : acc, 0);
  const remessasPositivas = remessas.filter(r => r.saque > r.deposito).length;
  const acertoPct = remessas.length > 0 ? ((remessasPositivas / remessas.length) * 100).toFixed(0) : '0';
  const totalApvFeito = remessas.reduce((acc, r) => acc + (r.apv || 0), 0);
  const apvRestante = meta.totalApv ? Math.max(0, meta.totalApv - totalApvFeito) : 0;

  const formatBRL = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const handleFinishMeta = () => {
    setIsFinishing(true);
    setTimeout(() => {
      onUpdateMeta({ ...meta, status: 'fechada' });
      pushNotify('🏁 Operação Finalizada', `Meta: ${meta.titulo} fechada!`);
      setIsFinishing(false);
    }, 1500);
  };

  const onRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const numNormais = Number(rContasNormais || 0);
    const numBaixas = Number(rContasBaixas || 0);
    const numTotal = numNormais + numBaixas;
    
    if (!rDeposito || !rSaque) {
      toast.error('Preencha os campos obrigatórios de Depósito e Saque.');
      return;
    }
    
    if (rTipo === 'Remessa' && numTotal === 0) {
      toast.error('Para o tipo Remessa, você deve informar a quantidade de contas.');
      return;
    }

    const newR: Remessa = {
      id: Date.now().toString(),
      titulo: rTitulo || 'Remessa Extra',
      tipo: rTipo,
      saldoIni: Number(rSaldoIni || 0),
      contas: numTotal,
      contasNormais: numNormais,
      contasBaixas: numBaixas,
      deposito: Number(rDeposito),
      saque: Number(rSaque),
      status: rStatus,
      notas: rNotas,
      data: new Date().toISOString(),
      apv: rApv ? Number(rApv) : null
    };
    
    onUpdateMeta({ ...meta, remessas: [newR, ...remessas] });

    // Notification Hook - Remessa Finished
    const resValue = newR.saque - newR.deposito;
    pushNotify(
      `Remessa Registrada 📊`,
      `[${meta.titulo}] Resultado ${resValue >= 0 ? '+' : ''}R$ ${resValue.toFixed(2)} - Deposito: R$ ${newR.deposito} / Saque: R$ ${newR.saque}`
    );
    setRTitulo(String(remessas.length + 2));
    setRSaldoIni('');
    setRContasNormais('');
    setRContasBaixas('');
    setRDeposito('');
    setRSaque('');
    setRNotas('');
    setRApv('');
  };

  const curDep = Number(rDeposito) || 0;
  const curSaq = Number(rSaque) || 0;
  const curRes = curSaq - curDep;
  const curContas = (Number(rContasNormais) || 0) + (Number(rContasBaixas) || 0) || 1;
  const curPerConta = curRes / curContas;

  const openEdit = (rem: Remessa) => {
    setEditingRemessaId(rem.id);
    setETitulo(rem.titulo);
    setETipo(rem.tipo || 'Remessa');
    setESaldoIni(rem.saldoIni ? String(rem.saldoIni) : '');
    setEContasNormais(rem.contasNormais ? String(rem.contasNormais) : '');
    setEContasBaixas(rem.contasBaixas ? String(rem.contasBaixas) : '');
    setEDeposito(String(rem.deposito));
    setESaque(String(rem.saque));
    setEStatus(rem.status || 'Normal');
    setENotas(rem.notas || '');
    setEApv(rem.apv ? String(rem.apv) : '');
  };

  const onSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRemessaId || !eDeposito || !eSaque) return;
    const numNormais = Number(eContasNormais || 0);
    const numBaixas = Number(eContasBaixas || 0);
    const numTotal = numNormais + numBaixas;
    if (numTotal === 0) return;

    const updatedRemessas = remessas.map(r => {
      if (r.id === editingRemessaId) {
        return {
          ...r, titulo: eTitulo, tipo: eTipo, saldoIni: Number(eSaldoIni || 0), contas: numTotal, contasNormais: numNormais, contasBaixas: numBaixas, deposito: Number(eDeposito), saque: Number(eSaque), status: eStatus, notas: eNotas, apv: eApv ? Number(eApv) : null,
        };
      }
      return r;
    });
    onUpdateMeta({ ...meta, remessas: updatedRemessas });
    pushNotify('✏️ Remessa Atualizada', `A remessa foi editada com sucesso.`);
    setEditingRemessaId(null);
  };

  return (
    <div className="space-y-4 animate-fade-in w-full pb-20">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 hover:bg-muted/50 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar ao painel
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
           <h1 className="text-xl md:text-3xl font-extrabold text-foreground tracking-tight">{meta.plataforma} {meta.rede !== 'Selecione' ? `- ${meta.rede}` : ''}</h1>
           <span className={`px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-widest border ${meta.status === 'fechada' ? 'border-primary/50 text-primary bg-primary/10' : 'border-red-900/50 text-red-500 bg-red-950/30'}`}>
             {meta.status || 'ativa'}
           </span>
        </div>
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground/80">Requisitos:</strong> {meta.titulo} · {isRecarga ? `R$ ${meta.contas} recarga` : `${meta.contas} contas`} · {remessas.length} remessas · {acertoPct}% de acerto
          {meta.totalApv ? ` · AP.V Restante: ${apvRestante}` : ''}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {meta.status !== 'fechada' && (
            <button 
              onClick={handleFinishMeta}
              className="flex items-center gap-2 bg-primary/10 border border-primary/50 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-bold transition-all text-xs shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
            >
              <CheckSquare className="w-4 h-4" /> Finalizar meta
            </button>
          )}
        </div>
      </div>

      {resultadoLiquido < 0 && (
         <div className="bg-amber-950/40 border border-amber-900/50 rounded-xl p-4 flex items-center gap-4 animate-fade-in">
           <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
           <div>
             <h3 className="text-sm font-bold text-amber-500">Meta em prejuízo — fique atento</h3>
             <p className="text-xs text-amber-500/70">Resultado acumulado negativo: {formatBRL(resultadoLiquido)}</p>
           </div>
           <div className="ml-auto px-3 py-1 bg-amber-950 border border-amber-900 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded shadow-inner">Atenção</div>
         </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="glass-card flex flex-col justify-center p-4 rounded-xl border-border/40">
           <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Depósito</span>
           <span className="text-base font-bold text-foreground">{formatBRL(depositoTotal)}</span>
        </div>
        <div className="glass-card flex flex-col justify-center p-4 rounded-xl border-border/40">
           <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Saque</span>
           <span className="text-base font-bold text-foreground">{formatBRL(saqueTotal)}</span>
        </div>
        <div className="glass-card flex flex-col justify-center p-4 rounded-xl border-border/40">
           <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Lucro Acum.</span>
           <span className="text-base font-bold text-emerald-400">{formatBRL(lucroAcumulado)}</span>
        </div>
        <div className="glass-card flex flex-col justify-center p-4 rounded-xl border-border/40">
           <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Prejuízo Acum.</span>
           <span className="text-base font-bold text-red-500">{formatBRL(prejuizoAcumulado)}</span>
        </div>
        <div className="glass-card flex flex-col justify-center p-4 rounded-xl border-border/60 bg-muted/20 relative group">
           <span className="text-[9px] uppercase font-bold text-primary tracking-widest mb-1 shadow-inner">SALÁRIO (FAT)</span>
           <div className="flex items-center gap-1">
             <span className="text-xs font-bold text-muted-foreground">R$</span>
             <input 
               type="number" 
               value={meta.salarioOperador || ''} 
               onChange={(e) => onUpdateMeta({ ...meta, salarioOperador: Number(e.target.value) })}
               placeholder="0,00"
               className="bg-transparent border-none p-0 w-full text-base font-black text-foreground focus:ring-0 focus:outline-none placeholder:text-muted-foreground/30"
             />
           </div>
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-background border border-border p-2 rounded shadow-lg text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 w-max max-w-[200px] text-center">
             Faturamento bruto para repasses e contratos
           </div>
        </div>
        <div className="glass-card flex flex-col justify-center p-4 rounded-xl border-border/60 bg-muted/20 relative group">
           <span className="text-[9px] uppercase font-bold text-emerald-500 tracking-widest mb-1 shadow-inner">SALÁRIO OP</span>
           <div className="flex items-center gap-1">
             <span className="text-xs font-bold text-muted-foreground">R$</span>
             <input 
               type="number" 
               value={meta.pagamentoOperador || ''} 
               onChange={(e) => onUpdateMeta({ ...meta, pagamentoOperador: Number(e.target.value) })}
               placeholder="0,00"
               className="bg-transparent border-none p-0 w-full text-base font-black text-foreground focus:ring-0 focus:outline-none placeholder:text-muted-foreground/30"
             />
           </div>
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-background border border-border p-2 rounded shadow-lg text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 w-max max-w-[150px] text-center">
             Pagamento manual do operador
           </div>
        </div>
        <div className="glass-card col-span-2 md:col-span-1 flex flex-col justify-center p-4 rounded-xl border-emerald-900/30 bg-emerald-950/20 shadow-lg">
           <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Resultado Líquido</span>
           <span className={`text-xl font-black drop-shadow-md ${resultadoLiquido >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
             {resultadoLiquido > 0 ? '+' : ''}{formatBRL(resultadoLiquido)}
           </span>
        </div>
      </div>

      <div className="glass-card rounded-2xl border-border/40 p-5 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-foreground">
              {isRecarga ? `Progresso da Recarga: R$ ${depositoTotal} / R$ ${meta.contas}` : `Progresso de Contas: ${totalCompletedContas}/${meta.contas}`}
            </span>
            <span className="text-sm font-bold text-primary">{Math.floor(progresso)}%</span>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2.5 overflow-hidden">
             <div className="bg-primary h-full rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.5)] transition-all duration-1000" style={{ width: `${progresso}%` }} />
          </div>
        </div>
        
        {meta.totalApv ? (
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-foreground">Progresso AP.V: {totalApvFeito}/{meta.totalApv}</span>
              <span className="text-sm font-bold text-primary">{Math.min(100, Math.floor((totalApvFeito / meta.totalApv) * 100))}%</span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-2.5 overflow-hidden">
               <div className="bg-primary h-full rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (totalApvFeito / meta.totalApv) * 100)}%` }} />
            </div>
          </div>
        ) : null}
      </div>

      {meta.status !== 'fechada' && (
      <div className="glass-card rounded-2xl border-border/40 overflow-hidden">
        <div className="bg-muted/10 p-4 border-b border-border/30 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Plus className="w-4 h-4 text-primary" />
             <h3 className="font-bold text-foreground text-sm">Registrar remessa</h3>
           </div>
           <span className="text-[10px] text-muted-foreground font-mono">Remessa #{remessas.length + 1}</span>
        </div>
        <form onSubmit={onRegister} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Título</label>
              <input type="text" value={rTitulo} onChange={e=>setRTitulo(e.target.value)} className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner text-foreground" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Tipo</label>
              <select value={rTipo} onChange={e=>setRTipo(e.target.value)} className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner text-foreground">
                <option>Remessa</option><option>Bônus</option><option>Ajuste</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Saldo Ini.</label>
                <input type="number" value={rSaldoIni} onChange={e=>setRSaldoIni(e.target.value)} className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner text-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase" title="Apostas Válidas">AP.V</label>
                <input type="number" value={rApv} onChange={e=>setRApv(e.target.value)} placeholder="0" className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner text-foreground" />
              </div>
            </div>
            {!meta.isAdminMeta ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center justify-between">Normais {!isRecarga && <span className="text-primary ml-1">(R$ 2)</span>}</label>
                  <input type="number" value={rContasNormais} onChange={e=>setRContasNormais(e.target.value)} placeholder="0" className="w-full bg-primary/5 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner font-bold text-foreground text-center" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center justify-between">Baixo {!isRecarga && <span className="text-muted-foreground ml-1">(R$ 1)</span>}</label>
                  <input type="number" value={rContasBaixas} onChange={e=>setRContasBaixas(e.target.value)} placeholder="0" className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner font-bold text-foreground text-center" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Contas Finalizadas</label>
                <input type="number" value={rContasNormais} onChange={e=>setRContasNormais(e.target.value)} placeholder="0" className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner text-foreground text-center" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border/20 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Depósito *</label>
              <input type="number" required value={rDeposito} onChange={e=>setRDeposito(e.target.value)} placeholder="Ex: 1055" className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 focus:outline-none focus:border-primary shadow-inner font-mono text-foreground" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Saque *</label>
              <input type="number" required value={rSaque} onChange={e=>setRSaque(e.target.value)} placeholder="Ex: 941" className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 focus:outline-none focus:border-primary shadow-inner font-mono text-foreground" />
            </div>
          </div>

          {(rDeposito || rSaque) && (
            <div className={`p-3 rounded-lg border flex items-center justify-between ${curRes < 0 ? 'bg-red-950/20 border-red-900/40' : 'bg-emerald-950/20 border-emerald-900/40'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${curRes < 0 ? 'text-red-500/70' : 'text-emerald-500/70'}`}>{curRes < 0 ? 'Prejuízo' : 'Lucro'}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] text-muted-foreground font-mono">R$ {curPerConta.toFixed(2)}/conta</span>
                <span className={`text-lg font-black ${curRes < 0 ? 'text-red-500' : 'text-emerald-400'}`}>{curRes > 0 ? '+' : ''}{formatBRL(curRes)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 pt-1">
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Status</label>
                <div className="grid grid-cols-4 gap-1">
                  {['Normal', 'Pendente', 'Bloqueada', 'Analise'].map(s => (
                    <button type="button" key={s} onClick={()=>setRStatus(s)} className={`text-[9px] font-bold py-1.5 rounded-lg border ${rStatus === s ? 'bg-primary/10 border-primary/50 text-primary shadow-inner' : 'bg-background/40 border-border/30 text-muted-foreground hover:bg-muted/30'} transition-all`}>
                      {s}
                    </button>
                  ))}
                </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Notas</label>
                <input type="text" value={rNotas} onChange={e=>setRNotas(e.target.value)} placeholder="Opcional..." className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner text-foreground" />
             </div>
          </div>

          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-[0_10px_30px_hsl(var(--primary)/0.2)] mt-2">
             <ArrowUpRight className="w-5 h-5" /> Registrar remessa
          </button>
        </form>
      </div>)}

      <div id="historico-remessas" className="flex justify-between items-end mt-8 mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Histórico</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{remessas.length} remessas · mais recentes primeiro</p>
        </div>
        <button className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground border border-border/50 bg-background/50 px-3 py-1.5 rounded hover:bg-muted transition-all"><RotateCcw className="w-3 h-3"/> Sync</button>
      </div>

      {remessas.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center p-10 border border-dashed border-border/40">
           <p className="text-sm text-muted-foreground">Nenhuma remessa registrada. Use o formulário acima.</p>
        </div>
      ) : (
        <div className="space-y-3">
           {remessas.map((rem) => {
              const rLucro = rem.saque - rem.deposito;
              const isWin = rLucro >= 0;
              return (
              <div key={rem.id} className="glass-card overflow-hidden rounded-xl border border-border/30 relative flex flex-col hover:border-border/60 transition-colors">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWin ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="p-3 pl-5 flex justify-between items-start">
                   <div>
                     <div className="flex items-center gap-2 flex-wrap">
                       <h4 className="font-extrabold text-foreground text-sm">{rem.titulo}</h4>
                       <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${isWin ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-500' : 'bg-red-950/30 border-red-900/50 text-red-500'}`}>
                         {isWin ? '+ Lucro' : '- Prejuízo'}
                       </span>
                     </div>
                     <p className="text-[10px] text-muted-foreground mt-1">{new Date(rem.data).toLocaleString()}</p>
                     {rem.notas && <p className="text-[10px] font-medium text-foreground/70 uppercase tracking-wider mt-1">{rem.notas}</p>}
                   </div>
                   <div className="text-right shrink-0 ml-3">
                     <p className={`text-base font-black tracking-tight ${isWin ? 'text-emerald-400' : 'text-red-500'}`}>
                       {isWin ? '+' : ''}{formatBRL(rLucro)}
                     </p>
                     <p className="text-[9px] text-muted-foreground mt-0.5">R$ {(rLucro/rem.contas).toFixed(2)}/cta</p>
                     <div className="flex justify-end gap-3 mt-2">
                       <Edit2 onClick={() => openEdit(rem)} className="w-3.5 h-3.5 text-muted-foreground hover:text-primary cursor-pointer" />
                       <Trash2 onClick={() => onUpdateMeta({ ...meta, remessas: remessas.filter(r => r.id !== rem.id) })} className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400 cursor-pointer" />
                     </div>
                   </div>
                </div>
                <div className="bg-muted/10 border-t border-border/20 px-5 py-2 grid grid-cols-4 gap-2">
                  <div><p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">Saldo Ini.</p><p className="text-xs font-bold text-foreground">{formatBRL(rem.saldoIni)}</p></div>
                  <div><p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">Depósito</p><p className="text-xs font-bold text-foreground">{formatBRL(rem.deposito)}</p></div>
                  <div><p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">Saque</p><p className="text-xs font-bold text-foreground">{formatBRL(rem.saque)}</p></div>
                  <div><p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">{rem.contas} Contas</p><p className={`text-[10px] font-bold leading-tight ${isWin ? 'text-emerald-500' : 'text-red-500'}`}>{rem.contasNormais||0}N / {rem.contasBaixas||0}B<br/>{formatBRL(rLucro/rem.contas)}/cta</p></div>
                </div>
              </div>
            )})}
        </div>
      )}

      {/* MODAL EDITAR REMESSA */}
      {editingRemessaId && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-[24px] border border-border/50 p-6 shadow-2xl animate-fade-in relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-xl font-bold text-foreground">Editar Remessa</h3>
              <button onClick={() => setEditingRemessaId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={onSaveEdit} className="space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Título</label>
                  <input type="text" value={eTitulo} onChange={e=>setETitulo(e.target.value)} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Saldo Ini.</label>
                    <input type="number" value={eSaldoIni} onChange={e=>setESaldoIni(e.target.value)} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">AP.V</label>
                    <input type="number" value={eApv} onChange={e=>setEApv(e.target.value)} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Depósito *</label>
                  <input type="number" required value={eDeposito} onChange={e=>setEDeposito(e.target.value)} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 font-mono text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Saque *</label>
                  <input type="number" required value={eSaque} onChange={e=>setESaque(e.target.value)} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 font-mono text-foreground focus:border-primary focus:outline-none" />
                </div>
              </div>

              {!meta.isAdminMeta && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Normais</label>
                    <input type="number" value={eContasNormais} onChange={e=>setEContasNormais(e.target.value)} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none text-center" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Baixas</label>
                    <input type="number" value={eContasBaixas} onChange={e=>setEContasBaixas(e.target.value)} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none text-center" />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl mt-4 shadow-[0_5px_15px_hsl(var(--primary)/0.2)] hover:scale-[1.02] transition-transform">
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* FINISH META ANIMATION OVERLAY */}
      {isFinishing && createPortal(
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[99999] flex flex-col items-center justify-center animate-fade-in transition-all">
          <div className="relative">
             <div className="absolute inset-0 bg-primary/30 rounded-full blur-[50px] animate-pulse" />
             <div className="w-24 h-24 rounded-full bg-background border border-primary shadow-[0_0_30px_hsl(var(--primary)/0.4)] flex items-center justify-center relative z-10 animate-bounce">
               <CheckSquare className="w-10 h-10 text-primary" />
             </div>
          </div>
          <h2 className="mt-8 text-3xl font-black tracking-tighter text-foreground animate-pulse">Sucesso!</h2>
          <p className="text-muted-foreground text-sm mt-2 font-medium">Finalizando operação e salvando resultados...</p>
        </div>,
        document.body
      )}

    </div>
  );
};


// --- MAIN Component ---
const Tasks = () => {
  const { metas, users } = useFirestoreData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Minha operacao');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMetaId, setSelectedMetaId] = useState<string | null>(null);

  const [user] = useLocalStorage<any>('nytzer-user', null);
  const [role] = useLocalStorage<'ADMIN' | 'OPERADOR'>('nytzer-role', 'ADMIN');

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Form
  const [plataforma, setPlataforma] = useState('');
  const [rede, setRede] = useState('Selecione');
  const [titulo, setTitulo] = useState('');
  const [contas, setContas] = useState<number | ''>('');
  const [totalApv, setTotalApv] = useState<number | ''>('');
  const [modelo, setModelo] = useState<'Depositante' | 'Recarga'>('Depositante');
  const [isAdminMeta, setIsAdminMeta] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeOperator = user?.username || 'Operador Desconhecido';
    if (!plataforma || rede === 'Selecione' || !titulo || !contas || !activeOperator) return;
    const newMeta = {
      plataforma, rede, titulo, contas: Number(contas), modelo, operador: activeOperator,
      totalApv: totalApv ? Number(totalApv) : null,
      createdAt: new Date().toISOString(),
      status: 'ativa',
      remessas: [],
      isAdminMeta: role === 'ADMIN' ? isAdminMeta : false
    };
    
    await addDoc(collection(db, 'metas'), newMeta);
    
    setIsAdminMeta(false);
    setIsModalOpen(false);

    // Notification Hook - Meta Initiated
    pushNotify(
      'Nova Plataforma Iniciada 🚀', 
      `O operador iniciou a meta "${titulo}" (${contas} contas) na plataforma ${plataforma} / ${rede}.`
    );

    setPlataforma(''); setRede('Selecione'); setTitulo(''); setContas(''); setTotalApv('');
  };

  const onUpdateMeta = async (updatedMeta: OperationMeta) => {
    try {
      const docRef = doc(db, 'metas', updatedMeta.id);
      const metaToUpdate = { ...updatedMeta };
      delete (metaToUpdate as any).id; // Remove id when updating to avoid overwriting doc ID
      await updateDoc(docRef, metaToUpdate as any);
    } catch (error: any) {
      console.error("Erro ao atualizar meta:", error);
      if (error.code === 'permission-denied') {
        toast.error("Erro: Sem permissão para salvar no banco de dados. Verifique as regras do Firestore.");
      } else {
        toast.error("Erro ao salvar no banco de dados.");
      }
    }
  };
  const onTrashMeta = async (id: string) => {
    await updateDoc(doc(db, 'metas', id), { status: 'lixeira' });
  };
  const onRestoreMeta = async (id: string) => {
    await updateDoc(doc(db, 'metas', id), { status: 'ativa' });
  };
  const onPermDelete = async (id: string) => {
    await deleteDoc(doc(db, 'metas', id));
  };

  const activeOperator = user?.username || 'Operador Desconhecido';

  const visibleMetas = React.useMemo(() => {
    if (role === 'ADMIN') {
      return metas.filter(m => {
        if (m.operador === activeOperator) return true; // Suas proprias metas (ex: Admin operando)
        const opUser = users.find(u => u.username === m.operador);
        if (opUser && opUser.affiliatedTo === activeOperator) return true; // Metas de operadores afiliados a este admin
        
        // Backwards compatibility: metas sem operador ou de um operador desconhecido aparecem pro admin logado
        if (!m.operador && activeOperator === 'wiseman') return true; 
        return false;
      });
    }
    return metas.filter(m => m.operador === activeOperator && !m.isAdminMeta);
  }, [metas, role, activeOperator, users]);

  // Derive Lists
  const listActive = visibleMetas.filter(m => !m.status || m.status === 'ativa');
  const listFechadas = visibleMetas.filter(m => m.status === 'fechada');
  const listLixeira = visibleMetas.filter(m => m.status === 'lixeira');

  // Currently Selected
  const selectedMeta = metas.find(m => m.id === selectedMetaId);
  if (selectedMeta) {
    return <MetaInterior meta={selectedMeta} onBack={() => setSelectedMetaId(null)} onUpdateMeta={onUpdateMeta} />;
  }

  // Choose list to render
  let displayList = listActive;
  let emptyMsg = "Crie sua primeira meta de operacao operando no modelo Nytzer.";
  if (activeTab === 'Metas & Fechamento') { displayList = listFechadas; emptyMsg = "Nenhuma meta finalizada. Suas metas fechadas aparecerão aqui."; }
  if (activeTab === 'Lixeira') { displayList = listLixeira; emptyMsg = "Lixeira limpa."; }
  if (activeTab === 'Visao geral') { displayList = visibleMetas.filter(m => m.status !== 'lixeira'); emptyMsg = "Nenhuma meta registrada no sistema."; } // Visao geral mocks totality

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(displayList.length / ITEMS_PER_PAGE);
  const paginatedList = displayList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const renderTableBody = () => {
    return paginatedList.map(meta => {
      const rem = meta.remessas || [];
      const lucroProj = rem.reduce((acc, r) => acc + (r.saque - r.deposito), 0); // Real calc from remessas if exist
      const mockProj = meta.contas * 2.5; // fallback before first remessa
      const isNegative = lucroProj < 0;

      return (
        <tr key={meta.id} className={meta.isAdminMeta ? "bg-black hover:bg-[#0a0a0a] transition-colors group border-y border-border/10 shadow-[inset_4px_0_0_0_hsl(var(--primary))]" : "hover:bg-muted/10 transition-colors group"}>
          <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedMetaId(meta.id)}>
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] ${meta.status === 'fechada' ? 'bg-primary' : meta.status === 'lixeira' ? 'bg-red-500' : 'bg-emerald-500'}`} />
               <div>
                 <div className="flex items-center gap-2">
                   {meta.isAdminMeta && <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest bg-primary/20 text-primary border border-primary/30 uppercase">Admin</span>}
                   <p className="font-bold text-foreground text-sm hover:text-primary transition-colors">{meta.titulo}</p>
                 </div>
                 <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(meta.createdAt).toLocaleDateString()}</p>
               </div>
             </div>
          </td>
          <td className="px-6 py-4">
             <p className="font-bold text-foreground">{meta.plataforma}</p>
             <p className="text-[11px] font-bold text-primary tracking-widest">{meta.rede}</p>
          </td>
          <td className="px-6 py-4 text-center">
             <span className="px-2.5 py-1 bg-muted/50 border border-border/50 rounded text-[10px] font-bold text-muted-foreground uppercase">{meta.modelo}</span>
          </td>
          <td className="px-6 py-4 text-center">
             <span className="font-black text-foreground">{meta.modelo === 'Recarga' ? `R$ ${meta.contas}` : meta.contas}</span>
             <p className="text-[9px] text-muted-foreground">{rem.length} rem.</p>
          </td>
          <td className="px-6 py-4 text-right">
             <p className={`font-bold ${isNegative ? 'text-red-500' : 'text-emerald-400'}`}>
               {isNegative ? '' : '+'}{rem.length > 0 ? `R$ ${lucroProj.toFixed(2).replace('.', ',')}` : `~R$ ${mockProj.toFixed(2).replace('.', ',')}`}
             </p>
          </td>
          <td className="px-6 py-4 text-right">
            <div className="flex gap-2 justify-end">
              {activeTab === 'Lixeira' ? (
                <>
                  <button title="Restaurar" onClick={() => onRestoreMeta(meta.id)} className="text-muted-foreground hover:text-emerald-400 p-2 bg-muted/20 rounded-md opacity-0 group-hover:opacity-100"><RotateCcw className="w-4 h-4" /></button>
                  <button title="Deletar Permanente" onClick={() => onPermDelete(meta.id)} className="text-muted-foreground hover:text-red-400 p-2 bg-muted/20 rounded-md opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                </>
              ) : activeTab !== 'Visao geral' ? (
                <>
                  <button title="Acessar Meta" onClick={() => setSelectedMetaId(meta.id)} className="text-muted-foreground hover:text-primary transition-colors p-2 bg-muted/20 rounded-md opacity-0 group-hover:opacity-100"><ArrowUpRight className="w-4 h-4" /></button>
                  <button title="Mover para Lixeira" onClick={() => onTrashMeta(meta.id)} className="text-muted-foreground hover:text-red-400 transition-colors p-2 bg-muted/20 rounded-md opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                </>
              ) : (
                 <button onClick={() => setSelectedMetaId(meta.id)} className="text-muted-foreground hover:text-primary transition-colors p-2 bg-muted/20 rounded-md opacity-0 group-hover:opacity-100"><ArrowUpRight className="w-4 h-4" /></button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  };
  
  return (
    <div className="space-y-6 animate-fade-in relative z-10 w-full pb-12">
      {/* Header Tabs */}
      <div className="flex bg-muted/20 border border-border/50 rounded-lg p-1.5 overflow-x-auto hide-scrollbar w-fit">
        {['Visao geral', 'Minha operacao', 'Metas & Fechamento', 'Lixeira'].map(tab => (
           <button
             key={tab}
             onClick={() => { setActiveTab(tab); setSelectedMetaId(null); setCurrentPage(1); }}
             className={`px-5 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
               activeTab === tab 
                 ? 'bg-muted text-foreground shadow-sm border border-border/50' 
                 : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
             }`}
           >
             {tab}
           </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-6">
        <div>
           <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{activeTab}</h1>
           <p className="text-sm text-muted-foreground mt-1">Gerenciamento automático do hub.</p>
        </div>
        {activeTab === 'Minha operacao' && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold transition-all hover:scale-105 hover:-translate-y-1 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
            <Plus className="w-5 h-5" /> Nova meta
          </button>
        )}
      </div>

      {activeTab === 'Visao geral' && (
        <div className="glass-card flex p-6 rounded-2xl border-primary/20 items-center justify-between mb-6 shadow-inner relative overflow-hidden group">
          <div className="absolute -right-10 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-primary mb-2">Resumo Global</h3>
            <p className="text-3xl font-black text-foreground">{visibleMetas.length} Operações Totais</p>
            <p className="text-sm text-muted-foreground mt-2">{listActive.length} ativas, {listFechadas.length} fechadas, {listLixeira.length} na lixeira.</p>
          </div>
          <BarChart2 className="w-20 h-20 text-primary/10" />
        </div>
      )}

      {displayList.length === 0 ? (
        <div className="mt-6 glass-card flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border/60 text-center">
           <p className="text-base font-bold text-muted-foreground">{emptyMsg}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {paginatedList.map(meta => {
            const rem = meta.remessas || [];
            const lucroBruto = rem.reduce((acc, r) => acc + (r.saque - r.deposito), 0);
            const salario = meta.salarioOperador || 0;
            const lucroLiquido = lucroBruto + salario;
            return (
              <div key={meta.id} className={meta.isAdminMeta ? "glass-card bg-[#111111]/95 rounded-2xl border border-yellow-500/20 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-yellow-500/40 hover:bg-[#161616] hover:shadow-[0_8px_30px_-10px_rgba(234,179,8,0.15)] hover:-translate-y-0.5 transition-all relative overflow-hidden group cursor-pointer" : "glass-card rounded-2xl border border-border/30 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/40 hover:shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.15)] hover:-translate-y-0.5 transition-all relative overflow-hidden group cursor-pointer"} onClick={() => setSelectedMetaId(meta.id)}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${meta.status === 'fechada' ? 'bg-primary/40' : meta.status === 'lixeira' ? 'bg-red-500' : meta.isAdminMeta ? 'bg-gradient-to-b from-yellow-600 via-yellow-600/80 to-transparent shadow-[0_0_15px_rgba(202,138,4,0.5)]' : 'bg-gradient-to-b from-primary via-primary/80 to-transparent shadow-[0_0_15px_hsl(var(--primary)/0.5)]'}`} />
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor] transition-colors ${meta.status === 'fechada' ? 'text-primary/40 bg-primary/40' : meta.status === 'lixeira' ? 'text-red-500 bg-red-500' : meta.isAdminMeta ? 'text-yellow-600 bg-yellow-600 animate-[pulse_2s_ease-in-out_infinite]' : 'text-primary bg-primary animate-[pulse_2s_ease-in-out_infinite]'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {meta.isAdminMeta && <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-600 border border-yellow-600/30 mr-1 shadow-[0_0_10px_rgba(202,138,4,0.1)]">Admin</span>}
                      <p className="font-extrabold text-foreground text-base truncate group-hover:text-primary transition-colors">{meta.plataforma}</p>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-muted/40 text-muted-foreground border border-border/50">{meta.rede !== 'Selecione' ? meta.rede : 'Geral'}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-muted/40 text-muted-foreground border border-border/50">{meta.modelo}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <strong className="text-foreground/80">Req:</strong> {meta.titulo}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-border/50"></span>
                        {meta.modelo === 'Recarga' ? `R$ ${meta.contas} de recarga` : `${meta.contas} contas`}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-border/50"></span>
                        {rem.length} remessa(s)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0 text-right w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                  <div className="flex flex-col items-start md:items-end">
                    <p className={`text-[16px] font-black tracking-tight ${lucroLiquido >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]'}`}>
                      {lucroLiquido > 0 ? '+' : ''}R$ {lucroLiquido.toFixed(2).replace('.', ',')}
                      <span className="text-[9px] ml-1 opacity-60 uppercase font-black tracking-tighter">Líq</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-muted-foreground/60">Bruto: R$ {lucroBruto.toFixed(0)}</span>
                      {salario > 0 && (
                        <span className="text-[10px] font-bold text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">FAT: +{salario.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {activeTab === 'Lixeira' ? (
                      <>
                        <button onClick={() => onRestoreMeta(meta.id)} className="p-2.5 rounded-xl bg-muted/20 border border-border/30 text-muted-foreground hover:text-emerald-400 hover:bg-muted/40 hover:scale-105 transition-all"><RotateCcw className="w-4 h-4" /></button>
                        <button onClick={() => onPermDelete(meta.id)} className="p-2.5 rounded-xl bg-muted/20 border border-border/30 text-muted-foreground hover:text-red-400 hover:bg-muted/40 hover:scale-105 transition-all"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setSelectedMetaId(meta.id)} className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)] transition-all group-hover:bg-primary group-hover:text-primary-foreground"><ArrowUpRight className="w-4 h-4" /></button>
                        {activeTab !== 'Visao geral' && <button onClick={() => onTrashMeta(meta.id)} className="p-2.5 rounded-xl bg-muted/20 border border-border/30 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 hover:scale-105 transition-all"><Trash2 className="w-4 h-4" /></button>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {displayList.length > 10 && (
        <div className="flex justify-center items-center gap-2 mt-6 animate-fade-in">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg bg-muted/20 border border-border/40 text-muted-foreground disabled:opacity-30 hover:bg-muted/40 transition-colors text-xs font-bold"
          >
            Anterior
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.3)]' : 'bg-muted/20 border border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg bg-muted/20 border border-border/40 text-muted-foreground disabled:opacity-30 hover:bg-muted/40 transition-colors text-xs font-bold"
          >
            Próxima
          </button>
        </div>
      )}

      {/* MODAL - Nova Operação */}
      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 flex items-stretch md:items-center md:justify-center bg-background/70 backdrop-blur-xl md:p-6"
          style={{ zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div
            className="relative flex flex-col w-full md:max-w-xl md:rounded-2xl md:border md:border-border/60 bg-card md:shadow-2xl md:shadow-primary/5 overflow-hidden"
            style={{ maxHeight: '100dvh' }}
          >
            {/* subtle gradient accent */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />

            {/* Header */}
            <div
              className="relative flex items-center justify-between px-6 py-5 border-b border-border/50 shrink-0"
              style={{ paddingTop: `max(env(safe-area-inset-top), 20px)` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground tracking-tight">Nova Operação</h2>
                  <p className="text-[11px] text-muted-foreground">Configure e inicie sua meta</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleCreate} className="p-6 space-y-5">

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground tracking-[0.14em] uppercase">Plataforma *</label>
                    <input type="text" value={plataforma} onChange={e => setPlataforma(e.target.value)} placeholder="Ex. Scorpionpg" className="w-full h-11 bg-muted/30 border border-border/50 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:bg-muted/50 transition-colors" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground tracking-[0.14em] uppercase">Rede *</label>
                    <select value={rede} onChange={e => setRede(e.target.value)} className="w-full h-11 bg-muted/30 border border-border/50 rounded-lg px-3.5 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:bg-muted/50 transition-colors" required>
                      {redes.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground tracking-[0.14em] uppercase">Requisitos *</label>
                  <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex. Media 80 3,5x" className="w-full h-11 bg-muted/30 border border-border/50 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:bg-muted/50 transition-colors" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground tracking-[0.14em] uppercase">{modelo === 'Recarga' ? 'Valor da Recarga (R$) *' : 'Contas *'}</label>
                    <input type="number" value={contas} onChange={e => setContas(e.target.value ? Number(e.target.value) : '')} placeholder={modelo === 'Recarga' ? 'Ex. 5000' : 'Ex. 70'} className="w-full h-11 bg-muted/30 border border-border/50 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:bg-muted/50 font-semibold transition-colors" min="1" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground tracking-[0.14em] uppercase">Total AP.V</label>
                    <input type="number" value={totalApv} onChange={e => setTotalApv(e.target.value ? Number(e.target.value) : '')} placeholder="Ex. 20.000" className="w-full h-11 bg-muted/30 border border-border/50 rounded-lg px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:bg-muted/50 transition-colors" min="0" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground tracking-[0.14em] uppercase">Seleção Rápida</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(modelo === 'Recarga' ? [2500, 5000, 7000, 10000] : [20, 30, 50, 60]).map(val => (
                      <button key={val} type="button" onClick={() => setContas(val)}
                        className={`h-10 rounded-lg text-sm font-semibold border transition-all ${
                          contas === val
                            ? 'bg-primary/15 border-primary/60 text-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]'
                            : 'bg-muted/20 border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                      >{val}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground tracking-[0.14em] uppercase">Modelo da Meta</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 border border-border/40 rounded-xl">
                    {(['Depositante', 'Recarga'] as const).map(mod => (
                      <button key={mod} type="button" onClick={() => setModelo(mod)}
                        className={`h-10 rounded-lg text-sm font-semibold transition-all ${
                          modelo === mod
                            ? 'bg-background text-foreground shadow-sm border border-border/60'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >{mod}</button>
                    ))}
                  </div>
                </div>

                {role === 'ADMIN' && (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl mt-2">
                    <input type="checkbox" id="adminMetaCheck" checked={isAdminMeta} onChange={e => setIsAdminMeta(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" />
                    <label htmlFor="adminMetaCheck" className="text-xs font-bold text-foreground cursor-pointer">
                      Criar como Meta Administrativa
                      <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Metas de admin não contabilizam folha de pagamento.</p>
                    </label>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!plataforma || rede === 'Selecione' || !titulo || !contas}
                    className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm tracking-tight"
                  >
                    <Target className="w-4 h-4" /> Iniciar Operação
                  </button>
                </div>

                {/* Bottom safe area spacer (mobile) */}
                <div className="md:hidden" style={{ height: `calc(env(safe-area-inset-bottom) + 16px)` }} />
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tasks;
