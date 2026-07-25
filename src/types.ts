export interface Category {
  name: string;
  amount: number;
  icon: string;
}

export interface Goal {
  name: string;
  amount: number;
}

export interface Spending {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
}

export interface UserData {
  name: string;
  salary: number;
  goal: Goal;
  categories: Category[];
  percentToGoal: number;
  saved: number;
  spendings: Spending[];
  salaryHistory: { date: string; amount: number }[];
  savingsSnapshots?: { month: string; saved: number }[];
}