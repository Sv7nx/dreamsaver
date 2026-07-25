import { useState } from 'react';
import { HomeIcon, ChartBarIcon, SparklesIcon, TrophyIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useStore } from './hooks/useStore';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import AIHelper from './pages/AIHelper';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import type { UserData } from './types';

export default function App() {
  const { userData, setUserData, updateData, resetData } = useStore();
  const [activePage, setActivePage] = useState('dashboard');

  const handleOnboardingFinish = (data: UserData) => {
    setUserData(data);
  };

  if (!userData) {
    return <Onboarding onFinish={handleOnboardingFinish} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard data={userData} updateData={updateData} />;
      case 'progress': return <Progress data={userData} />;
      case 'ai': return <AIHelper data={userData} />;
      case 'achieve': return <Achievements data={userData} />;
      case 'settings': return <Settings data={userData} updateData={updateData} resetData={resetData} />;
      default: return <Dashboard data={userData} updateData={updateData} />;
    }
  };

  const navItems = [
    { key: 'dashboard', label: 'Главная', icon: HomeIcon },
    { key: 'progress', label: 'Прогресс', icon: ChartBarIcon },
    { key: 'ai', label: 'AI', icon: SparklesIcon },
    { key: 'achieve', label: 'Трофеи', icon: TrophyIcon },
    { key: 'settings', label: 'Ещё', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen min-h-dvh bg-[#0B0E11] pb-16">
      <div className="bg-[#1E2329] px-4 py-3 flex items-center justify-between border-b border-[#2B3139] sticky top-0 z-10 max-w-md mx-auto w-full rounded-b-xl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#F0B90B] rounded-lg flex items-center justify-center text-black font-bold text-xs">D</div>
          <span className="font-bold text-[#EAECEF] text-sm">DreamSaver</span>
        </div>
        <div className="bg-[#0B0E11] rounded-full px-2.5 py-0.5 text-xs text-[#0ECB81] font-mono">
          {userData.saved > 0 ? `+${userData.saved.toLocaleString('ru-RU')} ₽` : '● Старт'}
        </div>
      </div>

      {renderPage()}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#1E2329] border-t border-[#2B3139] flex justify-around py-2 z-10">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActivePage(key)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${activePage === key ? 'text-[#F0B90B]' : 'text-[#848E9C]'}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}