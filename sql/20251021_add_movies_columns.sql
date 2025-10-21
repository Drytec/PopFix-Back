-- Add columns to public.movies for director and suggested_rating (idempotent)
-- Safe to run multiple times

-- 1) Add director (text) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'movies'
      AND column_name = 'director'
  ) THEN
    ALTER TABLE public.movies
      ADD COLUMN director text;
  END IF;
END $$;

-- 2) Add suggested_rating (numeric) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'movies'
      AND column_name = 'suggested_rating'
  ) THEN
    ALTER TABLE public.movies
      ADD COLUMN suggested_rating numeric;
  END IF;
END $$;

-- 3) Ensure a CHECK constraint keeps suggested_rating within [0, 5]
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'movies_suggested_rating_range_chk'
  ) THEN
    ALTER TABLE public.movies
      ADD CONSTRAINT movies_suggested_rating_range_chk
      CHECK (
        suggested_rating IS NULL OR
        (suggested_rating >= 0 AND suggested_rating <= 5)
      );
  END IF;
END $$;

-- 4) Optionally tighten precision to numeric(3,2) so values look like 4.50, 3.25, etc.
--    This block converts non-numeric or unconstrained numeric types to numeric(3,2) safely.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'movies'
      AND column_name = 'suggested_rating'
      AND data_type <> 'numeric'
  ) THEN
    ALTER TABLE public.movies
      ALTER COLUMN suggested_rating TYPE numeric(3,2) USING suggested_rating::numeric;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'movies'
      AND column_name = 'suggested_rating'
      AND (
        numeric_precision IS NULL OR  -- unconstrained numeric
        numeric_scale IS NULL OR
        numeric_precision < 3 OR
        numeric_scale < 2
      )
  ) THEN
    ALTER TABLE public.movies
      ALTER COLUMN suggested_rating TYPE numeric(3,2) USING suggested_rating::numeric;
  END IF;
END $$;

-- 5) Documentation
COMMENT ON COLUMN public.movies.director IS 'Nombre del director (proveniente de Pexels user.name).';
COMMENT ON COLUMN public.movies.suggested_rating IS 'Rating sugerido (0-5) derivado de Pexels; usado para UI de estrellas.';
