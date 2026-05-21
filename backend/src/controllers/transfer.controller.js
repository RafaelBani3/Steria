import prisma from '../prisma/index.js';

export const createTransfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, transferType, notes, transactionDate } = req.body;
    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'Jumlah transfer harus lebih besar dari 0' });
    }

    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findUnique({ where: { id: fromAccountId, userId: req.user.userId } }),
      prisma.account.findUnique({ where: { id: toAccountId, userId: req.user.userId } }),
    ]);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ error: 'Salah satu atau kedua akun tidak ditemukan' });
    }

    if (fromAccount.currentBalance < transferAmount) {
      return res.status(400).json({
        error: `Saldo tidak mencukupi di akun ${fromAccount.accountName}. Saldo saat ini: Rp${fromAccount.currentBalance.toLocaleString('id-ID')}`
      });
    }

    // Perform balance transfer and create Transfer record in a transaction
    const [transfer] = await prisma.$transaction([
      prisma.transfer.create({
        data: {
          userId: req.user.userId,
          fromAccountId,
          toAccountId,
          amount: transferAmount,
          transferType,
          notes,
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        },
        include: {
          fromAccount: { select: { accountName: true, providerName: true } },
          toAccount: { select: { accountName: true, providerName: true } },
        }
      }),
      prisma.account.update({
        where: { id: fromAccountId },
        data: { currentBalance: { decrement: transferAmount } },
      }),
      prisma.account.update({
        where: { id: toAccountId },
        data: { currentBalance: { increment: transferAmount } },
      }),
    ]);

    res.status(201).json(transfer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTransfers = async (req, res) => {
  try {
    const transfers = await prisma.transfer.findMany({
      where: { userId: req.user.userId },
      include: {
        fromAccount: { select: { accountName: true, providerName: true } },
        toAccount: { select: { accountName: true, providerName: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
