import {supabase} from "../config/db.ts"
import { passwordHash } from '../utils/auth.utils.ts';



export const createUser = async (email: string, password: string) => {
  const { data: existingUser, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  if (lookupError && lookupError.code !== "PGRST116") {
    throw new Error("Database error while checking user");
  }

  const hash = await passwordHash(password)

  const { data, error } = await supabase
    .from("users")
    .insert([{ email, password: hash }])
    .select("id, email")
    .single();

  if (error) throw new Error(error.message);

  return data;
};


export const updateUserPassword = async (email: string, password: string) => {
  const { data: user, error } = await supabase.from("users").select("id").eq("email", email).single();
  if (error || !user) throw new Error("User with this email does not exist");
  const userId = user.id;

 const pwHash = passwordHash(password)

 const {error: passwordError} = await supabase.from("users").update({ password: pwHash })
  .eq('id', userId)

  if(passwordError) throw new Error("Failed to update password");

  return true;
}

export const removeUser = async (userId: string) => {
  const { data: user, error } = await supabase.from("users").select("id").eq("id", userId).single();
  if (error || !user) throw new Error("User with this id does not exist");
  
  // remove cart items -> carts
  const { data: carts, error: cartsSelectError } = await supabase
    .from('cart')
    .select('id')
    .eq('user_id', userId);

  if (cartsSelectError) {
    // decide whether to bail or continue; for now continue but log/throw as needed
    console.warn('Failed to fetch carts before deleting cart items:', cartsSelectError);
  }

  const cartIds = (carts || []).map(c => c.id).filter(Boolean);

  if (cartIds.length > 0) {
    const { error: cartItemsError } = await supabase
      .from('cart_item')
      .delete()
      .in('cart_id', cartIds);

    // ignore cartItemsError for now, continue
    if (cartItemsError) {
      console.warn('Failed to delete cart items for carts:', cartItemsError);
    }
  }

  const { error: cartsError } = await supabase.from('cart').delete().eq('user_id', userId);

  // remove order items -> orders
  const { data: orders, error: ordersSelectError } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId);

  if (ordersSelectError) {
    console.warn('Failed to fetch orders before deleting order items:', ordersSelectError);
  }

  const orderIds = (orders || []).map(o => o.id).filter(Boolean);

  if (orderIds.length > 0) {
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .delete()
      .in('order_id', orderIds);

    if (orderItemsError) {
      console.warn('Failed to delete order items for orders:', orderItemsError);
    }
  }

  const { error: ordersError } = await supabase.from('orders').delete().eq('user_id', userId);

  // TODO: remove other user data (addresses, sessions, etc.) if present in your schema

  const { error: removeError } = await supabase.from('users').delete().eq('id', userId);
  // TODO: remember to add the orderitemserror to this aggregate
  if (cartsSelectError || cartsError || ordersSelectError || ordersError || removeError) {
    // aggregate error message for easier debugging
    const messages = [cartsSelectError, cartsError, ordersSelectError, ordersError, removeError]
      .filter(Boolean)
      .map((e: any) => e?.message || JSON.stringify(e));
    throw new Error('Failed to remove user and related data: ' + messages.join(' | '));
  }

  return true;
}