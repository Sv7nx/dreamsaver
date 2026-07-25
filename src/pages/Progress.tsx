import type { UserData } from '../types';
import { todayStr } from '../utils';

interface Props {
  data: UserData;
}

export default function Progress({ data }: Props) {
  const totalExpenses = data.categories.reduce((s, c) => s + c.amount, 0);
  const freeMoney = data.salary - totalExpenses;
  const toGoal = Math.max(0, Math.round(freeMoney * (data.percentToGoal / 100)));
  const progressPercent = data.goal.amount > 0 ? (data.saved / data.goal.amount) * 100 : 0;
  const monthsLeft = toGoal > 0 ? Math.ceil((data.goal.amount - data.saved) / toGoal) : 0;

  const thisMonth = todayStr().slice(0, 7);
  const thisMonthSpendings = (data.spendings || []).filter((s) => s.date.startsWith(thisMonth));

  const dailySpendings: Record<string, number> = {};
  thisMonthSpendings.forEach((s) => { dailySpendings[s.date] = (dailySpendings[s.date] || 0) + s.amount; });

  const daysInCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const barData = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    const date = `${thisMonth}-${day}`;
    return { day: i + 1, amount: dailySpendings[date] || 0, isToday: date === todayStr() };
  });

  const pieData = [
    { name: 'В мечту', value: toGoal, color: '#F0B90B' },
    { name: 'Расходы', value: totalExpenses, color: '#F6465D' },
    { name: 'Свободно', value: Math.max(0, freeMoney - toGoal), color: '#0ECB81' },
  ].filter(d => d.value > 0);
  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

  const snapshots = data.savingsSnapshots || [];
  const currentMonthLabel = new Date().toLocaleDateString('ru-RU', { month: 'short' });
  const lineData = [...snapshots];
  if (lineData.length === 0 || lineData[lineData.length - 1].month !== currentMonthLabel) {
    lineData.push({ month: currentMonthLabel, saved: data.saved });
  } else {
    lineData[lineData.length - 1].saved = data.saved;
  }
  const maxSaved = Math.max(data.goal.amount, ...lineData.map((d) => d.saved));

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-[#EAECEF]">Прогресс</h1>

      <div className="bg-[#1E2329] rounded-2xl p-5 border border-[#2B3139] text-center">
        <div className="text-5xl font-bold text-[#F0B90B] mb-2">{progressPercent.toFixed(1)}%</div>
        <div className="text-[#848E9C] text-sm">мечта достигнута</div>
        <div className="w-full bg-[#2B3139] rounded-full h-3 mt-4">
          <div className="bg-gradient-to-r from-[#F0B90B] to-[#0ECB81] h-3 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progressPercent, 100)}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-[#848E9C]">
          <span>{data.saved.toLocaleString('ru-RU')} ₽</span>
          <span>{data.goal.amount.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139]">
          <div className="text-[#848E9C] text-xs mb-1">В мечту в месяц</div>
          <div className="text-xl font-bold text-[#0ECB81]">+{toGoal.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139]">
          <div className="text-[#848E9C] text-xs mb-1">Примерно осталось</div>
          <div className="text-xl font-bold text-[#EAECEF]">{monthsLeft} мес.</div>
        </div>
      </div>

      {/* Круговая диаграмма */}
      <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139]">
        <h3 className="text-[#848E9C] text-xs uppercase tracking-wider mb-4">Распределение дохода</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                const radius = 35;
                const circumference = 2 * Math.PI * radius;
                let offset = 0;
                return pieData.map((slice, i) => {
                  const percent = slice.value / totalPie;
                  const dashLength = circumference * percent;
                  const dashOffset = -offset;
                  offset += dashLength;
                  return (
                    <circle key={i} cx="50" cy="50" r={radius} fill="none" stroke={slice.color}
                      strokeWidth="12" strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeDashoffset={dashOffset} className="transition-all duration-700" />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-[#EAECEF]">{data.salary.toLocaleString('ru-RU')}</div>
                <div className="text-[10px] text-[#848E9C]">₽ / мес</div>
              </div>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {pieData.map((slice, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="text-xs text-[#848E9C] flex-1">{slice.name}</span>
                <span className="text-xs font-mono text-[#EAECEF]">{((slice.value / totalPie) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Линейный график */}
      <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139]">
        <h3 className="text-[#848E9C] text-xs uppercase tracking-wider mb-4">Рост накоплений</h3>
        {lineData.length > 1 ? (
          <div className="relative h-40">
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3].map((i) => (<div key={i} className="border-t border-[#2B3139] w-full" />))}
            </div>
            <svg viewBox={`0 0 ${(lineData.length - 1) * 100} 100`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <polyline
                points={lineData.map((d, i) => {
                  const x = lineData.length > 1 ? (i / (lineData.length - 1)) * ((lineData.length - 1) * 100) : 0;
                  const y = maxSaved > 0 ? 100 - (d.saved / maxSaved) * 100 : 100;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none" stroke="#F0B90B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between translate-y-5">
              {lineData.map((d, i) => (<span key={i} className="text-[9px] text-[#848E9C]">{d.month}</span>))}
            </div>
          </div>
        ) : (
          <div className="text-center text-[#848E9C] text-xs py-10">Нажми «Зарплата пришла» несколько раз, чтобы увидеть график</div>
        )}
      </div>

      {/* Столбчатая диаграмма */}
      <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139]">
        <h3 className="text-[#848E9C] text-xs uppercase tracking-wider mb-4">Траты по дням ({new Date().toLocaleDateString('ru-RU', { month: 'long' })})</h3>
        {thisMonthSpendings.length > 0 ? (
          <div className="flex items-end gap-[2px] h-32">
            {barData.map((d, i) => {
              const maxBar = Math.max(...barData.map(b => b.amount), 1);
              const height = (d.amount / maxBar) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[8px] text-[#848E9C]">{d.amount > 0 ? (d.amount >= 1000 ? `${(d.amount / 1000).toFixed(0)}к` : d.amount) : ''}</span>
                  <div className={`w-full rounded-t-sm transition-all duration-300 min-h-[2px] ${d.isToday ? 'bg-[#F0B90B]' : d.amount > 0 ? 'bg-[#F6465D]' : 'bg-[#2B3139]'}`}
                    style={{ height: `${Math.max(height, 2)}%` }} title={`${d.day}: ${d.amount} ₽`} />
                  {(d.day === 1 || d.day % 5 === 0 || d.day === daysInCurrentMonth) && (
                    <span className="text-[8px] text-[#848E9C] mt-1">{d.day}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-[#848E9C] text-xs py-10">Добавь траты в историю на главной, чтобы увидеть график</div>
        )}
      </div>
    </div>
  );
}