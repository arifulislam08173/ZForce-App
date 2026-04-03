import api from "./api";

export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export type OrderItemInput = {
  productId: string;   
  quantity: number;
  price: number;       
};

export type CreateOrderPayload = {
  order: {
    customerId: string; 
    date?: string;      
    status?: OrderStatus;
    notes?: string;
  };
  items: OrderItemInput[];
};

export type OrdersListResponse = {
  data: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};


export type OpenOrderForCollection = {
  id: string;
  orderNumber?: string | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
  dueAmount?: number | null;
  paymentStatus?: string | null;
  customerId?: string | null;
};


export async function createOrder(payload: CreateOrderPayload) {
  const res = await api.post("/orders", payload);
  return res.data;
}

export async function fetchMyOrders(params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: OrderStatus | "";
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const res = await api.get<OrdersListResponse>("/orders", { params });
  return res.data;
}

export async function fetchOrderDetails(orderId: string) {
  const res = await api.get(`/orders/${orderId}`);
  return res.data;
}


export async function fetchOpenOrdersForCollection(customerId: string) {
  const res = await api.get("/orders/open-for-collection", { params: { customerId } });
  return (res.data?.data || []) as OpenOrderForCollection[];
}