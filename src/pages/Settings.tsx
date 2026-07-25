import { useState } from 'react';
import type { UserData } from '../types';

interface Props {
  data: UserData;
  updateData: (d: Partial<UserData>) => void;
  resetData: () => void;
}

export default function Settings({ data, updateData, resetData }: Props) {
  const [goalName, setGoalName] = useState(data.goal.name);
  const [goalAmount, setGoalAmount] = useState(data.goal.amount);
  const [percent, setPercent] = useState(data.percentToGoal);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateData({ goal: { name: goalName, amount: goalAmount }, percentToGoal: percent });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <h1 className="text-xl font-bold text-[#EAECEF] mb-4">Настройки</h1>
      <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139] space-y-4">
        <div>
          <label className="text-sm text-[#848E9C] block mb-1">Название мечты</label>
          <input type="text" value={goalName} onChange={(e) => setGoalName(e.target.value)}
            className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-3 py-2 text-[#EAECEF] outline-none focus:border-[#F0B90B]" />
        </div>
        <div>
          <label className="text-sm text-[#848E9C] block mb-1">Сумма цели (₽)</label>
          <input type="number" value={goalAmount} onChange={(e) => setGoalAmount(+e.target.value)}
            className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-3 py-2 text-[#EAECEF] outline-none focus:border-[#F0B90B]" />
        </div>
        <div>
          <label className="text-sm text-[#848E9C] block mb-1">Процент в мечту: {percent}%</label>
          <input type="range" min={5} max={90} step={5} value={percent} onChange={(e) => setPercent(+e.target.value)}
            className="w-full accent-[#F0B90B]" />
        </div>
        <button onClick={handleSave}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${saved ? 'bg-[#0ECB81] text-black' : 'bg-[#F0B90B] text-black active:scale-95'}`}>
          {saved ? 'Сохранено ✅' : 'Сохранить'}
        </button>
        <button onClick={() => { if (confirm('Удалить все данные?')) resetData(); }}
          className="w-full py-3 rounded-xl text-sm text-[#F6465D] border border-[#F6465D]/30 hover:bg-[#F6465D]/10 transition-colors">
          Сбросить все данные
        </button>
      </div>
    </div>
  );
}