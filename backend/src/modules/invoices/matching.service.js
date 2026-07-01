import prisma from '../../config/prisma.js';

function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

export async function matchProduct(rawName, brandId) {
  const products = await prisma.product.findMany({
    where: { brandId },
  });

  if (products.length === 0) {
    return {
      matchedProduct: null,
      matchMethod: 'NEW',
      confidence: 0,
    };
  }

  // Step 1: Exact name match
  const exactMatch = products.find(
    (p) => p.name.toLowerCase() === rawName.toLowerCase()
  );
  if (exactMatch) {
    return {
      matchedProduct: exactMatch,
      matchMethod: 'SKU',
      confidence: 1.0,
    };
  }

  // Step 2: Alias match
  const aliasMatch = products.find((p) =>
    p.aliases.some(
      (alias) => alias.toLowerCase() === rawName.toLowerCase()
    )
  );
  if (aliasMatch) {
    return {
      matchedProduct: aliasMatch,
      matchMethod: 'ALIAS',
      confidence: 0.95,
    };
  }

  // Step 3: Fuzzy match
  let bestMatch = null;
  let bestScore = 0;

  for (const product of products) {
    const nameScore = calculateSimilarity(rawName, product.name);
    const aliasScores = product.aliases.map((a) =>
      calculateSimilarity(rawName, a)
    );
    const score = Math.max(nameScore, ...aliasScores, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  if (bestScore >= 0.6) {
    return {
      matchedProduct: bestMatch,
      matchMethod: 'FUZZY',
      confidence: bestScore,
    };
  }

  // Step 4: No match — needs new product
  return {
    matchedProduct: null,
    matchMethod: 'NEW',
    confidence: 0,
  };
}