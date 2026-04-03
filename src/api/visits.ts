import api from "./api";

export type VisitStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "MISSED";

export type VisitRow = {
  id: string;
  userId: string;
  customerId: string;
  routeId?: string | null;

  plannedAt?: string | null;
  notes?: string | null;

  status?: VisitStatus | string | null;

  checkInAt?: string | null;
  checkInLat?: number | null;
  checkInLng?: number | null;

  checkOutAt?: string | null;
  checkOutLat?: number | null;
  checkOutLng?: number | null;
};

export type VisitsResponse = {
  data: VisitRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export async function fetchMyVisits(params: {
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;   
  status?: string;
}) {
  const res = await api.get<VisitsResponse>("/visits/my", { params });
  return res.data;
}

export async function checkInVisit(visitId: string, payload: { latitude: number; longitude: number }) {
  const res = await api.post(`/visits/${visitId}/check-in`, payload);
  return res.data;
}

export async function checkOutVisit(
  visitId: string,
  payload: { latitude: number; longitude: number; notes?: string | null }
) {
  const res = await api.post(`/visits/${visitId}/check-out`, payload);
  return res.data;
}

export async function planVisit(payload: {
  customerId: string;
  plannedAt: string; 
  notes?: string | null;
}) {
  const res = await api.post("/visits", payload);
  return res.data;
}