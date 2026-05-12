import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Shield, Bell, Moon, Languages, HelpCircle, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';

export default function Settings() {
  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, name: 'Profile Information', desc: 'Update your photo and personal details', color: 'text-blue-500' },
        { icon: Shield, name: 'Security', desc: 'Password, 2FA, and login history', color: 'text-emerald-500' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, name: 'Notifications', desc: 'Manage alerts and email preferences', color: 'text-amber-500' },
        { icon: Moon, name: 'Appearance', desc: 'Dark mode and theme settings', color: 'text-purple-500' },
        { icon: Languages, name: 'Language', desc: 'English, Bahasa Indonesia', color: 'text-indigo-500' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, name: 'Help Center', desc: 'FAQs and support tickets', color: 'text-rose-500' },
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and app preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {settingsGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-4">{group.title}</h3>
              <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {group.items.map((item, idx) => (
                  <motion.div 
                    key={item.name}
                    variants={itemVariants}
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group ${idx !== group.items.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-[10px] text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl shadow-purple-500/20">
            <h3 className="text-xl font-black mb-4">Steria Premium</h3>
            <p className="text-purple-100 text-sm leading-relaxed mb-6">
              Unlock advanced analytics, custom icons, and cloud sync across all your devices.
            </p>
            <button className="w-full py-3 bg-white text-purple-600 font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform">
              Upgrade Now
            </button>
          </div>

          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">App Version</p>
            <div className="text-2xl font-black text-gray-900 dark:text-white">v1.2.4</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Latest version installed</p>
          </div>
        </div>
      </div>

      <Footer />
    </motion.div>
  );
}
