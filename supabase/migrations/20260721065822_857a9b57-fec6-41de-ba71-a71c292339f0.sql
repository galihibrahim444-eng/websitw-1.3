
CREATE TABLE public.warehouse_skus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  warehouse TEXT,
  modal NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  weight TEXT,
  dimension TEXT,
  note TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_sku_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_sku_id UUID NOT NULL REFERENCES public.warehouse_skus(id) ON DELETE CASCADE,
  variation TEXT NOT NULL,
  sku TEXT NOT NULL,
  barcode TEXT,
  modal NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON public.warehouse_sku_variations(warehouse_sku_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouse_skus TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouse_sku_variations TO anon, authenticated;
GRANT ALL ON public.warehouse_skus TO service_role;
GRANT ALL ON public.warehouse_sku_variations TO service_role;

ALTER TABLE public.warehouse_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_sku_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read warehouse_skus" ON public.warehouse_skus FOR SELECT USING (true);
CREATE POLICY "Public insert warehouse_skus" ON public.warehouse_skus FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update warehouse_skus" ON public.warehouse_skus FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete warehouse_skus" ON public.warehouse_skus FOR DELETE USING (true);

CREATE POLICY "Public read warehouse_sku_variations" ON public.warehouse_sku_variations FOR SELECT USING (true);
CREATE POLICY "Public insert warehouse_sku_variations" ON public.warehouse_sku_variations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update warehouse_sku_variations" ON public.warehouse_sku_variations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete warehouse_sku_variations" ON public.warehouse_sku_variations FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_warehouse_skus_updated_at
BEFORE UPDATE ON public.warehouse_skus
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warehouse_sku_variations_updated_at
BEFORE UPDATE ON public.warehouse_sku_variations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
