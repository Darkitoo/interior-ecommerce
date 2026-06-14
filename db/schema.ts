import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  uuid,
  pgEnum,
  foreignKey,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ ENUMS ============

export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);
export const addressTypeEnum = pgEnum('address_type', ['billing', 'shipping']);
export const inventoryReasonEnum = pgEnum('inventory_reason', [
  'purchase',
  'return',
  'restock',
  'adjustment',
  'damaged',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
]);
export const discountTypeEnum = pgEnum('discount_type', [
  'percentage',
  'fixed_amount',
]);

// ============ USERS TABLE ============

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('customer').notNull(),
    phone: varchar('phone', { length: 20 }),
    emailVerified: boolean('email_verified').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_role').on(table.role),
    index('idx_users_deleted_at').on(table.deletedAt),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  cart: many(carts),
  reviews: many(productReviews),
}));

// ============ ADDRESSES TABLE ============

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    type: addressTypeEnum('type').notNull(),
    street: varchar('street', { length: 255 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 100 }).notNull(),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'fk_addresses_user_id',
    }).onDelete('cascade'),
    index('idx_addresses_user_id').on(table.userId),
    index('idx_addresses_type').on(table.type),
  ]
);

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// ============ CATEGORIES TABLE ============

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).unique().notNull(),
    slug: varchar('slug', { length: 255 }).unique().notNull(),
    description: text('description'),
    parentId: uuid('parent_id'),
    imageUrl: varchar('image_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: 'fk_categories_parent_id',
    }).onDelete('set null'),
    index('idx_categories_slug').on(table.slug),
    index('idx_categories_parent_id').on(table.parentId),
  ]
);

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
}));

// ============ PRODUCTS TABLE ============

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 100 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    cost: decimal('cost', { precision: 10, scale: 2 }),
    stockQuantity: integer('stock_quantity').default(0).notNull(),
    categoryId: uuid('category_id'),
    isActive: boolean('is_active').default(true),
    imageUrl: varchar('image_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: 'fk_products_category_id',
    }).onDelete('set null'),
    index('idx_products_category_id').on(table.categoryId),
    index('idx_products_sku').on(table.sku),
    index('idx_products_is_active').on(table.isActive),
  ]
);

export const productsRelations = relations(products, ({ many, one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  reviews: many(productReviews),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  inventoryLogs: many(inventoryLogs),
}));

// ============ PRODUCT IMAGES TABLE ============

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull(),
    imageUrl: varchar('image_url', { length: 500 }).notNull(),
    altText: varchar('alt_text', { length: 255 }),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'fk_product_images_product_id',
    }).onDelete('cascade'),
    index('idx_product_images_product_id').on(table.productId),
  ]
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

// ============ PRODUCT REVIEWS TABLE ============

export const productReviews = pgTable(
  'product_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull(),
    userId: uuid('user_id').notNull(),
    rating: integer('rating').notNull(),
    title: varchar('title', { length: 255 }),
    comment: text('comment'),
    verifiedPurchase: boolean('verified_purchase').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'fk_product_reviews_product_id',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'fk_product_reviews_user_id',
    }).onDelete('cascade'),
    index('idx_product_reviews_product_id').on(table.productId),
    index('idx_product_reviews_user_id').on(table.userId),
  ]
);

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productReviews.userId],
    references: [users.id],
  }),
}));

// ============ CARTS TABLE ============

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at')
      .notNull()
      .default(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'fk_carts_user_id',
    }).onDelete('cascade'),
    index('idx_carts_user_id').on(table.userId),
    index('idx_carts_expires_at').on(table.expiresAt),
  ]
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

// ============ CART ITEMS TABLE ============

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id').notNull(),
    productId: uuid('product_id').notNull(),
    quantity: integer('quantity').default(1).notNull(),
    priceSnapshot: decimal('price_snapshot', { precision: 10, scale: 2 }).notNull(),
    addedAt: timestamp('added_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.cartId],
      foreignColumns: [carts.id],
      name: 'fk_cart_items_cart_id',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'fk_cart_items_product_id',
    }).onDelete('cascade'),
    index('idx_cart_items_cart_id').on(table.cartId),
    index('idx_cart_items_product_id').on(table.productId),
    uniqueIndex('idx_cart_items_unique').on(table.cartId, table.productId),
  ]
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

// ============ ORDERS TABLE ============

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),
    userId: uuid('user_id').notNull(),
    status: orderStatusEnum('status').default('pending').notNull(),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0').notNull(),
    taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).default('0').notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    shippingAddressId: uuid('shipping_address_id'),
    billingAddressId: uuid('billing_address_id'),
    stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    shippedAt: timestamp('shipped_at'),
    deliveredAt: timestamp('delivered_at'),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'fk_orders_user_id',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.shippingAddressId],
      foreignColumns: [addresses.id],
      name: 'fk_orders_shipping_address_id',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.billingAddressId],
      foreignColumns: [addresses.id],
      name: 'fk_orders_billing_address_id',
    }).onDelete('set null'),
    index('idx_orders_user_id').on(table.userId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_created_at').on(table.createdAt),
    index('idx_orders_stripe_payment_id').on(table.stripePaymentId),
  ]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  payment: one(payments),
  inventoryLogs: many(inventoryLogs),
}));

// ============ ORDER ITEMS TABLE ============

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull(),
    productId: uuid('product_id').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'fk_order_items_order_id',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'fk_order_items_product_id',
    }).onDelete('cascade'),
    index('idx_order_items_order_id').on(table.orderId),
  ]
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ============ PAYMENTS TABLE ============

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().unique(),
    stripePaymentId: varchar('stripe_payment_id', { length: 255 }).unique().notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    status: paymentStatusEnum('status').notNull(),
    paymentMethod: varchar('payment_method', { length: 100 }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'fk_payments_order_id',
    }).onDelete('cascade'),
    index('idx_payments_order_id').on(table.orderId),
    index('idx_payments_stripe_payment_id').on(table.stripePaymentId),
  ]
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

// ============ INVENTORY LOGS TABLE ============

export const inventoryLogs = pgTable(
  'inventory_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull(),
    quantityChange: integer('quantity_change').notNull(),
    reason: inventoryReasonEnum('reason').notNull(),
    orderId: uuid('order_id'),
    notes: text('notes'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'fk_inventory_logs_product_id',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'fk_inventory_logs_order_id',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'fk_inventory_logs_created_by',
    }).onDelete('set null'),
    index('idx_inventory_logs_product_id').on(table.productId),
    index('idx_inventory_logs_created_at').on(table.createdAt),
  ]
);

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  product: one(products, {
    fields: [inventoryLogs.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [inventoryLogs.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [inventoryLogs.createdBy],
    references: [users.id],
  }),
}));

// ============ COUPONS TABLE ============

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).unique().notNull(),
    description: text('description'),
    discountType: discountTypeEnum('discount_type').notNull(),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').default(0),
    minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
    validFrom: timestamp('valid_from').notNull(),
    validUntil: timestamp('valid_until'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_coupons_code').on(table.code),
    index('idx_coupons_is_active').on(table.isActive),
  ]
);


