import prisma from '../prisma/index.js';

// ─── GET BUDGET CATEGORIES ────────────────────────────
export const getBudgetCategories = async (req, res) => {
  try {
    const categories = await prisma.budgetCategory.findMany({
      where: { userId: req.user.userId },
      include: {
        budgetItems: {
          include: {
            account: { select: { id: true, accountName: true, providerName: true, color: true, icon: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error("Error in getBudgetCategories:", error);
    res.status(500).json({ error: error.message });
  }
};

// ─── SEED DEFAULT CATEGORIES ──────────────────────────
export const seedDefaultCategories = async (req, res) => {
  try {
    const existing = await prisma.budgetCategory.findMany({
      where: { userId: req.user.userId },
    });

    if (existing.length > 0) {
      return res.json(existing);
    }

    const defaults = ['Needs', 'Wants', 'Savings'];
    const created = await Promise.all(
      defaults.map((name) =>
        prisma.budgetCategory.create({
          data: { userId: req.user.userId, categoryName: name },
        })
      )
    );

    res.status(201).json(created);
  } catch (error) {
    console.error("Error in seedDefaultCategories:", error);
    res.status(500).json({ error: error.message });
  }
};
