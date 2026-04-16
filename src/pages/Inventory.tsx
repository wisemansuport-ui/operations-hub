import { DataTable, Column } from "@/components/spreadsheet/DataTable";

const columns: Column[] = [
  { key: "codigo", label: "Código", width: "100px" },
  { key: "item", label: "Item" },
  { key: "categoria", label: "Categoria", type: "select", options: ["Matéria-prima", "Componente", "Produto acabado", "Consumível"] },
  { key: "quantidade", label: "Qtd", type: "number", width: "80px" },
  { key: "minimo", label: "Mínimo", type: "number", width: "80px" },
  { key: "unidade", label: "Un.", width: "60px" },
  { key: "status", label: "Status", type: "status", options: ["Normal", "Baixo", "Crítico"] },
];

const data = [
  { id: "1", codigo: "MP-001", item: "Chapa de Aço 2mm", categoria: "Matéria-prima", quantidade: 450, minimo: 100, unidade: "un", status: "Normal" },
  { id: "2", codigo: "MP-002", item: "Parafuso M8 x 30", categoria: "Componente", quantidade: 35, minimo: 50, unidade: "cx", status: "Crítico" },
  { id: "3", codigo: "MP-003", item: "Tinta epóxi azul", categoria: "Consumível", quantidade: 82, minimo: 20, unidade: "L", status: "Normal" },
  { id: "4", codigo: "PA-001", item: "Módulo montado A", categoria: "Produto acabado", quantidade: 120, minimo: 50, unidade: "un", status: "Normal" },
  { id: "5", codigo: "MP-004", item: "Borracha vedação", categoria: "Componente", quantidade: 15, minimo: 30, unidade: "m", status: "Baixo" },
];

const Inventory = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Controle de Estoque</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Monitore níveis de estoque e alertas de reposição</p>
    </div>
    <DataTable columns={columns} data={data} title="Inventário" subtitle="Itens em vermelho estão abaixo do nível mínimo" />
  </div>
);

export default Inventory;
