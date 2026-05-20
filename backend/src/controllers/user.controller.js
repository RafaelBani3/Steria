import prisma from '../prisma/index.js';

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phoneNumber: true,
        bio: true,
        avatarUrl: true,
        monthlyIncomeTarget: true,
        financialGoals: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    // Map database model to frontend keys
    res.json({
      id: user.id,
      name: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phoneNumber,
      bio: user.bio,
      profilePic: user.avatarUrl,
      incomeTarget: user.monthlyIncomeTarget,
      financialGoals: user.financialGoals,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-3001)' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, username, phone, bio, profilePic, incomeTarget, financialGoals } = req.body;

    // Check if username is taken
    if (username) {
      const existing = await prisma.user.findFirst({
        where: { 
          username,
          NOT: { id: userId }
        }
      });
      if (existing) {
        return res.status(400).json({ error: 'Username sudah digunakan.' });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: name,
        username,
        phoneNumber: phone,
        bio,
        avatarUrl: profilePic,
        monthlyIncomeTarget: incomeTarget ? parseFloat(incomeTarget) : undefined,
        financialGoals
      }
    });

    res.json({
      id: user.id,
      name: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phoneNumber,
      bio: user.bio,
      profilePic: user.avatarUrl,
      incomeTarget: user.monthlyIncomeTarget,
      financialGoals: user.financialGoals,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-3002)' });
  }
};
