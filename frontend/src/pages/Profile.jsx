import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, MapPin, Camera, Edit3, Award, Zap, Phone, Info, Target, TrendingUp, Save, X, Globe, Link, Check, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { toast } from 'sonner';
import { formatIDR } from '../utils/formatCurrency';
import Footer from '../components/Footer';

const ProfileCard = ({ title, children, icon: Icon, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-8 backdrop-blur-xl group hover:border-white/10 transition-all"
  >
    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-500/5 blur-[50px] group-hover:bg-purple-500/10 transition-all" />
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
          <Icon size={20} />
        </div>
        <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  </motion.div>
);

export default function Profile() {
  const { user, updateUser, isLoading, logout } = useAuthStore();
  const { incomes, expenses, savings, fetchIncomes, fetchExpenses, fetchSavings, selectedMonth, selectedYear } = useFinanceStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    incomeTarget: '',
    financialGoals: '',
    profilePic: ''
  });

  useEffect(() => {
    fetchIncomes();
    fetchExpenses();
    fetchSavings();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        incomeTarget: user.incomeTarget || '',
        financialGoals: user.financialGoals || '',
        profilePic: user.profilePic || ''
      });
    }
  }, [user]);

  // Dynamic Stats Calculations
  const stats = useMemo(() => {
    const totalSavingsValue = savings.reduce((sum, item) => sum + (item.currentAmount || 0), 0);
    
    const filteredIncomes = incomes.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const filteredExpenses = expenses.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const totalIncome = filteredIncomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpense = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const monthlySurplus = totalIncome - totalExpense;

    const totalAssets = totalSavingsValue + (monthlySurplus > 0 ? monthlySurplus : 0);
    const completedGoals = savings.filter(s => s.currentAmount >= s.targetAmount).length;
    
    // Health Score calculation (0-1000)
    const savingsRate = totalIncome > 0 ? (monthlySurplus / totalIncome) * 100 : 0;
    const healthScore = Math.min(Math.max(Math.floor(savingsRate * 10), 300), 1000);

    const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'May 2026';

    return { totalAssets, completedGoals, healthScore, joinDate, savingsRate };
  }, [incomes, expenses, savings, user, selectedMonth, selectedYear]);

  const handleSave = async () => {
    const success = await updateUser(formData);
    if (success) {
      toast.success('Profil berhasil diperbarui ✨');
      setIsEditing(false);
    } else {
      toast.error('Gagal memperbarui profil. Coba lagi nanti.');
    }
  };

  const InfoRow = ({ icon: Icon, label, value, field, type = "text" }) => (
    <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all">
      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-0.5">{label}</p>
        {isEditing && field !== 'email' ? (
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full bg-transparent text-sm font-bold text-white outline-none border-b border-purple-500/30 focus:border-purple-500 transition-colors py-0.5"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        ) : (
          <p className="text-sm font-bold text-white">{value || 'Not set'}</p>
        )}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-24 md:pb-8"
    >
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[3.5rem] border border-white/5 bg-[#0a0a0a] shadow-2xl">
        {/* Cover Image / Gradient */}
        <div className="h-48 md:h-64 bg-gradient-to-br from-[#6C4CF1] via-[#8B5CF6] to-[#10B981] relative overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-[100px]" 
          />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          
          <div className="absolute top-6 right-6 md:top-8 md:right-8 flex gap-3 z-20">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex gap-2"
                >
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/10 transition-all active:scale-95"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save</>}
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="viewing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/10 transition-all active:scale-95"
                >
                  <Edit3 size={16} /> Edit Profile
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Profile Info Overlay */}
        <div className="px-8 md:px-12 pb-12 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20 z-20 relative">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[3rem] bg-[#0a0a0a] p-2 shadow-2xl border-4 border-[#0a0a0a]">
                <div className="w-full h-full rounded-[2.5rem] bg-white/5 flex items-center justify-center text-white/20 relative overflow-hidden group">
                  {formData.profilePic ? (
                    <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16" />
                  )}
                  <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
                    <Camera size={20} />
                    <span>Upload</span>
                  </button>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 h-9 w-9 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg border-4 border-[#0a0a0a]">
                <Check className="w-5 h-5" />
              </div>
            </div>
            
            <div className="text-center md:text-left mb-2">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{user?.name}</h1>
                <div className="bg-purple-600/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] border border-purple-500/20">
                  Pro Member
                </div>
              </div>
              <p className="text-gray-500 font-bold tracking-wide">@{user?.username || 'user'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            <div className="lg:col-span-2 space-y-8">
              <ProfileCard title="Personal Information" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={User} label="Full Name" value={user?.name} field="name" />
                  <InfoRow icon={TrendingUp} label="Username" value={user?.username} field="username" />
                  <InfoRow icon={Mail} label="Email Address" value={user?.email} field="email" />
                  <InfoRow icon={Phone} label="Phone Number" value={user?.phone} field="phone" type="tel" />
                </div>
                <div className="mt-4">
                  <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Info size={14} />
                      </div>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Biography</p>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={3}
                        className="w-full bg-transparent text-sm font-bold text-white outline-none border-b border-purple-500/30 focus:border-purple-500 transition-colors py-1 resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-sm font-medium text-white/80 leading-relaxed italic">
                        "{user?.bio || 'Financial enthusiast and Steria user.'}"
                      </p>
                    )}
                  </div>
                </div>
              </ProfileCard>

              <ProfileCard title="Financial Preferences" icon={Target} delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={Zap} label="Monthly Income Target" value={user?.incomeTarget ? formatIDR(user.incomeTarget) : 'Not set'} field="incomeTarget" type="number" />
                  <InfoRow icon={Award} label="Main Financial Goal" value={user?.financialGoals || 'Not set'} field="financialGoals" />
                </div>
                <div className="mt-6 p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-500/10 to-emerald-500/10 border border-white/5 relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-all duration-1000" />
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Steria Health Score</h4>
                      <p className="text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-widest">
                        {stats.healthScore > 800 ? 'Excellent Status' : 'Good Progress'}
                      </p>
                    </div>
                    <span className="text-4xl font-black text-emerald-500 tracking-tighter">{stats.healthScore}</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.healthScore / 1000) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                  <p className="text-[10px] text-white/40 mt-5 font-medium text-center italic leading-relaxed">
                    {stats.healthScore > 800 
                      ? "Your financial management is in the top 5% of users. Premium performance!" 
                      : "Great job! Keep increasing your saving rate to boost your health score."}
                  </p>
                </div>
              </ProfileCard>
            </div>

            <div className="space-y-8">
              <ProfileCard title="Quick Stats" icon={Award} delay={0.2}>
                <div className="space-y-4">
                  {[
                    { label: 'Member Since', value: stats.joinDate, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Total Assets', value: formatIDR(stats.totalAssets), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Achievements', value: `${stats.completedGoals} Goal(s) Reached`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{stat.label}</p>
                      <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </ProfileCard>

              <ProfileCard title="Social Connectivity" icon={Globe} delay={0.3}>
                <div className="flex justify-center gap-4">
                  {[Globe, Link, Mail].map((Icon, i) => (
                    <button key={i} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5">
                      <Icon size={20} />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/20 mt-6 text-center font-bold uppercase tracking-widest leading-relaxed">
                  Connect your accounts to showcase your achievements.
                </p>
              </ProfileCard>

              <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-red-500/50 to-orange-500/50 shadow-2xl overflow-hidden group">
                <button 
                  onClick={() => logout()}
                  className="w-full h-full bg-[#0a0a0a] rounded-[2.4rem] p-6 flex flex-col items-center justify-center gap-2 group-hover:bg-red-500/10 transition-all active:scale-95"
                >
                  <LogOut className="w-8 h-8 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-white">Log Out</p>
                  <p className="text-[10px] text-white/30 text-center leading-relaxed">
                    Securely sign out of your Steria account.
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </motion.div>
  );
}
