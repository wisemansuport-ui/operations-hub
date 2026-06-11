CREATE TABLE public.profit_aggregates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_username text NOT NULL,
  period text NOT NULL CHECK (period IN ('daily','weekly','monthly','7d','30d')),
  period_start timestamptz NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  goal_pct numeric,
  display_name text,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_username, period, period_start)
);

GRANT SELECT ON public.profit_aggregates TO authenticated;
GRANT ALL ON public.profit_aggregates TO service_role;

ALTER TABLE public.profit_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read profit aggregates"
  ON public.profit_aggregates FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profit_aggregates_updated_at
  BEFORE UPDATE ON public.profit_aggregates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_profit_aggregates_lookup
  ON public.profit_aggregates (admin_username, period, period_start DESC);