import {supabase} from "../config/db.ts"

type Order = {
 id?: number;
 user_id: string;
 status: string;
 total: number;
 created_at?: string;
};

type OrderItem = {
 id?: number;
 order_id: number;
 product_id: number;
 quantity: number;
 price: number;
 created_at?: string;
};

async function isValidUser(user_id: string) {
 const { data, error } = await supabase
 .from('users')
 .select('id')
 .eq('id', user_id)
 .single();
 if (error || !data) return false;
 return true;
}

// Create a new order
export async function createOrder(order: Omit<Order, 'id' | 'created_at'>, items: Omit<OrderItem, 'id' | 'created_at'>[]) {
 if (!(await isValidUser(order.user_id))) throw new Error('Invalid user');
 const { data: orderData, error: orderError } = await supabase
 .from('orders')
 .insert([order])
 .select()
 .single();

 if (orderError) throw orderError;

 const orderId = orderData.id;
 const itemsWithOrderId = items.map(item => ({ ...item, order_id: orderId }));

 const { error: itemsError } = await supabase
 .from('order_items')
 .insert(itemsWithOrderId);

 if (itemsError) throw itemsError;

 return orderData;
}

// Get all orders (optionally by user)
export async function getAllOrders(user_id?: string) {
	if (user_id && !(await isValidUser(user_id))) throw new Error('Invalid user');
	// Postgrest builder typing can be narrow; use any for conditional chaining
	let query: any = supabase.from('orders').select('*, order_items(*)');
	if (user_id) query = query.eq('user_id', user_id);

	const { data, error } = await query;
	if (error) throw error;
	return data;
}

// Get a single order by ID
export async function getOrderById(orderId: number, user_id?: string) {
	if (user_id && !(await isValidUser(user_id))) throw new Error('Invalid user');
	let query: any = supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single();
	if (user_id) query = query.eq('user_id', user_id);

	const { data, error } = await query;
	if (error) throw error;
	return data;
}

// Edit an existing order item
export async function editOrderItem(orderItemId: number, updates: Partial<Omit<OrderItem, 'id' | 'order_id' | 'created_at'>>, user_id: string) {
 if (!(await isValidUser(user_id))) throw new Error('Invalid user');
 // Optionally, check if the order item belongs to the user
 const { data: item, error: itemError } = await supabase
 .from('order_items')
 .select('order_id')
 .eq('id', orderItemId)
 .single();
 if (itemError || !item) throw new Error('Order item not found');

 const { data: order, error: orderError } = await supabase
 .from('orders')
 .select('user_id')
 .eq('id', item.order_id)
 .single();
 if (orderError || !order || order.user_id !== user_id) throw new Error('Unauthorized');

 const { data, error } = await supabase
 .from('order_items')
 .update(updates)
 .eq('id', orderItemId)
 .select()
 .single();

 if (error) throw error;
 return data;
}

// Delete an order and its items
export async function deleteOrder(orderId: number, user_id: string) {
 if (!(await isValidUser(user_id))) throw new Error('Invalid user');
 // Check if order belongs to user
 const { data: order, error: orderError } = await supabase
 .from('orders')
 .select('user_id')
 .eq('id', orderId)
 .single();
 if (orderError || !order || order.user_id !== user_id) throw new Error('Unauthorized');

 // Delete order items first due to foreign key constraints
 const { error: itemsError } = await supabase
 .from('order_items')
 .delete()
 .eq('order_id', orderId);

 if (itemsError) throw itemsError;

 const { error: delOrderError } = await supabase
 .from('orders')
 .delete()
 .eq('id', orderId);

 if (delOrderError) throw delOrderError;

 return true;
}

// Delete an order item
export async function deleteOrderItem(orderItemId: number, user_id: string) {
 if (!(await isValidUser(user_id))) throw new Error('Invalid user');
 // Optionally, check if the order item belongs to the user
 const { data: item, error: itemError } = await supabase
 .from('order_items')
 .select('order_id')
 .eq('id', orderItemId)
 .single();
 if (itemError || !item) throw new Error('Order item not found');

 const { data: order, error: orderError } = await supabase
 .from('orders')
 .select('user_id')
 .eq('id', item.order_id)
 .single();
 if (orderError || !order || order.user_id !== user_id) throw new Error('Unauthorized');

 const { error } = await supabase
 .from('order_items')
 .delete()
 .eq('id', orderItemId);

 if (error) throw error;
 return true;
}