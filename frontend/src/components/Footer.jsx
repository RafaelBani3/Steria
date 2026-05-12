import React from 'react';

export default function Footer() {
  return (
    <footer className="pt-12 pb-32 md:pb-8 border-t border-gray-100 dark:border-gray-800 mt-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-emerald-500 flex items-center justify-center text-white font-bold text-[10px]">
            S
          </div>
          <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Steria Finance</span>
        </div>
        <p className="text-[10px] text-gray-400 font-medium">
          © 2026 Steria Finance Platform. All rights reserved. Premium Financial Management.
        </p>
      </div>
    </footer>
  );
}
