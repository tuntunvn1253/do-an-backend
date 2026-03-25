const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/database");
require("dotenv").config();

const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const brandRoutes = require("./routes/brand.routes");
const bannerRoutes = require("./routes/banner.routes"); // 1. Thêm dòng này
const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const userRoutes = require("./routes/user.routes");
const userAddressRoutes = require("./routes/user-address.routes");
const couponRoutes = require("./routes/coupon.routes");
const cartRoutes = require("./routes/cart.routes");
const compareRoutes = require("./routes/compare.routes"); // 1. Thêm dòng này

connectDB();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.send("API is running successfully.");
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/address", userAddressRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/compare", compareRoutes); // 2. Đăng ký route so sánh ở đây
app.use("/api/banners", bannerRoutes); // 3. Đăng ký route banner ở đây
app.use('/api/ai', require('./routes/ai.routes'));

app.get("/", (req, res) => {
  res.send("Hello from CNC Backend!");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
