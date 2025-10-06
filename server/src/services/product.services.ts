import { supabase } from "../config/db";

type Product = {
  id: number;
  title: string;
  description?: string | null;
  price?: number | null;
  price_cents?: number | null;
  inventory_count?: number | null;
  slug?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function listProducts(page = 1, limit = 20, filters: Record<string, any> = {}) {
  const pageNum = Math.max(+page || 1, 1);
  const perPage = Math.min(+limit || 20, 100);
  const from = (pageNum - 1) * perPage;
  const to = from + perPage - 1;

  // base query
  let builder: any = supabase.from('products').select('*', { count: 'exact' }).range(from, to);

  // apply simple equality filters
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null) builder = builder.eq(k, v);
  });

  const { data, error, count } = await builder;
  if (error) throw error;
  const total = count ?? (data ? data.length : 0);
  return { items: data as Product[], meta: { page: pageNum, limit: perPage, total, totalPages: Math.ceil(total / perPage) } };
}

export async function getProductById(id: number) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function createProduct(payload: Partial<Product>) {
  const { data, error } = await supabase.from('products').insert([payload]).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: number, updates: Partial<Product>) {
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Product;
}

export async function patchInventory(id: number, inventory_count: number) {
  const { data, error } = await supabase.from('products').update({ inventory_count }).eq('id', id).select().single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: number) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export default { listProducts, getProductById, getProductBySlug, createProduct, updateProduct, patchInventory, deleteProduct };
