import * as React from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export type PeriodPreset = 'HOJE' | 'SEMANA' | 'MES' | 'TODOS' | 'CUSTOM';

export interface DateFilter {
  preset: PeriodPreset;
  from: Date | null;
  to: Date | null;
}

interface PeriodFilterProps {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
  className?: string;
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'HOJE', label: 'Hoje' },
  { key: 'SEMANA', label: 'Semana' },
  { key: 'MES', label: 'Mês' },
  { key: 'TODOS', label: 'Todos' },
];

export function buildDateFilter(preset: PeriodPreset): DateFilter {
  const now = new Date();
  switch (preset) {
    case 'HOJE':
      return { preset, from: startOfDay(now), to: endOfDay(now) };
    case 'SEMANA':
      return { preset, from: startOfWeek(now, { weekStartsOn: 0 }), to: endOfWeek(now, { weekStartsOn: 0 }) };
    case 'MES':
      return { preset, from: startOfMonth(now), to: endOfMonth(now) };
    case 'TODOS':
      return { preset, from: null, to: null };
    default:
      return { preset: 'MES', from: startOfMonth(now), to: endOfMonth(now) };
  }
}

export function isInRange(date: Date, filter: DateFilter): boolean {
  if (filter.preset === 'TODOS' || (!filter.from && !filter.to)) return true;
  const d = date.getTime();
  if (filter.from && filter.to) return d >= filter.from.getTime() && d <= filter.to.getTime();
  if (filter.from) return d >= filter.from.getTime();
  if (filter.to) return d <= filter.to.getTime();
  return true;
}

export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>(
    value.from && value.to ? { from: value.from, to: value.to } : undefined
  );

  const handlePreset = (preset: PeriodPreset) => {
    const f = buildDateFilter(preset);
    onChange(f);
    setRange(f.from && f.to ? { from: f.from, to: f.to } : undefined);
    setOpen(false);
  };

  const handleRangeSelect = (r: DateRange | undefined) => {
    setRange(r);
    if (r?.from && r?.to) {
      onChange({ preset: 'CUSTOM', from: startOfDay(r.from), to: endOfDay(r.to) });
      setOpen(false);
    } else if (r?.from) {
      onChange({ preset: 'CUSTOM', from: startOfDay(r.from), to: endOfDay(r.from) });
    }
  };

  const label = React.useMemo(() => {
    if (value.preset === 'TODOS') return 'Todos';
    if (value.preset === 'HOJE') return 'Hoje';
    if (value.preset === 'SEMANA') return 'Esta semana';
    if (value.preset === 'MES') {
      return format(value.from!, 'MMMM yyyy', { locale: ptBR });
    }
    if (value.preset === 'CUSTOM' && value.from && value.to) {
      if (format(value.from, 'dd/MM') === format(value.to, 'dd/MM')) {
        return format(value.from, 'dd/MM/yyyy');
      }
      return `${format(value.from, 'dd/MM')} – ${format(value.to, 'dd/MM')}`;
    }
    return 'Período';
  }, [value]);

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Quick pills */}
      <div className="flex items-center gap-1 bg-secondary border border-border p-1 rounded-xl">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={cn(
              'px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase rounded-lg transition-all',
              value.preset === p.key && value.preset !== 'CUSTOM'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
              value.preset === 'CUSTOM'
                ? 'bg-primary text-primary-foreground border-primary/60 shadow-sm'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            {value.preset === 'CUSTOM' ? label : 'Personalizar'}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-auto p-0 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
        >
          {/* Preset shortcuts inside popover */}
          <div className="flex gap-1 px-3 pt-3 pb-1 border-b border-border/50 flex-wrap">
            {[
              { label: 'Hoje', days: 0 },
              { label: 'Últimos 7 dias', days: 7 },
              { label: 'Últimos 30 dias', days: 30 },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => {
                  const to = endOfDay(new Date());
                  const from = s.days === 0 ? startOfDay(new Date()) : startOfDay(subDays(new Date(), s.days));
                  setRange({ from, to });
                  onChange({ preset: 'CUSTOM', from, to });
                  setOpen(false);
                }}
                className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              >
                {s.label}
              </button>
            ))}
            {value.preset === 'CUSTOM' && (
              <button
                onClick={() => handlePreset('MES')}
                className="ml-auto px-2 py-1 rounded-lg text-[10px] font-semibold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          <Calendar
            mode="range"
            selected={range}
            onSelect={handleRangeSelect}
            numberOfMonths={2}
            locale={ptBR}
            className="p-3"
          />

          {range?.from && !range?.to && (
            <p className="text-[11px] text-muted-foreground text-center pb-3">
              Selecione a data final
            </p>
          )}
        </PopoverContent>
      </Popover>

      {/* Active period label */}
      {value.preset !== 'TODOS' && (
        <span className="text-[11px] text-muted-foreground font-medium hidden sm:block">
          {label}
        </span>
      )}
    </div>
  );
}
