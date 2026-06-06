import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface WeeklyDataPoint {
  name: string;
  contas: number;
  lucro: number;
  diasOperados: number;
}

export const ReportsCharts = ({ weeklyData }: { weeklyData: WeeklyDataPoint[] }) => {
  return (
    <div data-tour="reports-charts" className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
      <div className="glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden group">
        <h3 className="text-base font-bold text-foreground mb-1">Volume de Contas Semanal</h3>
        <p className="text-xs text-muted-foreground mb-6">Acompanhamento histórico da capacidade de produção operacional.</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyData} margin={{ left: -20, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary)/0.2)", borderRadius: 12 }}
              itemStyle={{ color: "hsl(var(--foreground))", fontSize: '13px', fontWeight: 'bold' }}
            />
            <Bar dataKey="contas" name="Contas Totais" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card rounded-2xl p-6 border-primary/10 relative overflow-hidden">
        <h3 className="text-base font-bold text-foreground mb-1">Lucratividade e Presença</h3>
        <p className="text-xs text-muted-foreground mb-6">Relação entre o lucro gerado e o número de dias operados semanalmente.</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={weeklyData} margin={{ left: -20, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary)/0.2)", borderRadius: 12 }}
              itemStyle={{ color: "hsl(var(--foreground))", fontSize: '13px', fontWeight: 'bold' }}
              formatter={(value: any, name: string) => {
                if (name === "Lucro Gerado") return `R$ ${Number(value).toFixed(2)}`;
                if (name === "Dias Operados") return `${value} dias`;
                return value;
              }}
            />
            <Line yAxisId="left" type="monotone" name="Lucro Gerado" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            <Line yAxisId="right" type="monotone" name="Dias Operados" dataKey="diasOperados" stroke="hsl(var(--warning))" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReportsCharts;