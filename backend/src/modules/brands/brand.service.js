import prisma from "../../config/prisma.js";

export async function createBrand(data) {
  const existing = await prisma.brand.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new Error("Brand Exists");
  }

  return prisma.brand.create({
    data: {
      name: data.name,
      logoUrl: data.logoUrl || null,
    },
  });
}

export async function getAllBrands() {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function getBrandById(id) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      products: {
        where: {
          currentStock: { gt: 0 },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!brand) {
    throw new Error("Brand Not Found");
  }

  return brand;
}

export async function updateBrand(id, data) {
  const brand = await prisma.findUnique({
    where: { id },
  });

  if (!brand) {
    throw new Error("Brand Not Found");
  }

  return prisma.brand.update({
    where: { id },
    data: {
      name: data.name ?? brand.name,
      logoUrl: data.logoUrl ?? brand.logoUrl,
    },
  });
}
