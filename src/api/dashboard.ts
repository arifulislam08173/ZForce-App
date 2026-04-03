import api from "./api";

export type FieldDashboardStats = {
  totalCustomers: number;
  totalVisits: number;
  totalOrders: number;
  totalCollections: number;
  totalExpenses: number;
};

export async function fetchFieldDashboardStats(): Promise<FieldDashboardStats> {
  const normalize = (d: any): FieldDashboardStats => ({
    totalCustomers: Number(d?.totalCustomers ?? 0),
    totalVisits: Number(d?.totalVisits ?? d?.totalVisitsToday ?? 0),
    totalOrders: Number(d?.totalOrders ?? d?.totalOrdersToday ?? 0),
    totalCollections: Number(d?.totalCollections ?? d?.totalCollectionsToday ?? 0),
    totalExpenses: Number(d?.totalExpenses ?? 0),
  });

  const res = await api.get("/dashboard/stats");
  return normalize(res.data);
}