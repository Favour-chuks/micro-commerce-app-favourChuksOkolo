import express, {type Application} from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.ts";
import productRoutes from "./routes/product.routes.ts";
import cartRoutes from "./routes/cart.routes.ts";
import orderRoutes from "./routes/order.routes.ts";
import adminRoutes from "./routes/admin.routes.ts";
import authenticateAccessToken from "./middleware/auth.middleware.ts";

const app: Application = express();
// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/carts", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/admin", adminRoutes);


app.get("/", (req, res) => {
 console.log("endpoint reached")
 res.status(200).json({"data": "this endpoint was reached"})
})
export default app;