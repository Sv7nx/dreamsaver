import type { UserData } from '../types';

interface Props {
  data: UserData;
}

export default function Achievements({ data }: Props) {
  const progress = data.goal.amount > 0 ? (data.saved / data.goal.amount) * 100 : 0;
  const items = [
    { name: 'Первый шаг', desc: 'Пройден онбординг', done: true },
    { name: 'Первая зарплата', desc: 'Нажал "Зарплата пришла"', done: data.saved > 0 },
    { name: 'Экономист', desc: 'Добавлено 5+ трат', done: (data.spendings || []).length >= 5 },
    { name: 'Полпути', desc: 'Накоплено 50%', done: progress >= 50 },
    { name: 'Кит', desc: 'Накоплено 75%', done: progress >= 75 },
    { name: 'Мечта сбылась!', desc: 'Цель достигнута', done: progress >= 100 },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <h1 className="text-xl font-bold text-[#EAECEF] mb-4">Достижения</h1>
      <div className="space-y-3">
        {items.map((a, i) => (
          <div key={i} className={`bg-[#1E2329] rounded-xl p-3 border flex items-center gap-3 ${a.done ? 'border-[#0ECB81]/40' : 'border-[#2B3139]'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base ${a.done ? 'bg-[#0ECB81]/20' : 'bg-[#2B3139]'}`}>
              {a.done ? '✅' : '🔒'}
            </div>
            <div>
              <div className="font-bold text-sm">{a.name}</div>
              <div className="text-[#848E9C] text-xs">{a.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}