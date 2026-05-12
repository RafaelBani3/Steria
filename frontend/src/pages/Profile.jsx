import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, MapPin, Camera, Edit3, Award, Zap } from 'lucide-react';
import Footer from '../components/Footer';

export default function Profile() {
  const stats = [
    { label: 'Member Since', value: 'May 2026', icon: Zap },
    { label: 'Achievements', value: '4 Badges', icon: Award },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      <div className="bg-white dark:bg-[#1E293B] rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-purple-600 to-indigo-700 relative">
          <div className="absolute -bottom-16 left-12 flex items-end gap-6">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white dark:bg-[#1E293B] p-2 border-4 border-white dark:border-[#1E293B] shadow-xl">
              <div className="w-full h-full rounded-[2rem] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 relative group overflow-hidden">
                <User className="w-12 h-12" />
                <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <h1 className="text-3xl font-black text-white md:text-gray-900 dark:md:text-white">Admin User</h1>
              <p className="text-indigo-100 md:text-gray-500 font-medium">Full Stack Finance Ninja</p>
            </div>
          </div>
        </div>
        
        <div className="pt-24 pb-8 px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Personal Information</h3>
                <button className="text-purple-600 font-bold text-xs flex items-center gap-1 hover:underline">
                  <Edit3 className="w-3 h-3" /> Edit Profile
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { icon: Mail, label: 'Email Address', value: 'admin@steria.finance' },
                  { icon: Shield, label: 'Identity Status', value: 'Verified Member' },
                  { icon: MapPin, label: 'Location', value: 'Jakarta, Indonesia' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-purple-600 shadow-sm">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Financial Identity</h3>
              <div className="grid grid-cols-2 gap-4">
                {stats.map(item => (
                  <div key={item.label} className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                    <item.icon className="w-6 h-6 text-emerald-500 mb-4" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-8 bg-purple-50 dark:bg-purple-500/10 rounded-[2.5rem] border border-purple-100 dark:border-purple-900/30">
                <h4 className="text-purple-900 dark:text-purple-300 font-black mb-2 text-lg">Steria Score: 850</h4>
                <p className="text-xs text-purple-600 dark:text-purple-400 leading-relaxed font-medium">
                  Your financial management score is in the top 5% of users. Excellent discipline on savings and budget allocation!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </motion.div>
  );
}
