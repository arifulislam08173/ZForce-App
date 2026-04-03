import api from "./api";

export type DropdownCustomer = {
  id: string;
  name: string;
  phone?: string | null;
};

export type DropdownProduct = {
  id: string;
  name: string;
  sku?: string | null;
  price?: number | string | null;
  stock?: number | string | null;
};

export async function fetchCustomersDropdown(): Promise<DropdownCustomer[]> {
  const res = await api.get("/customers/dropdown");
  return (res.data || []) as DropdownCustomer[];
}

export async function fetchProductsDropdown(): Promise<DropdownProduct[]> {
  const res = await api.get("/products/dropdown");
  return (res.data || []) as DropdownProduct[];
}