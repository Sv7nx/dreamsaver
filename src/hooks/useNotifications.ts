import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [scheduled, setScheduled] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  };

  const scheduleDailyReminder = (limit: number, hour = 10) => {
    if (permission !== 'granted') return;

    const now = new Date();
    const trigger = new Date();
    trigger.setHours(hour, 0, 0, 0);
    if (trigger <= now) trigger.setDate(trigger.getDate() + 1);

    const timeout = trigger.getTime() - now.getTime();

    setTimeout(() => {
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('DreamSaver 💰', {
            body: `Сегодня можно потратить: ${limit.toLocaleString('ru-RU')} ₽`,
            icon: '/icons/icon-192.png',
            tag: 'daily-limit',
          });
        });
        scheduleDailyReminder(limit, hour);
      }
    }, timeout);

    setScheduled(true);
  };

  const sendTestNotification = async (limit: number) => {
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification('DreamSaver 💰', {
          body: `Сегодня можно потратить: ${limit.toLocaleString('ru-RU')} ₽`,
          icon: '/icons/icon-192.png',
          tag: 'daily-limit',
        });
      });
    }
  };

  return { permission, scheduled, requestPermission, scheduleDailyReminder, sendTestNotification };
}