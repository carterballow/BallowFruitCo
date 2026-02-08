-- ============================================================
-- Ballow Fruit Co. — New Table Migrations
-- Run these in Supabase SQL Editor in order.
-- ============================================================

-- ── 1. Produce Knowledge (RAG vector store #2) ─────────────
-- Stores rich knowledge about each fruit: shelf life details,
-- ripeness indicators, storage tips, flavor profiles, and
-- pairing suggestions. Each row gets embedded so the planner
-- can retrieve relevant produce context via vector search.

CREATE TABLE IF NOT EXISTS produce_knowledge (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fruit_id    TEXT NOT NULL,
  category    TEXT NOT NULL,  -- 'shelf_life' | 'ripeness' | 'storage' | 'flavor' | 'pairing' | 'cooking'
  content     TEXT NOT NULL,  -- the text string that was embedded
  embedding   VECTOR(768),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS produce_knowledge_embedding_idx
  ON produce_knowledge USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ── 2. Nutrition Knowledge (RAG vector store #3) ───────────
-- Stores USDA-style nutritional data per fruit as searchable
-- text chunks. Enables the planner to match high-fiber recipes
-- when the user has a high-fiber goal, etc.

CREATE TABLE IF NOT EXISTS nutrition_knowledge (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fruit_id    TEXT NOT NULL,
  category    TEXT NOT NULL,  -- 'macros' | 'vitamins' | 'minerals' | 'health_benefits' | 'serving_info'
  content     TEXT NOT NULL,
  embedding   VECTOR(768),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nutrition_knowledge_embedding_idx
  ON nutrition_knowledge USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ── 3. Fruit Inventory ─────────────────────────────────────
-- Tracks how many units of each fruit are available.
-- Decrements when an order is placed.

CREATE TABLE IF NOT EXISTS fruit_inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fruit_id    TEXT NOT NULL UNIQUE,
  fruit_name  TEXT NOT NULL,
  quantity    INT NOT NULL DEFAULT 100,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed with 100 units per fruit
INSERT INTO fruit_inventory (fruit_id, fruit_name, quantity) VALUES
  ('naval-oranges',  'Naval Oranges',  100),
  ('blood-oranges',  'Blood Oranges',  100),
  ('lemons',         'Lemons',         100),
  ('limes',          'Limes',          100),
  ('pomegranates',   'Pomegranates',   100),
  ('avocados',       'Avocados',       100)
ON CONFLICT (fruit_id) DO NOTHING;

-- ── 4. Vector Search Functions ─────────────────────────────

-- ── 5. Inventory Decrement Function ───────────────────────
-- Safely decrements inventory, never below 0.

CREATE OR REPLACE FUNCTION decrement_inventory(
  p_fruit_id  TEXT,
  p_quantity  INT
)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE fruit_inventory
  SET quantity = GREATEST(0, quantity - p_quantity),
      updated_at = now()
  WHERE fruit_id = p_fruit_id;
$$;

-- ── 6. Vector Search Functions ─────────────────────────────

CREATE OR REPLACE FUNCTION match_produce_knowledge(
  query_embedding VECTOR(768),
  fruit_filter    TEXT[],
  match_count     INT DEFAULT 5
)
RETURNS TABLE (id UUID, fruit_id TEXT, category TEXT, content TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, fruit_id, category, content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM produce_knowledge
  WHERE fruit_id = ANY(fruit_filter)
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_nutrition_knowledge(
  query_embedding VECTOR(768),
  fruit_filter    TEXT[],
  match_count     INT DEFAULT 5
)
RETURNS TABLE (id UUID, fruit_id TEXT, category TEXT, content TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, fruit_id, category, content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM nutrition_knowledge
  WHERE fruit_id = ANY(fruit_filter)
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
