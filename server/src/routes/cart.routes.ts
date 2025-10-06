import express, { type Router, type Request, type Response } from "express";
import authenticateAccessToken from "../middleware/auth.middleware";
import * as cartService from "../services/cart.services";

const router: Router = express.Router();

// Create or get a cart for the authenticated user
router.post("/carts", authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const sessionId = req.body?.sessionId as string | undefined;
		const cart = await cartService.createNewCart(user.sub || user.id, sessionId);
		res.status(201).json(cart);
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to create cart' });
	}
});

// Get all items for authenticated user (ignores cartId param for safety)
router.get("/carts/:cartId", authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const items = await cartService.getAllCartItems(user.sub || user.id);
		res.json(items);
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to fetch cart items' });
	}
});

// Add an item to the authenticated user's cart
router.post("/carts/:cartId/items", authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const { productId, quantity } = req.body;
		if (!productId) return res.status(400).json({ error: 'productId is required' });
		const item = await cartService.createCartItem(user.sub || user.id, Number(productId), Number(quantity) || 1);
		res.status(201).json(item);
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to add cart item' });
	}
});

// Update a cart item's quantity
router.patch("/carts/:cartId/items/:itemsId", authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const itemId = Number(req.params.itemsId);
		const { quantity } = req.body;
		if (!Number.isFinite(itemId)) return res.status(400).json({ error: 'invalid item id' });
		if (quantity === undefined) return res.status(400).json({ error: 'quantity is required' });
		const updated = await cartService.updateCartItemQuantity(user.sub || user.id, itemId, Number(quantity));
		res.json(updated);
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to update cart item' });
	}
});

// Remove a cart item
router.delete("/carts/:cartId/items/:itemsId", authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const itemId = Number(req.params.itemsId);
		if (!Number.isFinite(itemId)) return res.status(400).json({ error: 'invalid item id' });
		const result = await cartService.removeCartItem(user.sub || user.id, itemId);
		res.json(result);
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to remove cart item' });
	}
});

export default router;