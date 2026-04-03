import api from "./api";

export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ExpenseRow = {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description?: string | null;
  receiptUrl?: string | null;
  incurredAt?: string | null;
  status?: ExpenseStatus | string | null;
  createdAt?: string | null;
};

export type ExpensesResponse = {
  data: ExpenseRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export async function fetchMyExpenses(params: {
  page?: number;
  limit?: number;
  fromDate?: string; 
  toDate?: string;   
  status?: string;
}) {
  const res = await api.get<ExpensesResponse>("/expenses/my", { params });
  return res.data;
}

export async function createExpense(payload: {
  category: string;
  amount: number;
  description?: string | null;
  receiptUrl?: string | null;
  incurredAt?: string; 
}) {
  const res = await api.post("/expenses", payload);
  return res.data;
}