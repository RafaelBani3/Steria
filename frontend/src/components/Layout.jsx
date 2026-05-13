import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import FloatingAIButton from './FloatingAIButton';
import AIAssistantModal from './AIAssistantModal';

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#111827] dark:text-gray-100 font-inter overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full relative">
        <Navbar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNav />
        </div>

        {/* AI Assistant Components */}
        <FloatingAIButton />
        <AIAssistantModal />
      </div>
    </div>
  );
}
