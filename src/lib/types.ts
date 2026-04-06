export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  user_id: string;
}

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category_id?: string;
  category?: Category;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  // join fields
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface GroupInvite {
  id: string;
  group_id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface SplitExpense {
  id: string;
  group_id: string;
  title: string;
  total_amount: number;
  paid_by: string;
  date: string;
  notes?: string;
  created_by: string;
  created_at: string;
  // relations
  splits?: ExpenseSplit[];
  payer?: GroupMember;
}

export interface ExpenseSplit {
  id: string;
  split_expense_id: string;
  user_id: string;
  owed_amount: number;
  created_at: string;
}

export interface Settlement {
  id: string;
  group_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  date: string;
  created_at: string;
}
