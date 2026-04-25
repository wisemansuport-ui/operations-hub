import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Target, Plus, X, Search, ArrowUpRight, ArrowLeft, AlertTriangle, CheckSquare, Trash2, RotateCcw, BarChart2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { pushNotify, requestNotificationPermission } from '../lib/notifications';

export interface Remessa {
  id: string;
  titulo: string;
  tipo: string;
  saldoIni: number;
  contas: number;
  deposito: number;
  saque: number;
  status: string;
  notas: string;
  data: string;
}

export interface OperationMeta {
  id: string;
  plataforma: string;
  rede: string;
  titulo: string;
  contas: number;
  modelo: string;
  totalApv?: number;
  createdAt: string;
  status?: 'ativa' | 'fechada' | 'lixeira';
  remessas?: Remessa[];
  salarioOperador?: number;
}

const redes = ['Selecione', 'WE', 'W1', 'VOY', '91', 'DZ', 'A8', 'OKOK', 'ANJO', 'XW', 'EK', 'DY', '777', '888', 'WP', 'BRA', 'GAME', 'ALFA', 'KK', 'MK'];

// --- SUBCOMPONENT: Meta Dashboard (Inside a Meta) ---
const MetaInterior = ({ meta, onBack, onUpdateMeta }: { meta: OperationMeta, onBack: () => void, onUpdateMeta: (m: OperationMeta) => void }) => {
  const [rTitulo, setRTitulo] = useState(String((meta.remessas?.length || 0) + 1));
  const [rTipo, setRTipo] = useState('Remessa');
  const [rSaldoIni, setRSaldoIni] = useState('');
  const [rContas, setRContas] = useState('');
  const [rDeposito, setRDeposito] = useState('');
  const [rSaque, setRSaque] = useState('');
  const [rStatus, setRStatus] = useState('Normal');
  const [rNotas, setRNotas] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [salarioFinal, setSalarioFinal] = useState('');

  const remessas = meta.remessas || [];
  
  const totalCompletedContas = remessas.reduce((acc, r) => acc + r.contas, 0);
  const progresso = Math.min((totalCompletedContas / meta.contas) * 100, 100);
  const depositoTotal = remessas.reduce((acc, r) => acc + r.deposito, 0);
  const saqueTotal = remessas.reduce((acc, r) => acc + r.saque, 0);
  const resultadoBruto = saqueTotal - depositoTotal;
  const resultadoLiquido = resultadoBruto - (meta.salarioOperador || 0);
  const lucroAcumulado = remessas.reduce((acc, r) => r.saque > r.deposito ? acc + (r.saque - r.deposito) : acc, 0);
  const prejuizoAcumulado = remessas.reduce((acc, r) => r.deposito > r.saque ? acc + (r.deposito - r.saque) : acc, 0);
  const remessasPositivas = remessas.filter(r => r.saque > r.deposito).length;
  const acertoPct = remessas.length > 0 ? ((remessasPositivas / remessas.length) * 100).toFixed(0) : '0';

  const formatBRL = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const onRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rDeposito || !rSaque || !rContas) return;

    const newR: Remessa = {
      id: Date.now().toString(),
      titulo: rTitulo || 'Remessa Extra',
      tipo: rTipo,
      saldoIni: Number(rSaldoIni || 0),
      contas: Number(rContas),
      deposito: Number(rDeposito),
      saque: Number(rSaque),
      status: rStatus,
      notas: rNotas,
      data: new Date().toISOString()
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
    setRContas('');
    setRDeposito('');
    setRSaque('');
    setRNotas('');
  };

  const curDep = Number(rDeposito) || 0;
  const curSaq = Number(rSaque) || 0;
  const curRes = curSaq - curDep;
  const curContas = Number(rContas) || 1;
  const curPerConta = curRes / curContas;

  return (
    <div className="space-y-4 animate-fade-in w-full pb-20">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 hover:bg-muted/50 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-all">
          <ArrowLeft className="w-4 h-4" /> Voltar ao painel
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
           <h1 className="text-xl md:text-3xl font-extrabold text-foreground tracking-tight">{meta.titulo}</h1>
           <span className={`px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-widest border ${meta.status === 'fechada' ? 'border-primary/50 text-primary bg-primary/10' : 'border-red-900/50 text-red-500 bg-red-950/30'}`}>
             {meta.status || 'ativa'}
           </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {meta.contas} contas · {remessas.length} remessas · {acertoPct}% de acerto
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 bg-background border border-border/50 hover:bg-muted text-foreground px-4 py-2 rounded-lg font-bold transition-all text-xs shadow-inner">
             Editar meta
          </button>
          {meta.status !== 'fechada' && (
            <button 
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-2 bg-primary/10 border border-primary/50 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-bold transition-all text-xs shadow-inner"
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
        <div className="glass-card flex flex-col justify-center p-4 rounded-xl border-border/60 bg-muted/20">
           <span className="text-[9px] uppercase font-bold text-primary tracking-widest mb-1 shadow-inner">Salário Operador</span>
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
        </div>
        <div className="glass-card col-span-2 md:col-span-1 flex flex-col justify-center p-4 rounded-xl border-emerald-900/30 bg-emerald-950/20 shadow-lg">
           <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Resultado Líquido</span>
           <span className={`text-xl font-black drop-shadow-md ${resultadoLiquido >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
             {resultadoLiquido > 0 ? '+' : ''}{formatBRL(resultadoLiquido)}
           </span>
        </div>
      </div>

      <div className="glass-card rounded-2xl border-border/40 p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-foreground">Progresso: {totalCompletedContas}/{meta.contas} contas</span>
          <span className="text-sm font-bold text-primary">{Math.floor(progresso)}%</span>
        </div>
        <div className="w-full bg-muted/30 rounded-full h-2.5 overflow-hidden">
           <div className="bg-primary h-full rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.5)] transition-all duration-1000" style={{ width: `${progresso}%` }} />
        </div>
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Saldo Ini.</label>
              <input type="number" value={rSaldoIni} onChange={e=>setRSaldoIni(e.target.value)} className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner text-foreground" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Contas *</label>
              <input type="number" required value={rContas} onChange={e=>setRContas(e.target.value)} className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner font-bold text-foreground text-center" />
              <div className="flex gap-1">
                {[3,5,10,15,20].map(v => (
                  <button type="button" key={v} onClick={()=>setRContas(String(v))} className="flex-1 text-[9px] font-bold py-1 bg-muted/30 border border-border/40 rounded hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground">{v}</button>
                ))}
              </div>
            </div>
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

          <button type="submit" disabled={!rDeposito || !rSaque || !rContas} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-[0_10px_30px_hsl(var(--primary)/0.2)] disabled:opacity-50 disabled:hover:scale-100 mt-2">
             <ArrowUpRight className="w-5 h-5" /> Registrar remessa
          </button>
        </form>
      </div>)}

      <div className="flex justify-between items-end mt-8 mb-4">
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
                     <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400 cursor-pointer mt-2 ml-auto" />
                   </div>
                </div>
                <div className="bg-muted/10 border-t border-border/20 px-5 py-2 grid grid-cols-4 gap-2">
                  <div><p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">Saldo Ini.</p><p className="text-xs font-bold text-foreground">{formatBRL(rem.saldoIni)}</p></div>
                  <div><p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">Depósito</p><p className="text-xs font-bold text-foreground">{formatBRL(rem.deposito)}</p></div>
                  <div><p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">Saque</p><p className="text-xs font-bold text-foreground">{formatBRL(rem.saque)}</p></div>
                  <div><p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">Por Conta</p><p className={`text-xs font-bold ${isWin ? 'text-emerald-500' : 'text-red-500'}`}>{formatBRL(rLucro/rem.contas)}</p></div>
                </div>
              </div>
            )})}
        </div>
      )}

      {/* MODAL ENCERRAR META */}
      {showCloseModal && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-[24px] border border-border/50 p-6 shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <h3 className="text-xl font-bold text-foreground mb-1">Encerrar Meta</h3>
            <p className="text-sm text-muted-foreground mb-6">Qual será o pagamento (salário) para o operador nesta meta?</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5 block">Salário (R$)</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</div>
                   <input type="number" value={salarioFinal} onChange={e => setSalarioFinal(e.target.value)} placeholder="0.00" className="w-full bg-background border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-foreground focus:outline-none focus:border-primary shadow-inner" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCloseModal(false)} className="flex-1 py-3 bg-muted/30 text-muted-foreground font-bold rounded-xl text-sm border border-transparent hover:bg-muted/50 transition-all">Cancelar</button>
                <button onClick={() => {
                  onUpdateMeta({ ...meta, status: 'fechada', salarioOperador: Number(salarioFinal) || 0 });
                  setShowCloseModal(false);
                  pushNotify('🏁 Operação Finalizada', `Meta: ${meta.titulo} fechada! Salário lançado: R$ ${Number(salarioFinal || 0).toFixed(2)}`);
                }} className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_hsl(var(--primary)/0.4)]">Encerrar</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};


// --- MAIN Component ---
const Tasks = () => {
  const [metas, setMetas] = useLocalStorage<OperationMeta[]>('nytzer-operations', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Minha operacao');
  const [selectedMetaId, setSelectedMetaId] = useState<string | null>(null);

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plataforma || rede === 'Selecione' || !titulo || !contas) return;
    const newMeta: OperationMeta = {
      id: Date.now().toString(),
      plataforma, rede, titulo, contas: Number(contas), modelo, 
      totalApv: totalApv ? Number(totalApv) : undefined,
      createdAt: new Date().toISOString(),
      status: 'ativa',
      remessas: []
    };
    setMetas([newMeta, ...metas]);
    setIsModalOpen(false);

    // Notification Hook - Meta Initiated
    pushNotify(
      'Nova Plataforma Iniciada 🚀', 
      `O operador iniciou a meta "${titulo}" (${contas} contas) na plataforma ${plataforma} / ${rede}.`
    );

    setPlataforma(''); setRede('Selecione'); setTitulo(''); setContas(''); setTotalApv('');
  };

  const onUpdateMeta = (updatedMeta: OperationMeta) => {
    setMetas(metas.map(m => m.id === updatedMeta.id ? updatedMeta : m));
  };
  const onTrashMeta = (id: string) => {
    setMetas(metas.map(m => m.id === id ? { ...m, status: 'lixeira' } : m));
  };
  const onRestoreMeta = (id: string) => {
    setMetas(metas.map(m => m.id === id ? { ...m, status: 'ativa' } : m));
  };
  const onPermDelete = (id: string) => {
    setMetas(metas.filter(m => m.id !== id));
  };

  // Derive Lists
  const listActive = metas.filter(m => !m.status || m.status === 'ativa');
  const listFechadas = metas.filter(m => m.status === 'fechada');
  const listLixeira = metas.filter(m => m.status === 'lixeira');

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
  if (activeTab === 'Visao geral') { displayList = metas.filter(m => m.status !== 'lixeira'); emptyMsg = "Nenhuma meta registrada no sistema."; } // Visao geral mocks totality

  const renderTableBody = () => {
    return displayList.map(meta => {
      const rem = meta.remessas || [];
      const lucroProj = rem.reduce((acc, r) => acc + (r.saque - r.deposito), 0); // Real calc from remessas if exist
      const mockProj = meta.contas * 2.5; // fallback before first remessa
      const isNegative = lucroProj < 0;

      return (
        <tr key={meta.id} className="hover:bg-muted/10 transition-colors group">
          <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedMetaId(meta.id)}>
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] ${meta.status === 'fechada' ? 'bg-primary' : meta.status === 'lixeira' ? 'bg-red-500' : 'bg-emerald-500'}`} />
               <div>
                 <p className="font-bold text-foreground text-sm hover:text-primary transition-colors">{meta.titulo}</p>
                 <p className="text-[10px] text-muted-foreground">{new Date(meta.createdAt).toLocaleDateString()}</p>
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
             <span className="font-black text-foreground">{meta.contas}</span>
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
             onClick={() => { setActiveTab(tab); setSelectedMetaId(null); }}
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
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg font-bold transition-all hover:scale-105 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
            <Plus className="w-5 h-5" /> Nova meta
          </button>
        )}
      </div>

      {activeTab === 'Visao geral' && (
        <div className="glass-card flex p-6 rounded-2xl border-primary/20 items-center justify-between mb-6 shadow-inner relative overflow-hidden group">
          <div className="absolute -right-10 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-primary mb-2">Resumo Global</h3>
            <p className="text-3xl font-black text-foreground">{metas.length} Operações Totais</p>
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
          {displayList.map(meta => {
            const rem = meta.remessas || [];
            const lucroBruto = rem.reduce((acc, r) => acc + (r.saque - r.deposito), 0);
            const salario = meta.salarioOperador || 0;
            const lucroLiquido = lucroBruto - salario;
            return (
              <div key={meta.id} className="glass-card rounded-xl border border-border/40 p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1" onClick={() => setSelectedMetaId(meta.id)}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${meta.status === 'fechada' ? 'bg-primary' : meta.status === 'lixeira' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{meta.titulo}</p>
                    <p className="text-[10px] text-muted-foreground">{meta.plataforma} · {meta.rede} · {meta.contas} contas</p>
                    <p className="text-[10px] text-muted-foreground">{rem.length} remessa(s) · {meta.modelo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div className="flex flex-col items-end">
                    <p className={`text-[13px] font-black tracking-tight ${lucroLiquido >= 0 ? 'text-primary' : 'text-red-500'}`}>
                      {lucroLiquido > 0 ? '+' : ''}R$ {lucroLiquido.toFixed(2).replace('.', ',')}
                      <span className="text-[10px] ml-1 opacity-60 uppercase font-black tracking-tighter">Líq</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold text-muted-foreground/50">Bruto: R$ {lucroBruto.toFixed(0)}</span>
                      {salario > 0 && (
                        <span className="text-[9px] font-bold text-red-500/70">Sal: -{salario.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                  {activeTab === 'Lixeira' ? (
                    <>
                      <button onClick={() => onRestoreMeta(meta.id)} className="p-2 rounded-lg bg-muted/20 text-muted-foreground hover:text-emerald-400 transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onPermDelete(meta.id)} className="p-2 rounded-lg bg-muted/20 text-muted-foreground hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setSelectedMetaId(meta.id)} className="p-2 rounded-lg bg-muted/20 text-muted-foreground hover:text-primary transition-colors"><ArrowUpRight className="w-3.5 h-3.5" /></button>
                      {activeTab !== 'Visao geral' && <button onClick={() => onTrashMeta(meta.id)} className="p-2 rounded-lg bg-muted/20 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL - Nova Operação (Full Screen Takeover via Portal) */}
      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 bg-background flex flex-col"
          style={{ zIndex: 9999 }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0"
            style={{ paddingTop: `calc(env(safe-area-inset-top) + 16px)` }}
          >
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Nova Operação</h2>
              <p className="text-xs text-muted-foreground">Configure e inicie sua meta</p>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleCreate} className="p-5 space-y-5">

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Plataforma *</label>
                  <input type="text" value={plataforma} onChange={e => setPlataforma(e.target.value)} placeholder="Ex. Scorpionpg" className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Rede *</label>
                  <select value={rede} onChange={e => setRede(e.target.value)} className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary" required>
                    {redes.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Título *</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex. Media 80 3,5x" className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Contas *</label>
                  <input type="number" value={contas} onChange={e => setContas(e.target.value ? Number(e.target.value) : '')} placeholder="Ex. 70" className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary font-bold" min="1" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Total AP.V</label>
                  <input type="number" value={totalApv} onChange={e => setTotalApv(e.target.value ? Number(e.target.value) : '')} placeholder="Ex. 20.000" className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary" min="0" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Seleção Rápida de Contas</label>
                <div className="grid grid-cols-4 gap-2">
                  {[20, 30, 50, 60].map(val => (
                    <button key={val} type="button" onClick={() => setContas(val)}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                        contas === val ? 'bg-primary/20 border-primary text-primary' : 'bg-muted/30 border-border/50 text-muted-foreground'
                      }`}
                    >{val}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Modelo da Meta</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Depositante', 'Recarga'] as const).map(mod => (
                    <button key={mod} type="button" onClick={() => setModelo(mod)}
                      className={`py-3.5 rounded-xl text-sm font-bold border transition-all ${
                        modelo === mod ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/50 text-muted-foreground'
                      }`}
                    >{mod}</button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!plataforma || rede === 'Selecione' || !titulo || !contas}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 text-base"
              >
                <Target className="w-5 h-5" /> Iniciar Operação
              </button>

              {/* Bottom safe area spacer */}
              <div style={{ height: `calc(env(safe-area-inset-bottom) + 80px)` }} />
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tasks;
