import { useState, useRef, useEffect } from 'react';
import { SparklesIcon, PaperAirplaneIcon, UserCircleIcon, BoltIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import type { UserData } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  data: UserData;
}

// ─── Очистка маркдауна ─────────────────────────────────
function cleanMarkdown(text: string): string {
  return text
    .replace(/^###?\s+(.+)$/gm, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Офлайн-советник ───────────────────────────────────
function generateLocalAdvice(text: string, data: UserData): string {
  const totalExpenses = data.categories.reduce((s, c) => s + c.amount, 0);
  const freeMoney = data.salary - totalExpenses;
  const toGoal = Math.round(freeMoney * (data.percentToGoal / 100));
  const progress = (data.saved / data.goal.amount) * 100;
  const monthsLeft = toGoal > 0 ? Math.ceil((data.goal.amount - data.saved) / toGoal) : 999;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const spentThisMonth = (data.spendings || []).filter(s => s.date.startsWith(thisMonth)).reduce((sum, s) => sum + s.amount, 0);
  const daysLeft = Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1);
  const dailyLimit = Math.round(Math.max(0, freeMoney - toGoal - spentThisMonth) / daysLeft);

  const q = text.toLowerCase();

  if (q.includes('экономи') || q.includes('сэкономить') || q.includes('сократить')) {
    const biggest = [...data.categories].sort((a, b) => b.amount - a.amount)[0];
    const subs = data.categories.find(c => c.name.toLowerCase().includes('подписк'));
    let tips = '💡 Советы по экономии:\n\n';
    if (subs && subs.amount > 300) tips += `📱 Подписки: ${subs.amount.toLocaleString('ru-RU')} ₽/мес. Проверь — может, половиной не пользуешься?\n\n`;
    if (biggest && biggest.amount > 0) tips += `🔍 Крупнейшая трата: «${biggest.name}» — ${biggest.amount.toLocaleString('ru-RU')} ₽. Можно ли урезать на 10%?\n\n`;
    if (spentThisMonth > 0) tips += `⚠️ Потрачено в этом месяце: ${spentThisMonth.toLocaleString('ru-RU')} ₽. Дневной лимит: ${dailyLimit.toLocaleString('ru-RU')} ₽.\n\n`;
    tips += `🎯 Правило: откладывай ${toGoal.toLocaleString('ru-RU')} ₽ сразу после зарплаты. «Заплати себе» — это работает.`;
    return tips;
  }

  if (q.includes('заработать') || q.includes('заработок') || q.includes('доход') || q.includes('подработк')) {
    const gap = data.goal.amount - data.saved;
    return `💸 Идеи доп. заработка:\n\n🎯 До мечты: ${gap.toLocaleString('ru-RU')} ₽ (~${monthsLeft} мес.)\n\n` +
      `🛵 Доставка/такси — +15-40 тыс./мес вечерами\n` +
      `💻 Фриланс — Kwork, fl.ru (дизайн, тексты, нейросети)\n` +
      `📦 Перепродажа на Авито/Юле\n` +
      `🧠 Репетиторство / консультации\n` +
      `🎨 Хобби → доход (handmade, фото, монтаж)\n\n` +
      `+10 000 ₽/мес = цель на ${Math.ceil(gap / (toGoal + 10000))} мес. быстрее!`;
  }

  if (q.includes('быстрее') || q.includes('ускорить') || q.includes('накопить')) {
    const gap = data.goal.amount - data.saved;
    return `🚀 Ускорение к мечте:\n\n` +
      `Сейчас: +${toGoal.toLocaleString('ru-RU')} ₽/мес → ${monthsLeft} мес.\n` +
      `С +10 000: → ${Math.ceil(gap / (toGoal + 10000))} мес.\n` +
      `С +20 000: → ${Math.ceil(gap / (toGoal + 20000))} мес.\n\n` +
      `Вывод: даже небольшая подработка сокращает срок на месяцы.`;
  }

  if (q.includes('лайфхак') || q.includes('совет') || q.includes('секрет')) {
    return `🧠 Лайфхаки:\n\n` +
      `⏳ Правило 24 часов — жди сутки перед покупкой >3000₽\n` +
      `🛒 В магазин сытым и со списком — экономия ~15%\n` +
      `💳 Отдельная карта для мечты — не трогай!\n` +
      `🔔 Округление трат вверх — разницу в копилку\n` +
      `🖼 Фото мечты на заставку телефона\n` +
      `🚫 Челлендж: 30 дней без импульс-покупок`;
  }

  return `💬 Я твой офлайн-помощник. Твой профиль:\n\n` +
    `🎯 ${data.goal.name}: ${data.saved.toLocaleString('ru-RU')} / ${data.goal.amount.toLocaleString('ru-RU')} ₽ (${progress.toFixed(1)}%)\n` +
    `💵 Зарплата: ${data.salary.toLocaleString('ru-RU')} ₽\n` +
    `📈 В мечту: +${toGoal.toLocaleString('ru-RU')} ₽/мес\n` +
    `💳 Дневной лимит: ${dailyLimit.toLocaleString('ru-RU')} ₽\n` +
    `⏳ До цели: ~${monthsLeft} мес.\n\n` +
    `Спроси: «Как сэкономить?», «Где заработать?», «Как быстрее?», «Дай лайфхак»`;
}

// ─── Онлайн-запрос (DeepSeek) ──────────────────────────
async function fetchOnlineAI(
  text: string,
  data: UserData
): Promise<string> {
  const totalExpenses = data.categories.reduce((s, c) => s + c.amount, 0);
  const freeMoney = data.salary - totalExpenses;
  const toGoal = Math.round(freeMoney * (data.percentToGoal / 100));
  const progress = ((data.saved / data.goal.amount) * 100).toFixed(1);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const spentThisMonth = (data.spendings || []).filter(s => s.date.startsWith(thisMonth)).reduce((sum, s) => sum + s.amount, 0);

  const systemPrompt = `Ты финансовый советник DreamSaver. Отвечай на чистом русском языке, с эмодзи, с конкретными цифрами. НЕ используй маркдаун. Данные:
Имя: ${data.name}
Мечта: ${data.goal.name}, цель: ${data.goal.amount} рублей
Накоплено: ${data.saved} рублей (${progress}%)
Зарплата: ${data.salary} рублей в месяц
Расходы: ${totalExpenses} рублей в месяц
В мечту: ${toGoal} рублей в месяц
Потрачено за месяц: ${spentThisMonth} рублей`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text },
  ];

  const isProduction = window.location.hostname !== 'localhost';

  if (isProduction) {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) throw new Error(`Ошибка ${res.status}`);

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content?.trim() || '';
    if (reply.length < 20) throw new Error('Пустой ответ от AI');
    return cleanMarkdown(reply);
  } else {
    const deepseekKey = import.meta.env.VITE_DEEPSEEK_KEY;

    if (!deepseekKey || !deepseekKey.startsWith('sk-')) {
      throw new Error('Нет ключа DeepSeek в .env.local');
    }

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: 600,
        temperature: 0.8,
      }),
    });

    if (!res.ok) throw new Error(`Ошибка ${res.status}`);

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content?.trim() || '';
    if (reply.length < 20) throw new Error('Пустой ответ от AI');
    return cleanMarkdown(reply);
  }
}

