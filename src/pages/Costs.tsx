import { useState } from "react";
import { DataTable, Column } from "@/components/spreadsheet/DataTable";
import { useFirestoreData } from "@/hooks/useFirestoreData";
import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const columns: Column[] = [
  { key: "data", label: "Data", width: "120px" },
  { key: "categoria", label: "Categoria" },
  { key: "descricao", label: "Descrição" },
  { key: "valor", label: "Valor", type: "number", width: "120px" },
  { key: "operador", label: "Registrado por" },
  { key: "actions", label: "", width: "50px" },
];

const Costs = () => {
  const { costs } = useFirestoreData();
  const [user] = useLocalStorage<any>('nytzer-user', null);
  const operatorName = user?.username || 'Admin';
  const role = user?.role || 'ADMIN';

  const [isAdding, setIsAdding] = useState(false);
  const [categoria, setCategoria] = useState("Infraestrutura");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor) return;

    try {
      await addDoc(collection(db, "costs"), {
        data: new Date().toLocaleDateString('pt-BR'),
        createdAt: new Date().toISOString(),
        categoria,
        descricao,
        valor: Number(valor),
        operador: operatorName,
      });
      toast.success("Custo registrado com sucesso!");
      setIsAdding(false);
      setDescricao("");
      setValor("");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar custo.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente apagar este custo?")) {
      try {
        await deleteDoc(doc(db, "costs", id));
        toast.success("Custo removido!");
      } catch (error) {
        toast.error("Erro ao remover custo.");
      }
    }
  };

  const formattedData = costs.map((c) => ({
    id: c.id,
    data: c.data,
    categoria: c.categoria,
    descricao: c.descricao,
    valor: c.valor,
    operador: c.operador || 'Desconhecido',
    actions: (role === 'ADMIN' || c.operador === operatorName) ? (
      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    ) : null
  }));

  return (
    <div className="space-y-6 pb-20 relative z-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Gestão de Custos</h1>
          <p className="text-sm text-primary/70 mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
             Despesas Operacionais
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-bold transition-transform hover:scale-105 shadow-md"
        >
          <Plus className="w-4 h-4" /> Registrar Custo
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddCost} className="glass-card p-6 rounded-2xl border border-primary/20 space-y-4 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
          <h3 className="font-bold text-foreground mb-4 uppercase tracking-widest text-xs">Novo Registro</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary shadow-inner">
                <option>Infraestrutura</option>
                <option>Marketing</option>
                <option>Software</option>
                <option>Outros</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Descrição</label>
              <input type="text" required value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Servidor AWS" className="w-full bg-background border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary shadow-inner" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Valor (R$)</label>
              <input type="number" required step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" className="w-full bg-background border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary shadow-inner font-mono" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-8 rounded-lg transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              Salvar
            </button>
          </div>
        </form>
      )}

      <DataTable 
        columns={columns} 
        data={formattedData} 
        title="Despesas Registradas" 
        subtitle="Todos os custos lançados no sistema" 
      />
    </div>
  );
};

export default Costs;
