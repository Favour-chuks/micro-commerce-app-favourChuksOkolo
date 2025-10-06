import express, { type Router, type Request, type Response } from "express";
import productService from "../services/product.services";
import authenticateAccessToken, { authorizeRole } from "../middleware/auth.middleware";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    // Only allow certain filters
    const allowedFilters = ['category_id', 'is_active'];
    const filters: Record<string, any> = {};
    allowedFilters.forEach(f => {
      if (req.query[f] !== undefined) filters[f] = req.query[f];
    });

    const result = await productService.listProducts(page, limit, filters);

    res.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.meta.page,
        limit: result.meta.limit,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
        nextPage: result.meta.page < result.meta.totalPages ? result.meta.page + 1 : null,
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to list products' });
  }
});

router.get("/slug/:slug", async (req: Request, res: Response) => {
		try {
			const slug = req.params.slug;
			const data = await productService.getProductBySlug(slug);
			if (!data) return res.status(404).json({ error: 'Product not found' });
			res.json(data);
		} catch (err: any) {
			res.status(400).json({ error: err.message || 'Failed to fetch product' });
		}
});

router.post("/", authenticateAccessToken, authorizeRole('admin'), async (req: Request, res: Response) => {
		try {
			const body = req.body;
			const required = ['title', 'price_cents', 'inventory_count'];
			for (const k of required) if (body[k] === undefined) return res.status(400).json({ error: `${k} is required` });

			const data = await productService.createProduct(body);
			res.status(201).json(data);
		} catch (err: any) {
			res.status(400).json({ error: err.message || 'Failed to create product' });
		}
});

router.put('/:id', authenticateAccessToken, authorizeRole('admin'), async (req: Request, res: Response) => {
		try {
			const id = Number(req.params.id);
			if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
			const data = await productService.updateProduct(id, req.body);
			res.json(data);
		} catch (err: any) {
			res.status(400).json({ error: err.message || 'Failed to update product' });
		}
});

router.patch('/:id/inventory', authenticateAccessToken, authorizeRole('admin'), async (req: Request, res: Response) => {
		try {
			const id = Number(req.params.id);
			const { inventory_count } = req.body;
			if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
			if (inventory_count === undefined) return res.status(400).json({ error: 'inventory_count is required' });
			const data = await productService.patchInventory(id, Number(inventory_count));
			res.json(data);
		} catch (err: any) {
			res.status(400).json({ error: err.message || 'Failed to patch inventory' });
		}
});


router.delete('/:id', authenticateAccessToken, authorizeRole('admin'), async (req: Request, res: Response) => {
		try {
			const id = Number(req.params.id);
			if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
			await productService.deleteProduct(id);
			res.json({ success: true, removedId: id });
		} catch (err: any) {
			res.status(400).json({ error: err.message || 'Failed to delete product' });
		}
});

export default router;