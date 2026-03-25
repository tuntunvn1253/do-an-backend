const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");
const { protect, admin } = require("../middleware/auth.middleware");

// Route lấy tất cả sản phẩm (có filter, pagination) và tạo mới
router.route("/")
  .get(getAllProducts)
  .post(protect, admin, createProduct);
 

// Route lấy theo SLUG (Ưu tiên đưa lên trước để tránh nhầm với :id)
router.get("/slug/:slug", getProductBySlug);

// Route thao tác theo ID
router.route("/:id")
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;