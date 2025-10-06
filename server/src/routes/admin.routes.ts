import express, { type Router, type Request, type Response } from "express";
import authenticateAccessToken from "../middleware/auth.middleware";
import { authorizeRole } from "../middleware/auth.middleware";
import { supabase } from "../config/db";
import * as userService from "../services/user.services";
import * as orderService from "../services/order.services";

const router: Router = express.Router();


router.get('/users', authenticateAccessToken, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('users').select('id, email, role, created_at');
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to list users' });
  }
});


router.delete('/users/:id', authenticateAccessToken, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await userService.removeUser(id);
    res.json({ success: true, removedId: id });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to remove user' });
  }
});


router.get('/orders', authenticateAccessToken, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const data = await orderService.getAllOrders(userId);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to list orders' });
  }
});

export default router;