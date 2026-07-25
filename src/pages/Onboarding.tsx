import { useState } from 'react';
import { ArrowRightIcon, ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { UserData, Category } from '../types';

interface Props {
  onFinish: (data: UserData) => void;
}

export default function Onboarding({ onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<Partial<UserData>>({});

  const next = (data: Partial<UserData>) => {
    const merged = { ...info, ...data };
    setInfo(merged);
    if (step < 3) {
      setStep(step + 1);
    } else {
      onFinish({
        name: merged.name || 'Пользователь',
        salary: merged.salary || 0,
        goal: merged.goal || { name: 'Мечта', amount: 1000000 },
        categories: merged.categories || [],
        percentToGoal: merged.percentToGoal || 30,
        saved: 0,
        spendings: [],
        salaryHistory: [],
      });
    }
  };

  const back = () => { if (step > 0) setStep(step - 1); };

  return (
    <div className="min-h-screen min-h-dvh bg-[#0B0E11]">
      {step === 0 && <Step1 onNext={next} />}
      {step === 1 && <Step2 onNext={next} onBack={back} />}
      {step === 2 && <Step3 onNext={next} onBack={back} />}
      {step === 3 && <Step4 onFinish={next} onBack={back} />}
    </div>
  );
}

// ─── Шаг 1: Имя и мечта ─────────────────────────────────
function Step1({ onNext }: { onNext: (d: Partial<UserData>) => void }) {
  const [name, setName] = useState('');
  const [dreamName, setDreamName] = useState('');
  const [dreamAmount, setDreamAmount] = useState('');
  const can = name.trim() && dreamName.trim() && +dreamAmount > 0;

  return (
    <div className="max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <ProgressDots active={0} />
      <h1 className="text-2xl font-bold text-[#EAECEF] mb-2">Давай познакомимся 👋</h1>
      <p className="text-[#848E9C] text-sm mb-8">Расскажи о себе и своей мечте.</p>
      <div className="space-y-5 flex-1">
        <Input label="Как тебя зовут?" value={name} onChange={setName} placeholder="Алексей" autoFocus />
        <Input label="На что копишь?" value={dreamName} onChange={setDreamName} placeholder="Бизнес, машина..." />
        <Input label="Сколько нужно?" value={dreamAmount} onChange={setDreamAmount} placeholder="1 000 000" type="number" suffix="₽" />
      </div>
      <Btn primary disabled={!can} onClick={() => onNext({ name, goal: { name: dreamName, amount: +dreamAmount } })}>
        Дальше <ArrowRightIcon className="w-4 h-4 inline ml-1" />
      </Btn>
    </div>
  );
}

// ─── Шаг 2: Зарплата ────────────────────────────────────
function Step2({ onNext, onBack }: { onNext: (d: Partial<UserData>) => void; onBack: () => void }) {
  const [salary, setSalary] = useState('');
  const can = +salary > 0;
  return (
    <div className="max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <ProgressDots active={1} />
      <h1 className="text-2xl font-bold text-[#EAECEF] mb-2">Твой доход 💰</h1>
      <p className="text-[#848E9C] text-sm mb-8">Сколько зарабатываешь в месяц?</p>
      <div className="flex-1">
        <Input label="Ежемесячный доход" value={salary} onChange={setSalary} placeholder="85 000" type="number" suffix="₽" autoFocus big />
        <div className="mt-4 flex gap-2 flex-wrap">
          {[50000, 85000, 120000, 200000].map((s) => (
            <button key={s} onClick={() => setSalary(String(s))}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${+salary === s ? 'border-[#F0B90B] bg-[#F0B90B]/10 text-[#F0B90B]' : 'border-[#2B3139] text-[#848E9C] hover:border-[#848E9C]'}`}>
              {s.toLocaleString('ru-RU')} ₽
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <BackBtn onClick={onBack} />
        <Btn primary disabled={!can} onClick={() => onNext({ salary: +salary })}>
          Дальше <ArrowRightIcon className="w-4 h-4 inline ml-1" />
        </Btn>
      </div>
    </div>
  );
}

// ─── Шаг 3: Расходы ─────────────────────────────────────
function Step3({ onNext, onBack }: { onNext: (d: Partial<UserData>) => void; onBack: () => void }) {
  const defaults: Category[] = [
    { name: 'Аренда', amount: 0, icon: '🏠' },
    { name: 'Коммуналка', amount: 0, icon: '⚡' },
    { name: 'Продукты', amount: 0, icon: '🛒' },
    { name: 'Транспорт', amount: 0, icon: '🚌' },
    { name: 'Подписки', amount: 0, icon: '📱' },
    { name: 'Телефон', amount: 0, icon: '📞' },
  ];
  const [cats, setCats] = useState<Category[]>(defaults);
  const [newName, setNewName] = useState('');
  const [newAmt, setNewAmt] = useState('');
  const total = cats.reduce((s, c) => s + c.amount, 0);

  const upd = (i: number, v: number) => setCats(c => c.map((c, idx) => idx === i ? { ...c, amount: v } : c));
  const del = (i: number) => setCats(c => c.filter((_, idx) => idx !== i));
  const add = () => {
    if (newName.trim() && +newAmt >= 0) {
      setCats([...cats, { name: newName.trim(), amount: +newAmt, icon: '📌' }]);
      setNewName(''); setNewAmt('');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <ProgressDots active={2} />
      <h1 className="text-2xl font-bold text-[#EAECEF] mb-2">Твои расходы 📋</h1>
      <p className="text-[#848E9C] text-sm mb-2">Добавь обязательные ежемесячные траты.</p>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-[#848E9C] text-xs">Итого:</span>
        <span className={`font-mono font-bold ${total > 0 ? 'text-[#F6465D]' : 'text-[#848E9C]'}`}>−{total.toLocaleString('ru-RU')} ₽</span>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[40vh]">
        {cats.map((c, i) => (
          <div key={i} className="flex items-center gap-2 bg-[#1E2329] rounded-xl px-3 py-2.5 border border-[#2B3139] group">
            <span className="text-lg">{c.icon}</span>
            <span className="text-sm text-[#EAECEF] flex-1 truncate">{c.name}</span>
            <input type="number" value={c.amount || ''} onChange={e => upd(i, +e.target.value)} placeholder="0" className="w-20 bg-transparent text-right text-sm text-[#EAECEF] outline-none border-b border-transparent focus:border-[#F0B90B]" />
            <span className="text-[#848E9C] text-xs">₽</span>
            <button onClick={() => del(i)} className="text-[#848E9C] hover:text-[#F6465D] opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Название" className="flex-1 bg-[#1E2329] border border-[#2B3139] rounded-lg px-3 py-2 text-sm text-[#EAECEF] outline-none focus:border-[#F0B90B] placeholder-[#848E9C]" />
        <input type="number" value={newAmt} onChange={e => setNewAmt(e.target.value)} placeholder="Сумма" className="w-24 bg-[#1E2329] border border-[#2B3139] rounded-lg px-3 py-2 text-sm text-[#EAECEF] outline-none focus:border-[#F0B90B] placeholder-[#848E9C]" />
        <button onClick={add} disabled={!newName.trim()} className="bg-[#2B3139] hover:bg-[#3B434D] disabled:opacity-40 rounded-lg px-3 py-2"><PlusIcon className="w-4 h-4 text-[#EAECEF]" /></button>
      </div>
      <div className="flex gap-3 mt-6">
        <BackBtn onClick={onBack} />
        <Btn primary onClick={() => onNext({ categories: cats })}>Дальше <ArrowRightIcon className="w-4 h-4 inline ml-1" /></Btn>
      </div>
    </div>
  );
}

// ─── Шаг 4: Процент ─────────────────────────────────────
function Step4({ onFinish, onBack }: { onFinish: (d: Partial<UserData>) => void; onBack: () => void }) {
  const [percent, setPercent] = useState(30);
  return (
    <div className="max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <ProgressDots active={3} />
      <h1 className="text-2xl font-bold text-[#EAECEF] mb-2">Последний шаг 🎯</h1>
      <p className="text-[#848E9C] text-sm mb-8">Какой процент от свободных денег откладывать в мечту?</p>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-7xl font-bold text-[#F0B90B] mb-2">{percent}%</div>
        <p className="text-[#848E9C] text-sm mb-8">от свободных денег</p>
        <input type="range" min={5} max={90} step={5} value={percent} onChange={e => setPercent(+e.target.value)} className="w-full h-2 bg-[#2B3139] rounded-full accent-[#F0B90B]" />
        <div className="flex justify-between w-full mt-2 text-xs text-[#848E9C]"><span>5%</span><span>50%</span><span>90%</span></div>
        <div className="flex gap-2 mt-8">
          {[10, 20, 30, 50].map(p => (
            <button key={p} onClick={() => setPercent(p)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border ${percent === p ? 'border-[#F0B90B] bg-[#F0B90B]/10 text-[#F0B90B]' : 'border-[#2B3139] text-[#848E9C]'}`}>{p}%</button>
          ))}
        </div>
        <p className="text-[#848E9C] text-xs mt-8">Можно изменить в настройках</p>
      </div>
      <div className="flex gap-3 mt-6">
        <BackBtn onClick={onBack} />
        <Btn primary onClick={() => onFinish({ percentToGoal: percent })}>Начать копить! 🚀</Btn>
      </div>
    </div>
  );
}

// ─── Общие компоненты ───────────────────────────────────
function ProgressDots({ active }: { active: number }) {
  return (
    <div className="flex gap-1 mb-8">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className={`h-1.5 rounded-full flex-1 ${i <= active ? (i < active ? 'bg-[#0ECB81]' : 'bg-[#F0B90B]') : 'bg-[#2B3139]'}`} />
      ))}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text', suffix, autoFocus, big }: any) {
  return (
    <div>
      <label className="text-sm text-[#848E9C] block mb-2">{label}</label>
      <div className="relative">
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoFocus={autoFocus}
          className={`w-full bg-[#1E2329] border border-[#2B3139] rounded-xl px-4 py-3.5 text-[#EAECEF] outline-none focus:border-[#F0B90B] placeholder-[#848E9C] transition-colors ${big ? 'text-2xl font-bold' : 'text-base'}`}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#848E9C]">{suffix}</span>}
      </div>
    </div>
  );
}

function Btn({ primary, disabled, onClick, children }: any) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 py-4 rounded-xl text-base font-bold transition-all ${
        primary && !disabled ? 'bg-[#F0B90B] text-black active:scale-95' : 'bg-[#2B3139] text-[#848E9C] cursor-not-allowed'
      }`}
    >
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-4 rounded-xl border border-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]">
      <ArrowLeftIcon className="w-5 h-5" />
    </button>
  );
}