// Every SQL statement the data layer runs, as plain text + positional params.
//
// Keeping them out of src/lib/db.ts means the queries can be executed against
// any Postgres (including a local one) without the Neon driver, which is what
// makes them testable before they ever reach production.

export interface Query {
  text: string;
  params: unknown[];
}

const SNEAKER_COLUMNS = `
  s.id, s.name, s.brand, s.description, s.price, s.original_price,
  s.rating, s.review_count, s.hero_image, s.colors, s.tags,
  COALESCE(
    (SELECT json_agg(
       json_build_object('size', z.size, 'available', z.available, 'stock', z.stock)
       ORDER BY z.position)
     FROM sneaker_sizes z WHERE z.sneaker_id = s.id),
    '[]'::json
  ) AS sizes`;

export const selectSneakers: Query = {
  text: `SELECT ${SNEAKER_COLUMNS} FROM sneakers s ORDER BY s.name`,
  params: [],
};

export function selectSneakerById(id: string): Query {
  return {
    text: `SELECT ${SNEAKER_COLUMNS} FROM sneakers s WHERE s.id = $1 LIMIT 1`,
    params: [id],
  };
}

export function deleteSizes(sneakerId: string): Query {
  return { text: `DELETE FROM sneaker_sizes WHERE sneaker_id = $1`, params: [sneakerId] };
}

export function insertSize(
  sneakerId: string,
  size: string,
  available: boolean,
  stock: number,
  position: number
): Query {
  return {
    text: `INSERT INTO sneaker_sizes (sneaker_id, size, available, stock, position)
           VALUES ($1, $2, $3, $4, $5)`,
    params: [sneakerId, size, available, stock, position],
  };
}

export function insertSneaker(s: {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  heroImage: string;
  colors: string;
  tags: string;
}): Query {
  return {
    text: `INSERT INTO sneakers (id, name, brand, description, price, original_price,
                                 rating, review_count, hero_image, colors, tags)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb)`,
    params: [
      s.id, s.name, s.brand, s.description, s.price, s.originalPrice ?? null,
      s.rating, s.reviewCount, s.heroImage, s.colors, s.tags,
    ],
  };
}

export function updateSneaker(s: {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  heroImage: string;
  colors: string;
  tags: string;
}): Query {
  return {
    text: `UPDATE sneakers SET
             name = $1, brand = $2, description = $3, price = $4,
             original_price = $5, rating = $6, review_count = $7,
             hero_image = $8, colors = $9::jsonb, tags = $10::jsonb,
             updated_at = now()
           WHERE id = $11`,
    params: [
      s.name, s.brand, s.description, s.price, s.originalPrice ?? null,
      s.rating, s.reviewCount, s.heroImage, s.colors, s.tags, s.id,
    ],
  };
}

export function deleteSneaker(id: string): Query {
  return { text: `DELETE FROM sneakers WHERE id = $1`, params: [id] };
}

export const selectOrders: Query = {
  // order_id starts with the millisecond timestamp, so the tiebreak is also
  // newest-first when two orders share a created_at.
  text: `SELECT * FROM orders ORDER BY created_at DESC, order_id DESC`,
  params: [],
};

export function selectOrderById(orderId: string): Query {
  return { text: `SELECT * FROM orders WHERE order_id = $1 LIMIT 1`, params: [orderId] };
}

// Also matches references shaped SV-<orderId>-<timestamp> so a superseded
// reference still resolves to its order; exact matches win.
export function selectOrderByPaymentReference(reference: string): Query {
  return {
    text: `SELECT * FROM orders
           WHERE payment_reference = $1
              OR starts_with($2, 'SV-' || order_id || '-')
           ORDER BY (payment_reference = $3) DESC, created_at DESC
           LIMIT 1`,
    params: [reference, reference, reference],
  };
}

export function insertOrder(o: {
  orderId: string;
  sneakerId: string;
  sneakerName: string;
  brand: string;
  color: string;
  size: string;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentReference?: string;
  paymentChannel?: string;
  createdAt: string;
  date: string;
}): Query {
  return {
    text: `INSERT INTO orders (order_id, sneaker_id, sneaker_name, brand, color, size,
                               quantity, customer_name, customer_email, customer_phone,
                               delivery_address, notes, subtotal, delivery_fee, tax,
                               total_amount, currency, status, payment_reference,
                               payment_channel, created_at, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                   $15, $16, $17, $18, $19, $20, $21, $22)`,
    params: [
      o.orderId, o.sneakerId, o.sneakerName, o.brand, o.color, o.size,
      o.quantity, o.customerName, o.customerEmail, o.customerPhone,
      o.deliveryAddress, o.notes, o.subtotal, o.deliveryFee, o.tax,
      o.totalAmount, o.currency, o.status, o.paymentReference ?? null,
      o.paymentChannel ?? null, o.createdAt, o.date,
    ],
  };
}

export function updateOrder(o: {
  orderId: string;
  sneakerId: string;
  sneakerName: string;
  brand: string;
  color: string;
  size: string;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentReference?: string;
  paymentChannel?: string;
}): Query {
  return {
    text: `UPDATE orders SET
             sneaker_id = $1, sneaker_name = $2, brand = $3, color = $4, size = $5,
             quantity = $6::int, customer_name = $7, customer_email = $8,
             customer_phone = $9, delivery_address = $10, notes = $11,
             subtotal = $12, delivery_fee = $13, tax = $14, total_amount = $15,
             currency = $16, status = $17, payment_reference = $18,
             payment_channel = $19
           WHERE order_id = $20`,
    params: [
      o.sneakerId, o.sneakerName, o.brand, o.color, o.size, o.quantity,
      o.customerName, o.customerEmail, o.customerPhone, o.deliveryAddress,
      o.notes, o.subtotal, o.deliveryFee, o.tax, o.totalAmount, o.currency,
      o.status, o.paymentReference ?? null, o.paymentChannel ?? null, o.orderId,
    ],
  };
}

// Atomic: both assignments read the pre-update stock, so two concurrent
// payments can never both take the last pair.
export function decrementStock(sneakerId: string, size: string, quantity: number): Query {
  return {
    text: `UPDATE sneaker_sizes
           SET stock = GREATEST(stock - $1::int, 0),
               available = GREATEST(stock - $1::int, 0) > 0
           WHERE sneaker_id = $2 AND size = $3`,
    params: [quantity, sneakerId, size],
  };
}
