import prisma from "../../config/prisma.js";

export async function placeOrder(retailerId, items) {
  //Validate all products exists and have enough stocks
  const productIds = items.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  // Check stock for each item
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (product.currentStock < item.quantity) {
      throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
    }
  }

  // Get custom prices for this retailer
  const customPrices = await prisma.userProductPrice.findMany({
    where: {
      userId: retailerId,
      productId: { in: productIds },
    },
  });

  // Calculate total and build order items
  let totalAmount = 0;
  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const customPrice = customPrices.find(
      (cp) => cp.productId === item.productId,
    );
    const price = customPrice
      ? Number(customPrice.customPrice)
      : Number(product.defaultSellingPrice);

    totalAmount += price * item.quantity;
    return {
      productId: item.productId,
      requestedQuantity: item.quantity,
      fulfilledQuantity: 0,
      priceAtTimeOfOrder: price,
      status: "PENDING",
    };
  });
  // Create order with items in a transaction
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        retailerId,
        totalAmount,
        status: "PENDING",
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId: retailerId,
        action: "ORDER_PLACED",
        entityType: "Order",
        entityId: order.id,
        newValue: { totalAmount, itemCount: items.length },
      },
    });

    return order;
  });
}

export async function getOrdersForAdmin(filters = {}) {
  const where = {};

  if (filters.status) where.status = filters.status;
  if (filters.retailerId) where.retailerId = filters.retailerId;

  return prisma.order.findMany({
    where,
    include: {
      retailer: {
        select: {
          id: true,
          name: true,
          phone: true,
          businessName: true,
        },
      },
      orderItems: {
        include: {
          product: {
            include: { brand: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      retailer: {
        select: {
          id: true,
          name: true,
          phone: true,
          businessName: true,
        },
      },
      orderItems: {
        include: {
          product: {
            include: { brand: true },
          },
        },
      },
    },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND");
  return order;
}

export async function fulfillOrder(
  orderId,
  fulfilledItems,
  adminId,
  adminNote,
) {
  return prisma.$transaction(async (tx) => {
    // Lock the order row to prevent concurrent fulfillment
    const orders = await tx.$queryRaw`
      SELECT id, status FROM orders WHERE id = ${orderId} FOR UPDATE
    `;

    if (!orders.length) throw new Error("ORDER_NOT_FOUND");

    const order = orders[0];

    if (order.status !== "PENDING") {
      throw new Error("ORDER_ALREADY_PROCESSED");
    }

    // Get all order items
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
      include: { product: true },
    });

    let allFulfilled = true;
    let anyFulfilled = false;
    const inventoryUpdates = [];

    // Process each fulfilled item
    for (const fulfilledItem of fulfilledItems) {
      const orderItem = orderItems.find(
        (oi) => oi.productId === fulfilledItem.productId,
      );

      if (!orderItem) throw new Error("ORDER_ITEM_NOT_FOUND");

      const quantity = fulfilledItem.fulfilledQuantity;

      // Lock product row before reading stock
      await tx.$queryRaw`
        SELECT id FROM products WHERE id = ${orderItem.productId} FOR UPDATE
      `;

      const product = await tx.product.findUnique({
        where: { id: orderItem.productId },
      });

      if (product.currentStock < quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
      }

      if (quantity < orderItem.requestedQuantity) {
        allFulfilled = false;
      }

      if (quantity > 0) {
        anyFulfilled = true;
      }

      const itemStatus =
        quantity === 0
          ? "REJECTED"
          : quantity < orderItem.requestedQuantity
            ? "PARTIALLY_FULFILLED"
            : "FULFILLED";

      // Update order item
      await tx.orderItem.update({
        where: { id: orderItem.id },
        data: {
          fulfilledQuantity: quantity,
          status: itemStatus,
        },
      });

      // Queue inventory update
      if (quantity > 0) {
        inventoryUpdates.push({
          productId: orderItem.productId,
          quantity,
          oldStock: product.currentStock,
          newStock: product.currentStock - quantity,
          productName: product.name,
        });
      }
    }

    // Apply inventory updates
    for (const update of inventoryUpdates) {
      await tx.product.update({
        where: { id: update.productId },
        data: { currentStock: { decrement: update.quantity } },
      });

      // Audit log for each stock change
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "STOCK_DECREMENTED",
          entityType: "Product",
          entityId: update.productId,
          oldValue: { stock: update.oldStock },
          newValue: { stock: update.newStock },
        },
      });
    }

    // Determine final order status
    const orderStatus = !anyFulfilled
      ? "CANCELLED"
      : allFulfilled
        ? "ACCEPTED"
        : "PARTIALLY_FULFILLED";

    // Update order
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: orderStatus,
        adminNote: adminNote || null,
      },
      include: {
        orderItems: {
          include: { product: true },
        },
        retailer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Audit log for order fulfillment
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "ORDER_FULFILLED",
        entityType: "Order",
        entityId: orderId,
        oldValue: { status: "PENDING" },
        newValue: { status: orderStatus },
      },
    });

    return updatedOrder;
  });
}

export async function getOrdersForRetailer(retailerId) {
  return prisma.order.findMany({
    where: { retailerId },
    include: {
      orderItems: {
        include: {
          product: {
            include: { brand: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateOrderStatus(orderId, status, adminId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status },
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "ORDER_STATUS_UPDATED",
        entityType: "Order",
        entityId: orderId,
        oldValue: { status: order.status },
        newValue: { status },
      },
    });

    return updated;
  });
}
