import { useState, useCallback, useEffect } from "react";
import { useSyncedState } from "../../hooks/useSyncedState";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Plus, Trash2 } from "lucide-react";

export interface Column {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "status";
  options?: string[];
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  onDataChange?: (data: Record<string, any>[]) => void;
  title: string;
  subtitle?: string;
  dynamicData?: boolean;
}

const statusColors: Record<string, string> = {
  "Em andamento": "bg-primary/15 text-primary",
  "Concluído": "bg-success/15 text-success",
  "Pendente": "bg-warning/15 text-warning",
  "Atrasado": "bg-destructive/15 text-destructive",
  "Ativo": "bg-success/15 text-success",
  "Inativo": "bg-muted text-muted-foreground",
  "Crítico": "bg-destructive/15 text-destructive",
  "Normal": "bg-success/15 text-success",
  "Baixo": "bg-warning/15 text-warning",
};

export const DataTable = ({ columns, data: initialData, onDataChange, title, subtitle, dynamicData }: DataTableProps) => {
  const [data, setData] = useSyncedState(`nytzer-table-${title}`, initialData, !dynamicData);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);

  useEffect(() => {
    if (dynamicData) {
      setData(initialData);
    }
  }, [initialData, dynamicData, setData]);

  const updateData = useCallback((newData: Record<string, any>[]) => {
    setData(newData);
    onDataChange?.(newData);
  }, [onDataChange, setData]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleCellEdit = (rowIdx: number, col: string, value: string) => {
    const newData = [...data];
    newData[rowIdx] = { ...newData[rowIdx], [col]: value };
    updateData(newData);
  };

  const addRow = () => {
    const newRow: Record<string, any> = {};
    columns.forEach((c) => { newRow[c.key] = c.type === "number" ? 0 : ""; });
    newRow.id = crypto.randomUUID();
    updateData([...data, newRow]);
  };

  const deleteRow = (idx: number) => {
    updateData(data.filter((_, i) => i !== idx));
  };

  const filtered = data.filter((row) =>
    search === "" || Object.values(row).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey];
        const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-8 pl-8 pr-3 text-sm bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48"
            />
          </div>
          <button onClick={addRow} className="h-8 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, rowIdx) => (
              <tr key={row.id || rowIdx} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2">
                    {editingCell?.row === rowIdx && editingCell?.col === col.key ? (
                      col.type === "select" || col.type === "status" ? (
                        <select
                          value={row[col.key]}
                          onChange={(e) => { handleCellEdit(rowIdx, col.key, e.target.value); setEditingCell(null); }}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                          className="w-full bg-muted border border-primary/50 rounded px-2 py-1 text-sm text-foreground focus:outline-none"
                        >
                          {col.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={col.type === "number" ? "number" : "text"}
                          value={row[col.key]}
                          onChange={(e) => handleCellEdit(rowIdx, col.key, col.type === "number" ? Number(e.target.value) as any : e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingCell(null)}
                          autoFocus
                          className="w-full bg-muted border border-primary/50 rounded px-2 py-1 text-sm text-foreground focus:outline-none"
                        />
                      )
                    ) : (
                      <div
                        onClick={() => setEditingCell({ row: rowIdx, col: col.key })}
                        className="cursor-text min-h-[24px] flex items-center"
                      >
                        {col.type === "status" ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[row[col.key]] || "bg-muted text-muted-foreground"}`}>
                            {row[col.key]}
                          </span>
                        ) : col.type === "number" ? (
                          <span className="font-mono">{row[col.key]}</span>
                        ) : (
                          <span>{row[col.key]}</span>
                        )}
                      </div>
                    )}
                  </td>
                ))}
                <td className="px-2">
                  <button onClick={() => deleteRow(rowIdx)} className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2.5 border-t border-border/50 text-xs text-muted-foreground">
        {sorted.length} registro{sorted.length !== 1 ? "s" : ""} · Clique em uma célula para editar
      </div>
    </div>
  );
};
