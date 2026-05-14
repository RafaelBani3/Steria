import prisma from '../prisma/index.js';

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        bio: true,
        profilePic: true,
        incomeTarget: true,
        financialGoals: true,
        createdAt: true
      }
    });
    res.json(user);
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
        name,
        username,
        phone,
        bio,
        profilePic,
        incomeTarget: incomeTarget ? parseFloat(incomeTarget) : undefined,
        financialGoals
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Terjadi Error pada sistem (ERR-3002)' });
  }
};
