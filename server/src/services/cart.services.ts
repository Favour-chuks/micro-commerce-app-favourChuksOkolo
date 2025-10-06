import { supabase } from "../config/db.ts";

type Cart = {
  id: number;
  user_id: string;
  session_id?: string | null;
};

type CartItem = {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  price?: number | null; // snapshot price
};

async function ensureUserExists(userId: string) {
  const { data: user, error } = await supabase.from("users").select("id").eq("id", userId).single();
  if (error || !user) throw new Error("User with this id does not exist");
  return true;
}

async function getOrCreateCartForUser(userId: string, sessionId?: string) {
  // try to get existing cart
  const { data: cart, error } = await supabase.from("cart").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (cart) return cart as Cart;

  // create a new cart
  const { data: newCart, error: insertError } = await supabase
    .from("cart")
    .insert([{ user_id: userId, session_id: sessionId ?? null }])
    .select("*")
    .single();
  if (insertError) throw insertError;
  return newCart as Cart;
}

export const createNewCart = async (userId: string, sessionId?: string) => {
  await ensureUserExists(userId);
  const cart = await getOrCreateCartForUser(userId, sessionId);
  return cart;
};

export const getAllCartItems = async (userId: string) => {
  await ensureUserExists(userId);
  const { data: cart, error: cartError } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (cartError || !cart) return [];

  const { data: cartItems, error: itemsError } = await supabase
    .from("cart_item")
    .select("*, products(*)")
    .eq("cart_id", cart.id);
  if (itemsError) throw itemsError;
  return cartItems;
};

export const createCartItem = async (userId: string, productId: number, quantity = 1) => {
  await ensureUserExists(userId);
  const cart = await getOrCreateCartForUser(userId);

  // fetch product to get price snapshot and validate existence
  const { data: product, error: prodErr } = await supabase.from("products").select("id, price").eq("id", productId).single();
  if (prodErr || !product) throw new Error("Product does not exist");

  // If item exists, increment quantity
  const { data: existingItems } = await supabase
    .from("cart_item")
    .select("*")
    .eq("cart_id", cart.id)
    .eq("product_id", productId);

  if (existingItems && existingItems.length > 0) {
    const existing = existingItems[0] as CartItem;
    const { data: updated, error: updateErr } = await supabase
      .from("cart_item")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id)
      .select()
      .single();
    if (updateErr) throw updateErr;
    return updated;
  }

  const { data: newItem, error: insertErr } = await supabase
    .from("cart_item")
    .insert([{ cart_id: cart.id, product_id: productId, quantity, price: product.price }])
    .select()
    .single();
  if (insertErr) throw insertErr;
  return newItem;
};

export const updateCartItemQuantity = async (userId: string, cartItemId: number, value: number) => {
  await ensureUserExists(userId);

  // verify cart ownership
  const { data: cartItem, error: itemErr } = await supabase
    .from("cart_item")
    .select("id, cart_id")
    .eq("id", cartItemId)
    .single();
  if (itemErr || !cartItem) throw new Error("Cart item not found");

  const { data: cart, error: cartErr } = await supabase
    .from("cart")
    .select("user_id")
    .eq("id", cartItem.cart_id)
    .single();
  if (cartErr || !cart) throw new Error("Cart not found");
  if (cart.user_id !== userId) throw new Error("You do not have permission to edit this cart item");

  if (value <= 0) {
    // delete the item
    const { error: delErr } = await supabase.from("cart_item").delete().eq("id", cartItemId);
    if (delErr) throw delErr;
    return { removed: true, id: cartItemId };
  }

  const { data: updated, error: updateErr } = await supabase
    .from("cart_item")
    .update({ quantity: value })
    .eq("id", cartItemId)
    .select()
    .single();
  if (updateErr) throw updateErr;
  return updated;
};

export const removeCartItem = async (userId: string, cartItemId: number) => {
  // similar ownership checks as update
  const { data: cartItem, error: itemErr } = await supabase
    .from("cart_item")
    .select("id, cart_id")
    .eq("id", cartItemId)
    .single();
  if (itemErr || !cartItem) throw new Error("Cart item with this ID does not exist");

  const { data: cart, error: cartErr } = await supabase
    .from("cart")
    .select("user_id")
    .eq("id", cartItem.cart_id)
    .single();
  if (cartErr || !cart) throw new Error("Cart not found");
  if (cart.user_id !== userId) throw new Error("You do not have permission to delete this cart item");

  const { error: deleteError } = await supabase.from("cart_item").delete().eq("id", cartItemId);
  if (deleteError) throw deleteError;

  return { success: true, removedId: cartItemId };
};
