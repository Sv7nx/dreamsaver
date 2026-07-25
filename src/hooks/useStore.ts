import { useState, useEffect } from 'react';
import type { UserData } from '../types';
import { loadData, saveData } from '../utils';

export function useStore() {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const saved = loadData();
    if (saved) setUserData(saved);
  }, []);

  const updateData = (partial: Partial<UserData>) => {
    setUserData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      saveData(updated);
      return updated;
    });
  };

  const resetData = () => {
    localStorage.removeItem('dreamsaver_data');
    setUserData(null);
    window.location.reload();
  };

  return { userData, setUserData, updateData, resetData };
}