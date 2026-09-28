-- SneakerVault schema. Applied by `npm run db:seed` (idempotent).

CREATE TABLE IF NOT EXISTS sneakers (
  id text PRIMARY KEY,
  name text NOT NULL,
  brand text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  original_price numeric(10,2),
  rating numeric(3,2) NOT NULL DEFAULT 4.5,
  review_count integer NOT NULL DEFAULT 0,
  hero_image text NOT NULL DEFAULT '',
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sneaker_sizes (
  sneaker_id text NOT NULL REFERENCES sneakers(id) ON DELETE CASCADE,
  size text NOT NULL,
  available boolean NOT NULL DEFAULT true,
  stock integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (sneaker_id, size)
);

CREATE INDEX IF NOT EXISTS sneaker_sizes_sneaker_id_idx ON sneaker_sizes (sneaker_id);

CREATE TABLE IF NOT EXISTS orders (
  order_id text PRIMARY KEY,
  sneaker_id text NOT NULL,
  sneaker_name text NOT NULL,
  brand text NOT NULL,
  color text NOT NULL DEFAULT '',
  size text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  notes text NOT NULL DEFAULT '',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GHS',
  status text NOT NULL DEFAULT 'PENDING',
  payment_reference text,
  payment_channel text,
  created_at timestamptz NOT NULL DEFAULT now(),
  date text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_reference_idx ON orders (payment_reference);
