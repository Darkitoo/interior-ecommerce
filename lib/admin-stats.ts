import { db } from '@/lib/db';
import { orders, orderItems, products, users } from '@/db/schema';
import { count, desc, eq, inArray, isNull, sql, sum } from 'drizzle-orm';

// Ordini che contano come fatturato realizzato
const REVENUE_STATUSES: ('paid' | 'delivered')[] = ['paid', 'delivered'];

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;

export async function getAdminStats() {
  const [revenueRow, statusRows, productsRow, usersRow, recentOrders, topProducts] =
    await Promise.all([
      db
        .select({ value: sum(orders.totalAmount) })
        .from(orders)
        .where(inArray(orders.status, REVENUE_STATUSES)),

      db
        .select({ status: orders.status, value: count() })
        .from(orders)
        .groupBy(orders.status),

      db
        .select({ value: count() })
        .from(products)
        .where(eq(products.isActive, true)),

      db
        .select({ value: count() })
        .from(users)
        .where(isNull(users.deletedAt)),

      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt,
          userName: users.name,
        })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(orders.createdAt))
        .limit(5),

      db
        .select({
          productId: products.id,
          name: products.name,
          imageUrl: products.imageUrl,
          totalSold: sql<number>`sum(${orderItems.quantity})`.mapWith(Number),
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orders.status, REVENUE_STATUSES))
        .groupBy(products.id, products.name, products.imageUrl)
        .orderBy(desc(sql`sum(${orderItems.quantity})`))
        .limit(5),
    ]);

  const ordersByStatus: Record<string, number> = {};
  for (const row of statusRows) {
    ordersByStatus[row.status] = row.value;
  }
  const totalOrders = statusRows.reduce((acc, row) => acc + row.value, 0);

  return {
    totalRevenue: Number(revenueRow[0]?.value ?? 0),
    ordersByStatus,
    totalOrders,
    totalProducts: productsRow[0]?.value ?? 0,
    totalUsers: usersRow[0]?.value ?? 0,
    recentOrders: recentOrders.map((o) => ({
      ...o,
      totalAmount: Number(o.totalAmount),
    })),
    topProducts,
  };
}