// ─── Компонент ──────────────────────────────────────────
export default function AIHelper({ data }: Props) {
  const [mode, setMode] = useState<'offline' | 'online'>('offline');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Привет, ${data.name}!\n\nЯ гибридный помощник:\nОфлайн — советы без интернета\nОнлайн — DeepSeek AI\n\nПереключай режим вверху и спрашивай!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    if (mode === 'offline') {
      setTimeout(() => {
        const reply = generateLocalAdvice(text, data);
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        setLoading(false);
        inputRef.current?.focus();
      }, 500 + Math.random() * 700);
    } else {
      try {
        const reply = await fetchOnlineAI(text, data);
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      } catch (err: any) {
        const fallback = generateLocalAdvice(text, data);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Онлайн AI недоступен (${err.message}).\n\nВот офлайн-совет:\n\n${fallback}`
        }]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    }
  };

  const quickQuestions = [
    'Как сэкономить?',
    'Где заработать?',
    'Как быстрее накопить?',
    'Дай лайфхак',
  ];

  return (
    <div className="max-w-md mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <h1 className="text-xl font-bold text-[#EAECEF]">AI-Помощник</h1>
        <div className="flex bg-[#1E2329] rounded-lg p-0.5 gap-0.5">
          <button onClick={() => setMode('offline')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === 'offline' ? 'bg-[#0ECB81] text-black' : 'text-[#848E9C] hover:text-[#EAECEF]'
            }`}>
            <BoltIcon className="w-3.5 h-3.5" /> Офлайн
          </button>
          <button onClick={() => setMode('online')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === 'online' ? 'bg-[#F0B90B] text-black' : 'text-[#848E9C] hover:text-[#EAECEF]'
            }`}>
            <GlobeAltIcon className="w-3.5 h-3.5" /> Онлайн
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                mode === 'offline' ? 'bg-[#0ECB81]' : 'bg-[#F0B90B]'
              }`}>
                <SparklesIcon className="w-4 h-4 text-black" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[#F0B90B] text-black rounded-br-md'
                : 'bg-[#1E2329] text-[#EAECEF] rounded-bl-md border border-[#2B3139]'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 bg-[#2B3139] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <UserCircleIcon className="w-4 h-4 text-[#848E9C]" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              mode === 'offline' ? 'bg-[#0ECB81]' : 'bg-[#F0B90B]'
            }`}>
              <SparklesIcon className="w-4 h-4 text-black" />
            </div>
            <div className="bg-[#1E2329] rounded-xl rounded-bl-md px-4 py-3 border border-[#2B3139]">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#F0B90B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#F0B90B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#F0B90B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {quickQuestions.map((q, i) => (
            <button key={i} onClick={() => { setInput(q); inputRef.current?.focus(); }}
              className="text-xs bg-[#1E2329] border border-[#2B3139] rounded-full px-3 py-1.5 text-[#848E9C] hover:text-[#EAECEF] hover:border-[#F0B90B] transition-colors">{q}</button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        className="px-4 py-3 border-t border-[#2B3139] bg-[#0B0E11] shrink-0">
        <div className="flex gap-2">
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'offline' ? 'Офлайн-совет...' : 'Спроси AI...'}
            className="flex-1 bg-[#1E2329] border border-[#2B3139] rounded-xl px-4 py-3 text-sm text-[#EAECEF] placeholder-[#848E9C] outline-none focus:border-[#F0B90B] transition-colors" />
          <button type="submit" disabled={!input.trim() || loading}
            className={`rounded-xl px-4 py-3 font-bold disabled:opacity-40 active:scale-95 transition-all ${
              mode === 'offline' ? 'bg-[#0ECB81] text-black' : 'bg-[#F0B90B] text-black'
            }`}>
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}