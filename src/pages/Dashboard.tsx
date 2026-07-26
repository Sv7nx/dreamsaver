import { useState } from 'react';
import {
  PencilIcon, CheckIcon, ClockIcon, XMarkIcon,
  ExclamationTriangleIcon, ShieldCheckIcon, PlusCircleIcon, BellIcon,
} from '@heroicons/react/24/outline';
import type { UserData, Spending } from '../types';
import { todayStr, formatDate } from '../utils';
import { useNotifications } from '../hooks/useNotifications';

interface Props {
  data: UserData;
  updateData: (d: Partial<UserData>) => void;
}

interface ExtendedData extends UserData {
  safetyFund?: number;
  lastSalaryDate?: string;
}

export default function Dashboard({ data, updateData }: Props) {
  const d = data as ExtendedData;

  const [editSalary, setEditSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState(d.salary);
  const [expanded, setExpanded] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [newSpendingDesc, setNewSpendingDesc] = useState('');
  const [newSpendingAmount, setNewSpendingAmount] = useState('');
  const [showForceMajeure, setShowForceMajeure] = useState(false);
  const [fmDesc, setFmDesc] = useState('');
  const [fmAmount, setFmAmount] = useState('');
  const [showExtraIncome, setShowExtraIncome] = useState(false);
  const [eiDesc, setEiDesc] = useState('');
  const [eiAmount, setEiAmount] = useState('');
  const [eiDream, setEiDream] = useState(50);
  const [eiSafety, setEiSafety] = useState(30);
  const [eiBudget, setEiBudget] = useState(20);

  const SAFETY_GOAL = d.salary;
  const SAFETY_PERCENT = 10;
  const today = todayStr();
  const now = new Date();

  const totalExpenses = d.categories.reduce((s, c) => s + c.amount, 0);
  const freeMoney = d.salary - totalExpenses;
  const safetyFund = d.safetyFund || 0;
  const safetyNeeded = Math.max(0, SAFETY_GOAL - safetyFund);
  const safetyContribution = safetyNeeded > 0 ? Math.round(freeMoney * (SAFETY_PERCENT / 100)) : 0;

  const effectiveToGoal = Math.round(freeMoney * (d.percentToGoal / 100));
  const toGoal = effectiveToGoal + (safetyNeeded === 0 ? safetyContribution : 0);
  const toSafety = safetyNeeded > 0 ? safetyContribution : 0;
  const monthBudget = Math.max(0, freeMoney - effectiveToGoal - toSafety);

  const lastSalary = d.lastSalaryDate || d.salaryHistory?.sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
  const periodStart = lastSalary ? new Date(lastSalary) : new Date(now.getFullYear(), now.getMonth(), 1);
  const daysTotal = 30;
  const daysPassed = Math.min(daysTotal, Math.max(0, Math.floor((now.getTime() - periodStart.getTime()) / 86400000) + 1));
  const daysLeft = Math.max(1, daysTotal - daysPassed + 1);
  const periodStartStr = periodStart.toISOString().slice(0, 10);

  const periodSpendings = (d.spendings || []).filter(s => s.date >= periodStartStr);
  const regularSpent = periodSpendings.filter(s => !s.category?.includes('форс-мажор')).reduce((sum, s) => sum + s.amount, 0);
  const fmSpent = periodSpendings.filter(s => s.category?.includes('форс-мажор')).reduce((sum, s) => sum + s.amount, 0);

  const remainingBudget = Math.max(0, monthBudget - regularSpent);
  const dailyLimit = Math.round(remainingBudget / daysLeft);
  const progressPercent = d.goal.amount > 0 ? (d.saved / d.goal.amount) * 100 : 0;
  const monthsDelayed = toGoal > 0 && fmSpent > 0 ? Math.ceil(fmSpent / toGoal) : 0;
  const safetyPercent = SAFETY_GOAL > 0 ? (safetyFund / SAFETY_GOAL) * 100 : 100;

  const update = (partial: Partial<ExtendedData>) => updateData(partial as Partial<UserData>);
  const { permission, scheduled, requestPermission, scheduleDailyReminder, sendTestNotification } = useNotifications();

  const handleSalary = () => {
    if (freeMoney <= 0) return;
    const history = d.salaryHistory || [];
    const snapshots = d.savingsSnapshots || [];
    const monthLabel = now.toLocaleDateString('ru-RU', { month: 'short' });
    let updated = [...snapshots];
    const idx = updated.findIndex((s: any) => s.month === monthLabel);
    if (idx >= 0) {
      updated[idx] = { month: monthLabel, saved: d.saved + toGoal };
    } else {
      updated.push({ month: monthLabel, saved: d.saved + toGoal });
    }
    update({
      saved: d.saved + toGoal,
      safetyFund: safetyFund + toSafety,
      salaryHistory: [...history, { date: today, amount: d.salary }],
      savingsSnapshots: updated,
      lastSalaryDate: today,
    });
  };

  const saveSalary = () => { update({ salary: salaryInput }); setEditSalary(false); };
  const updateCategory = (i: number, amount: number) => {
    const cats = [...d.categories]; cats[i] = { ...cats[i], amount }; update({ categories: cats });
  };
  const addCategory = () => update({ categories: [...d.categories, { name: 'Новая', amount: 0, icon: '📌' }] });
  const removeCategory = (i: number) => update({ categories: d.categories.filter((_, idx) => idx !== i) });

  const addSpending = () => {
    const amount = +newSpendingAmount;
    if (!newSpendingDesc.trim() || amount <= 0) return;
    const warning = amount > dailyLimit ? ` ⚠️ На ${(amount - dailyLimit).toLocaleString('ru-RU')} ₽ больше дневного лимита` : '';
    const sp: Spending = { id: Date.now().toString(), amount, description: newSpendingDesc.trim() + warning, category: 'трата', date: today };
    update({ spendings: [...(d.spendings || []), sp] });
    setNewSpendingDesc(''); setNewSpendingAmount('');
  };

  const addForceMajeure = () => {
    const amount = +fmAmount;
    if (!fmDesc.trim() || amount <= 0) return;
    let fromSafety = 0, fromDream = 0, remaining = amount;
    if (safetyFund > 0) { fromSafety = Math.min(safetyFund, remaining); remaining -= fromSafety; }
    if (remaining > 0) { fromDream = Math.min(d.saved, remaining); remaining -= fromDream; }
    const parts: string[] = [];
    if (fromSafety > 0) parts.push(`из подушки ${fromSafety.toLocaleString('ru-RU')} ₽`);
    if (fromDream > 0) parts.push(`из мечты ${fromDream.toLocaleString('ru-RU')} ₽`);
    const sp: Spending = {
      id: Date.now().toString(), amount,
      description: `🚨 ${fmDesc.trim()} (${parts.join(', ')})${remaining > 0 ? ` ⚠️ Не хватило ${remaining.toLocaleString('ru-RU')} ₽` : ''}`,
      category: 'форс-мажор', date: today,
    };
    update({ safetyFund: safetyFund - fromSafety, saved: d.saved - fromDream, spendings: [...(d.spendings || []), sp] });
    setFmDesc(''); setFmAmount(''); setShowForceMajeure(false);
  };

  const addExtraIncome = () => {
    const amount = +eiAmount;
    if (!eiDesc.trim() || amount <= 0) return;
    const toDream = Math.round(amount * (eiDream / 100));
    const toSafety = Math.round(amount * (eiSafety / 100));
    const toBudget = amount - toDream - toSafety;
    const sp: Spending = {
      id: Date.now().toString(), amount,
      description: `💎 ${eiDesc.trim()} (мечта: +${toDream.toLocaleString('ru-RU')} ₽, подушка: +${toSafety.toLocaleString('ru-RU')} ₽, бюджет: +${toBudget.toLocaleString('ru-RU')} ₽)`,
      category: 'доп.доход', date: today,
    };
    update({ saved: d.saved + toDream, safetyFund: safetyFund + toSafety, spendings: [...(d.spendings || []), sp], salary: d.salary + toBudget });
    setEiDesc(''); setEiAmount(''); setShowExtraIncome(false);
  };

  const removeSpending = (id: string) => {
    const sp = (d.spendings || []).find(s => s.id === id);
    if (!sp) return;
    let updated: Partial<ExtendedData> = { spendings: (d.spendings || []).filter(s => s.id !== id) };
    if (sp.category?.includes('форс-мажор')) {
      const desc = sp.description;
      const m1 = desc.match(/из подушки ([\d\s]+) ₽/);
      const m2 = desc.match(/из мечты ([\d\s]+) ₽/);
      if (m1) updated.safetyFund = safetyFund + parseInt(m1[1].replace(/\s/g, ''));
      if (m2) updated.saved = d.saved + parseInt(m2[1].replace(/\s/g, ''));
    } else if (sp.category === 'доп.доход') {
      const desc = sp.description;
      const m1 = desc.match(/мечта: \+([\d\s]+) ₽/);
      const m2 = desc.match(/подушка: \+([\d\s]+) ₽/);
      const m3 = desc.match(/бюджет: \+([\d\s]+) ₽/);
      if (m1) updated.saved = d.saved - parseInt(m1[1].replace(/\s/g, ''));
      if (m2) updated.safetyFund = safetyFund - parseInt(m2[1].replace(/\s/g, ''));
      if (m3) updated.salary = d.salary - parseInt(m3[1].replace(/\s/g, ''));
    }
    update(updated);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      <div className="text-sm text-[#848E9C]">Привет, <span className="text-[#EAECEF] font-bold">{d.name}</span>!</div>

      {/* Мечта */}
      <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[#848E9C] text-xs uppercase tracking-wider">{d.goal.name}</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#F0B90B]">{d.saved.toLocaleString('ru-RU')} ₽</span>
              <span className="text-[#848E9C] text-sm">/ {d.goal.amount.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#0ECB81]">{progressPercent.toFixed(1)}%</div>
            <div className="text-[#848E9C] text-xs">готово</div>
          </div>
        </div>
        <div className="w-full bg-[#2B3139] rounded-full h-2 mt-3">
          <div className="bg-gradient-to-r from-[#F0B90B] to-[#F6465D] h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-[#848E9C]">
          <span>+{toGoal.toLocaleString('ru-RU')} ₽/мес</span>
          {monthsDelayed > 0 && <span className="text-[#F6465D]">⚠ Мечта отложена на {monthsDelayed} мес.</span>}
        </div>
      </div>

      {/* Подушка безопасности */}
      <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#848E9C] text-xs uppercase tracking-wider"><ShieldCheckIcon className="w-4 h-4" /> Подушка безопасности</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#EAECEF]">{safetyFund.toLocaleString('ru-RU')} ₽</span>
              <span className="text-[#848E9C] text-sm">/ {SAFETY_GOAL.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-[#0ECB81]">{safetyPercent.toFixed(0)}%</div>
            <div className="text-[#848E9C] text-xs">{safetyNeeded > 0 ? `+${toSafety.toLocaleString('ru-RU')} ₽/мес` : '✓ Полная'}</div>
          </div>
        </div>
        <div className="w-full bg-[#2B3139] rounded-full h-1.5 mt-3">
          <div className="bg-[#0ECB81] h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(safetyPercent, 100)}%` }} />
        </div>
      </div>

      {/* Зарплата */}
      <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#848E9C] text-xs uppercase tracking-wider">Зарплата</span>
          <button onClick={() => { setSalaryInput(d.salary); setEditSalary(!editSalary); }}>
            <PencilIcon className="w-4 h-4 text-[#848E9C] hover:text-[#F0B90B]" />
          </button>
        </div>
        {editSalary ? (
          <div className="flex gap-2">
            <input type="number" value={salaryInput} onChange={e => setSalaryInput(+e.target.value)}
              className="flex-1 bg-[#0B0E11] border border-[#2B3139] rounded-lg px-3 py-2 text-[#EAECEF] text-lg font-bold outline-none focus:border-[#F0B90B]" autoFocus />
            <button onClick={saveSalary} className="bg-[#0ECB81] text-black px-3 py-2 rounded-lg"><CheckIcon className="w-5 h-5" /></button>
          </div>
        ) : (
          <div className="text-2xl font-bold text-[#EAECEF]">{d.salary.toLocaleString('ru-RU')} ₽</div>
        )}
        <button onClick={handleSalary} disabled={freeMoney <= 0}
          className={`w-full mt-3 py-3.5 rounded-xl text-base font-bold transition-all ${freeMoney > 0 ? 'bg-[#F0B90B] text-black pulse-glow active:scale-95' : 'bg-[#2B3139] text-[#848E9C] cursor-not-allowed'}`}>
          💰 Зарплата пришла
          {freeMoney > 0 && <span className="block text-xs font-normal mt-0.5">Мечта +{toGoal.toLocaleString('ru-RU')} ₽ | Подушка +{toSafety.toLocaleString('ru-RU')} ₽ | Бюджет {monthBudget.toLocaleString('ru-RU')} ₽</span>}
        </button>
      </div>

      {/* Дневной лимит */}
      <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139]">
        <div className="text-[#848E9C] text-xs uppercase tracking-wider mb-1">Можно потратить сегодня</div>
        <div className={`text-3xl font-bold ${dailyLimit > 0 ? 'text-[#0ECB81]' : dailyLimit < 0 ? 'text-[#F6465D]' : 'text-[#848E9C]'}`}>
          {dailyLimit.toLocaleString('ru-RU')} ₽
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs text-[#848E9C]">
          <div className="flex justify-between"><span>Бюджет на 30 дн.</span><span className="text-[#0ECB81]">{monthBudget.toLocaleString('ru-RU')} ₽</span></div>
          <div className="flex justify-between"><span>Потрачено</span><span className="text-[#F6465D]">−{regularSpent.toLocaleString('ru-RU')} ₽</span></div>
          {fmSpent > 0 && <div className="flex justify-between"><span>Форс-мажор</span><span className="text-[#F6465D]">−{fmSpent.toLocaleString('ru-RU')} ₽</span></div>}
          <div className="flex justify-between"><span>Дней осталось</span><span>{daysLeft}</span></div>
        </div>
        {dailyLimit < 0 && (
          <div className="mt-3 bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-lg px-3 py-2 text-xs text-[#F6465D] flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 shrink-0" /> Бюджет исчерпан. Используй подушку или дождись зарплаты.
          </div>
        )}
      </div>

      {/* Уведомления */}
      <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#2B3139]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-[#848E9C]" />
            <span className="text-sm text-[#EAECEF]">Ежедневное напоминание</span>
          </div>
          {permission === 'granted' ? (
            scheduled ? (
              <span className="text-xs text-[#0ECB81]">✓ Включено</span>
            ) : (
              <button onClick={() => scheduleDailyReminder(dailyLimit)} className="text-xs bg-[#F0B90B] text-black px-3 py-1.5 rounded-lg font-bold">Включить</button>
            )
          ) : (
            <button onClick={requestPermission} className="text-xs bg-[#F0B90B] text-black px-3 py-1.5 rounded-lg font-bold">Разрешить уведомления</button>
          )}
        </div>
        {permission === 'granted' && (
          <button onClick={() => sendTestNotification(dailyLimit)} className="mt-2 text-xs text-[#848E9C] underline">
            Отправить тестовое уведомление
          </button>
        )}
      </div>

      {/* Кнопки: Форс-мажор и Доп. доход */}
      <div className="grid grid-cols-2 gap-3">
        {!showForceMajeure && (
          <button onClick={() => { setShowForceMajeure(true); setShowExtraIncome(false); }}
            className="bg-[#F6465D]/10 border border-[#F6465D]/30 rounded-xl py-3 text-[#F6465D] text-sm font-medium hover:bg-[#F6465D]/20 transition-colors flex items-center justify-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4" /> Форс-мажор
          </button>
        )}
        {!showExtraIncome && (
          <button onClick={() => { setShowExtraIncome(true); setShowForceMajeure(false); }}
            className="bg-[#0ECB81]/10 border border-[#0ECB81]/30 rounded-xl py-3 text-[#0ECB81] text-sm font-medium hover:bg-[#0ECB81]/20 transition-colors flex items-center justify-center gap-2">
            <PlusCircleIcon className="w-4 h-4" /> Доп. доход
          </button>
        )}
      </div>

      {/* Форма форс-мажора */}
      {showForceMajeure && (
        <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#F6465D]/50 space-y-3">
          <div className="flex items-center gap-2 text-[#F6465D] text-sm font-bold"><ExclamationTriangleIcon className="w-5 h-5" /> Форс-мажор</div>
          <input type="text" value={fmDesc} onChange={e => setFmDesc(e.target.value)} placeholder="На что? (лечение, ремонт...)" className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-3 py-2 text-sm text-[#EAECEF] outline-none focus:border-[#F6465D] placeholder-[#848E9C]" />
          <input type="number" value={fmAmount} onChange={e => setFmAmount(e.target.value)} placeholder="Сумма" className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-3 py-2 text-sm text-[#EAECEF] outline-none focus:border-[#F6465D] placeholder-[#848E9C]" />
          <p className="text-xs text-[#848E9C]">Сначала из подушки ({safetyFund.toLocaleString('ru-RU')} ₽), затем из мечты ({d.saved.toLocaleString('ru-RU')} ₽).</p>
          <div className="flex gap-2">
            <button onClick={() => setShowForceMajeure(false)} className="flex-1 py-2 rounded-lg border border-[#2B3139] text-[#848E9C] text-sm">Отмена</button>
            <button onClick={addForceMajeure} disabled={!fmDesc.trim() || !+fmAmount} className="flex-1 py-2 rounded-lg bg-[#F6465D] text-black text-sm font-bold disabled:opacity-40">Списать</button>
          </div>
        </div>
      )}

      {/* Форма доп. дохода */}
      {showExtraIncome && (
        <div className="bg-[#1E2329] rounded-2xl p-4 border border-[#0ECB81]/50 space-y-3">
          <div className="flex items-center gap-2 text-[#0ECB81] text-sm font-bold"><PlusCircleIcon className="w-5 h-5" /> Дополнительный доход</div>
          <input type="text" value={eiDesc} onChange={e => setEiDesc(e.target.value)} placeholder="Откуда? (премия, подработка...)" className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-3 py-2 text-sm text-[#EAECEF] outline-none focus:border-[#0ECB81] placeholder-[#848E9C]" />
          <input type="number" value={eiAmount} onChange={e => setEiAmount(e.target.value)} placeholder="Сумма" className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-3 py-2 text-sm text-[#EAECEF] outline-none focus:border-[#0ECB81] placeholder-[#848E9C]" />
          <div className="space-y-1 text-xs text-[#848E9C]">
            <div className="flex items-center gap-2"><span className="w-20">Мечта</span><input type="range" min={0} max={100} value={eiDream} onChange={e => { setEiDream(+e.target.value); setEiSafety(Math.min(100 - +e.target.value, eiSafety)); setEiBudget(100 - +e.target.value - Math.min(100 - +e.target.value, eiSafety)); }} className="flex-1 accent-[#F0B90B]" /><span className="w-8 text-right">{eiDream}%</span></div>
            <div className="flex items-center gap-2"><span className="w-20">Подушка</span><input type="range" min={0} max={100 - eiDream} value={eiSafety} onChange={e => { setEiSafety(+e.target.value); setEiBudget(100 - eiDream - +e.target.value); }} className="flex-1 accent-[#0ECB81]" /><span className="w-8 text-right">{eiSafety}%</span></div>
            <div className="flex items-center gap-2"><span className="w-20">Бюджет</span><input type="range" min={0} max={100 - eiDream - eiSafety} value={eiBudget} readOnly className="flex-1 accent-[#848E9C]" /><span className="w-8 text-right">{eiBudget}%</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowExtraIncome(false)} className="flex-1 py-2 rounded-lg border border-[#2B3139] text-[#848E9C] text-sm">Отмена</button>
            <button onClick={addExtraIncome} disabled={!eiDesc.trim() || !+eiAmount} className="flex-1 py-2 rounded-lg bg-[#0ECB81] text-black text-sm font-bold disabled:opacity-40">Добавить</button>
          </div>
        </div>
      )}

      {/* Обязательные расходы */}
      <div className="bg-[#1E2329] rounded-2xl border border-[#2B3139] overflow-hidden">
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 text-left">
          <span className="text-[#848E9C] text-xs uppercase tracking-wider">Обязательные расходы</span>
          <div className="flex items-center gap-2">
            <span className="text-[#F6465D] text-sm font-mono">−{totalExpenses.toLocaleString('ru-RU')} ₽</span>
            <span className={`text-[#848E9C] transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
          </div>
        </button>
        {expanded && (
          <div className="px-4 pb-4 space-y-2">
            {d.categories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between bg-[#2B3139] rounded-lg px-3 py-2 group">
                <span className="text-sm">{cat.icon} {cat.name}</span>
                <div className="flex items-center gap-1">
                  <input type="number" value={cat.amount} onChange={e => updateCategory(i, +e.target.value)} className="w-20 bg-transparent text-right text-sm text-[#EAECEF] outline-none border-b border-transparent focus:border-[#F0B90B] transition-colors" />
                  <span className="text-[#848E9C] text-xs">₽</span>
                  <button onClick={() => removeCategory(i)} className="text-[#848E9C] hover:text-[#F6465D] opacity-0 group-hover:opacity-100 transition-opacity ml-1">×</button>
                </div>
              </div>
            ))}
            <button onClick={addCategory} className="w-full border border-dashed border-[#2B3139] rounded-lg py-2 text-[#848E9C] text-sm hover:border-[#F0B90B] hover:text-[#F0B90B] transition-colors">+ Добавить категорию</button>
          </div>
        )}
      </div>

      {/* История трат */}
      <div className="bg-[#1E2329] rounded-2xl border border-[#2B3139] overflow-hidden">
        <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between p-4 text-left">
          <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-[#848E9C]" /><span className="text-[#848E9C] text-xs uppercase tracking-wider">История операций</span></div>
          <span className={`text-[#848E9C] transition-transform ${showHistory ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {showHistory && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex gap-2">
              <input type="text" value={newSpendingDesc} onChange={e => setNewSpendingDesc(e.target.value)} placeholder="На что потратил?" className="flex-1 bg-[#2B3139] rounded-lg px-3 py-2 text-sm text-[#EAECEF] outline-none focus:ring-1 focus:ring-[#F0B90B] placeholder-[#848E9C]" />
              <input type="number" value={newSpendingAmount} onChange={e => setNewSpendingAmount(e.target.value)} placeholder="Сумма" className="w-24 bg-[#2B3139] rounded-lg px-3 py-2 text-sm text-[#EAECEF] outline-none focus:ring-1 focus:ring-[#F0B90B] placeholder-[#848E9C]" />
              <button onClick={addSpending} disabled={!newSpendingDesc.trim() || !+newSpendingAmount} className="bg-[#F0B90B] text-black rounded-lg px-3 py-2 font-bold text-sm disabled:opacity-40 active:scale-95 transition-all">+</button>
            </div>
            {periodSpendings.length === 0 ? (
              <div className="text-center text-[#848E9C] text-xs py-4">Операций пока нет</div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {periodSpendings.sort((a, b) => b.date.localeCompare(a.date)).map(sp => (
                  <div key={sp.id} className={`flex items-center justify-between rounded-lg px-3 py-2 group ${
                    sp.category?.includes('форс-мажор') ? 'bg-[#F6465D]/10 border border-[#F6465D]/30' :
                    sp.category === 'доп.доход' ? 'bg-[#0ECB81]/10 border border-[#0ECB81]/30' : 'bg-[#2B3139]'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-[#848E9C] shrink-0">{formatDate(sp.date)}</span>
                      <span className="text-sm text-[#EAECEF] truncate">{sp.description}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-mono ${sp.category === 'доп.доход' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {sp.category === 'доп.доход' ? '+' : '−'}{sp.amount.toLocaleString('ru-RU')} ₽
                      </span>
                      <button onClick={() => removeSpending(sp.id)} className="text-[#848E9C] hover:text-[#EAECEF] opacity-0 group-hover:opacity-100 transition-opacity">
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}