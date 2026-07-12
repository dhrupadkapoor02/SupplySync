import prisma from "../../config/prisma.js";

export async function getAllRetailers() {
  return prisma.user.findMany({
    where: { role: "RETAILER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      phone: true,
      name: true,
      businessName: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function approveRetailer(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.role !== "RETAILER") throw new Error("NOT_A_RETAILER");

  return prisma.user.update({
    where: { id },
    data: { status: "APPROVED" },
  });
}

export async function blockRetailer(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.role !== "RETAILER") throw new Error("NOT_A_RETAILER");

  return prisma.user.update({
    where: { id },
    data: { status: "BLOCKED" },
  });
}
