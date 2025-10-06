import express, { type Router, type Request, type Response } from "express";
import authenticateAccessToken from "../middleware/auth.middleware";
import * as orderService from "../services/order.services";

const router: Router = express.Router();

router.post("/", authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const userId = user.sub || user.id;
		const { items, status, total } = req.body;
		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: 'items array is required' });
		}

		const orderPayload = {
			user_id: userId,
			status: status || 'pending',
			total: total ?? 0,
		};

		const created = await orderService.createOrder(orderPayload, items);
		res.status(201).json(created);
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to create order' });
	}
});

router.get("/", authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const userId = user.sub || user.id;
		const data = await orderService.getAllOrders(userId);
		res.json(data);
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to list orders' });
	}
});


router.get("/:id", authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const userId = user.sub || user.id;
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
		const data = await orderService.getOrderById(id, userId);
		res.json(data);
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to fetch order' });
	}
});


router.patch('/items/:itemId', authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const userId = user.sub || user.id;
		const itemId = Number(req.params.itemId);
		if (!Number.isFinite(itemId)) return res.status(400).json({ error: 'invalid item id' });
		const updates = req.body;
		const updated = await orderService.editOrderItem(itemId, updates, userId);
		res.json(updated);
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to edit order item' });
	}
});


router.delete('/:id', authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const userId = user.sub || user.id;
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
		const ok = await orderService.deleteOrder(id, userId);
		res.json({ success: ok });
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to delete order' });
	}
});


router.delete('/items/:itemId', authenticateAccessToken, async (req: Request, res: Response) => {
	try {
		const user = (req as any).user;
		const userId = user.sub || user.id;
		const itemId = Number(req.params.itemId);
		if (!Number.isFinite(itemId)) return res.status(400).json({ error: 'invalid item id' });
		const ok = await orderService.deleteOrderItem(itemId, userId);
		res.json({ success: ok });
	} catch (err: any) {
		res.status(400).json({ error: err.message || 'Failed to delete order item' });
	}
});

export default router;