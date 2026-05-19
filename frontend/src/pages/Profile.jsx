import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Shield, MapPin, Camera, Edit3,
  Award, Zap, Phone, Info, Target, TrendingUp,
  Save, X, Globe, Link, Check, LogOut, Calendar, DollarSign
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { toast } from 'sonner';
import { formatIDR } from '../utils/formatCurrency';
import Footer from '../components/Footer';

export default function Profile() {
  const { user, updateUser, isLoading, logout } = useAuthStore();
  const {
    incomes, expenses, savings,
    fetchIncomes, fetchExpenses, fetchSavings,
    selectedMonth, selectedYear
  } = useFinanceStore();

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

    // Health Score calculation (300-1000)
    const savingsRate = totalIncome > 0 ? (monthlySurplus / totalIncome) * 100 : 0;
    const healthScore = Math.min(Math.max(Math.floor(savingsRate * 10) + 500, 300), 1000);

    const joinDate = user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      : 'Mei 2026';

    return { totalAssets, completedGoals, healthScore, joinDate };
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page-wrapper"
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Profile Banner Card */}
      <div
        className="glass"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 24,
          background: 'var(--bg-2)',
        }}
      >
        {/* Cover Art (Premium Mesh Gradient) */}
        <div
          style={{
            height: 140,
            background: 'linear-gradient(135deg, var(--violet) 0%, var(--blue) 50%, var(--emerald) 100%)',
            position: 'relative',
            opacity: 0.85,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)',
            }}
          />
        </div>

        {/* User Profile Header Content */}
        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          {/* Avatar and Identity */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: -60,
              gap: 16,
              textAlign: 'center',
            }}
            className="md-row-align"
          >
            {/* Avatar Wrap */}
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  background: 'var(--bg-2)',
                  padding: 4,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                  className="group"
                >
                  {formData.profilePic ? (
                    <img src={formData.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={40} style={{ color: 'var(--t3)' }} />
                  )}
                  <button
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.7)',
                      opacity: 0,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'opacity 0.2s',
                    }}
                    className="group-hover-opacity"
                  >
                    <Camera size={18} color="#fff" />
                  </button>
                </div>
              </div>
              {/* Active Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--emerald)',
                  border: '3px solid var(--bg-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Check size={12} color="#fff" strokeWidth={3} />
              </div>
            </div>

            {/* Name & Identity */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }} className="md-justify-start">
                <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)' }}>
                  {user?.name || 'Rafael'}
                </h1>
                <span className="badge badge-purple">PRO MEMBER</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500 }}>
                @{user?.username || 'user'}
              </p>
            </div>

            {/* Editing Controls */}
            <div style={{ marginTop: 12 }} className="md-mt-0">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ display: 'flex', gap: 8 }}
                  >
                    <button onClick={() => setIsEditing(false)} className="btn-ghost" style={{ padding: '8px 16px' }}>
                      <X size={15} /> Batal
                    </button>
                    <button onClick={handleSave} disabled={isLoading} className="btn-primary" style={{ padding: '8px 18px' }}>
                      {isLoading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="viewing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="btn-ghost"
                    style={{ padding: '8px 18px' }}
                  >
                    <Edit3 size={14} /> Edit Profil
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg-grid-layout">
        {/* Left Column — Inputs & Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="lg-col-span-2">
          {/* Personal Info Card */}
          <div className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p className="section-label">Personal Information</p>
              <p style={{ fontSize: 13, color: 'var(--t3)' }}>Kelola data diri dan kontak akun Anda</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md-grid-cols-2">
              <div className="field-group">
                <span className="field-label">Full Name</span>
                {isEditing ? (
                  <input
                    type="text"
                    className="input-dark"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <div className="input-dark" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--t2)' }}>
                    {user?.name || 'Not set'}
                  </div>
                )}
              </div>

              <div className="field-group">
                <span className="field-label">Username</span>
                {isEditing ? (
                  <input
                    type="text"
                    className="input-dark"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                ) : (
                  <div className="input-dark" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--t2)' }}>
                    @{user?.username || 'Not set'}
                  </div>
                )}
              </div>

              <div className="field-group">
                <span className="field-label">Email Address</span>
                <div className="input-dark" style={{ background: 'rgba(255,255,255,0.01)', color: 'var(--t3)', borderStyle: 'dashed' }}>
                  {user?.email || 'Not set'}
                </div>
              </div>

              <div className="field-group">
                <span className="field-label">Phone Number</span>
                {isEditing ? (
                  <input
                    type="text"
                    className="input-dark"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                ) : (
                  <div className="input-dark" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--t2)' }}>
                    {user?.phone || 'Not set'}
                  </div>
                )}
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">Biography</span>
              {isEditing ? (
                <textarea
                  className="input-dark"
                  rows={2}
                  style={{ resize: 'none' }}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              ) : (
                <div
                  className="input-dark"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    color: 'var(--t2)',
                    minHeight: 60,
                    fontStyle: 'italic',
                  }}
                >
                  "{user?.bio || 'Financial enthusiast and Steria user.'}"
                </div>
              )}
            </div>
          </div>

          {/* Financial Goals & Health Score */}
          <div className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p className="section-label">Financial Preferences</p>
              <p style={{ fontSize: 13, color: 'var(--t3)' }}>Konfigurasi target dan skor kesehatan finansial</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md-grid-cols-2">
              <div className="field-group">
                <span className="field-label">Monthly Income Target</span>
                {isEditing ? (
                  <input
                    type="number"
                    className="input-dark"
                    value={formData.incomeTarget}
                    onChange={(e) => setFormData({ ...formData, incomeTarget: e.target.value })}
                  />
                ) : (
                  <div className="input-dark" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--t2)' }}>
                    {user?.incomeTarget ? formatIDR(user.incomeTarget) : 'Not set'}
                  </div>
                )}
              </div>

              <div className="field-group">
                <span className="field-label">Main Financial Goal</span>
                {isEditing ? (
                  <input
                    type="text"
                    className="input-dark"
                    value={formData.financialGoals}
                    onChange={(e) => setFormData({ ...formData, financialGoals: e.target.value })}
                  />
                ) : (
                  <div className="input-dark" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--t2)' }}>
                    {user?.financialGoals || 'Not set'}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(16,185,129,0.04) 100%)',
                border: '1px solid rgba(124,58,237,0.12)',
                borderRadius: 16,
                padding: 20,
                marginTop: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Steria Health Score</h4>
                  <p style={{ fontSize: 10, color: 'var(--emerald)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>
                    {stats.healthScore > 800 ? 'Sangat Sehat' : 'Progres Baik'}
                  </p>
                </div>
                <span className="font-display" style={{ fontSize: 32, fontWeight: 850, color: 'var(--emerald)' }}>
                  {stats.healthScore}
                </span>
              </div>

              <div className="progress-thick">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.healthScore / 1000) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="progress-fill animate-pulse-glow"
                  style={{
                    background: 'linear-gradient(90deg, var(--violet) 0%, var(--emerald) 100%)',
                  }}
                />
              </div>

              <p style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic', marginTop: 14, textAlign: 'center' }}>
                {stats.healthScore > 800
                  ? "Manajemen finansial Anda masuk dalam kategori 5% teratas. Pertahankan!"
                  : "Kerja bagus! Terus tingkatkan tabungan bulanan Anda untuk menaikkan skor."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column — Stats & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Stats Card */}
          <div className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="section-label">Quick Stats</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={14} style={{ color: 'var(--violet)' }} />
                  <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>Bergabung Sejak</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>{stats.joinDate}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={14} style={{ color: 'var(--emerald)' }} />
                  <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>Total Aset</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--emerald)' }}>{formatIDR(stats.totalAssets)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={14} style={{ color: 'var(--cyan)' }} />
                  <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>Pencapaian</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>{stats.completedGoals} Target</span>
              </div>
            </div>
          </div>

          {/* Social Connectivity Card */}
          <div className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
            <div style={{ alignSelf: 'flex-start' }}>
              <p className="section-label">Social Connectivity</p>
            </div>

            <div style={{ display: 'flex', gap: 12, margin: '8px 0' }}>
              {[Globe, Link, Mail].map((Icon, i) => (
                <button
                  key={i}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--t3)',
                    transition: 'all 0.2s',
                  }}
                  className="social-btn"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4 }}>
              Hubungkan akun Anda untuk memamerkan pencapaian finansial Anda secara publik.
            </p>
          </div>

          {/* Log Out Block */}
          <button
            onClick={() => logout()}
            style={{
              width: '100%',
              background: 'rgba(244,63,94,0.05)',
              border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
            }}
            className="logout-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(244,63,94,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--rose)',
                }}
              >
                <LogOut size={16} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Keluar Akun</p>
                <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Securely sign out of Steria</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Extra CSS Styles scoped to Profile page helper classes */}
      <style>{`
        .group:hover .group-hover-opacity {
          opacity: 1 !important;
        }
        .social-btn:hover {
          background: rgba(255,255,255,0.07) !important;
          color: var(--t1) !important;
          transform: translateY(-1px);
        }
        .logout-btn:hover {
          background: rgba(244,63,94,0.09) !important;
          border-color: rgba(244,63,94,0.3) !important;
        }
        @media (min-width: 768px) {
          .md-row-align {
            flex-direction: row !important;
            text-align: left !important;
          }
          .md-justify-start {
            justify-content: flex-start !important;
          }
          .md-mt-0 {
            margin-top: 0 !important;
          }
          .md-grid-cols-2 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .lg-grid-layout {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .lg-col-span-2 {
            grid-column: span 2 / span 2 !important;
          }
        }
      `}</style>

      <Footer />
    </motion.div>
  );
}
