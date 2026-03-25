const { sequelize } = require('../config/database');

const Brand = require('./brand.model');
const Category = require('./category.model');
const Product = require('./product.model');
const ProductVariant = require('./product-variant.model');
const User = require('./user.model');
const UserAddress = require('./user-address.model');
const Order = require('./order.model');
const OrderItem = require('./order-item.model');
const Coupon = require('./coupon.model');
const Banner = require('./banner.model');
const Logo = require('./logos.model');
const Post = require('./post.model');
const PostCategory = require('./post-category.model');
const Review = require('./review.model');
const VariantImage = require('./variant-image.model');
const Cart = require('./cart.model');
const CartItem = require('./cart-item.model');

const db = {};

db.sequelize = sequelize;
db.Brand = Brand;
db.Category = Category;
db.Product = Product;
db.ProductVariant = ProductVariant;
db.User = User;
db.UserAddress = UserAddress;
db.Order = Order;
db.OrderItem = OrderItem;
db.Coupon = Coupon;
db.Banner = Banner;
db.Logo = Logo;
db.Post = Post;
db.PostCategory = PostCategory;
db.Review = Review;
db.VariantImage = VariantImage;
db.Cart = Cart;
db.CartItem = CartItem;

// PostCategory <-> Post
db.PostCategory.hasMany(db.Post, { foreignKey: 'post_category_id', as: 'posts' });
db.Post.belongsTo(db.PostCategory, { foreignKey: 'post_category_id', as: 'category' });

// Brand <-> Product
db.Brand.hasMany(db.Product, { foreignKey: 'brand_id' });
db.Product.belongsTo(db.Brand, { foreignKey: 'brand_id', as: 'brand' });

// Product <-> Category (Many-to-Many)
db.Product.belongsToMany(db.Category, {
    through: 'product_categories',
    foreignKey: 'product_id',
    otherKey: 'category_id',
    as: 'categories',
    timestamps: false
});
db.Category.belongsToMany(db.Product, {
    through: 'product_categories',
    foreignKey: 'category_id',
    otherKey: 'product_id',
    as: 'products',
    timestamps: false
});

// Product -> Category (One-to-Many for primary category)
db.Category.hasMany(db.Product, { foreignKey: 'category_id', as: 'primaryProducts' });
db.Product.belongsTo(db.Category, { foreignKey: 'category_id', as: 'primaryCategory' });

// Product <-> ProductVariant
db.Product.hasMany(db.ProductVariant, { foreignKey: 'product_id', as: 'variants' });
db.ProductVariant.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' });

// ProductVariant <-> VariantImage
db.ProductVariant.hasMany(db.VariantImage, { foreignKey: 'variant_id', as: 'images' });
db.VariantImage.belongsTo(db.ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// User <-> Order
db.User.hasMany(db.Order, { foreignKey: 'user_id', as: 'orders' });
db.Order.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

// 1 User có nhiều Address (1-N)
db.User.hasMany(db.UserAddress, { foreignKey: 'user_id', as: 'addresses' });
db.UserAddress.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

// Coupon <-> Order
db.Coupon.hasMany(db.Order, { foreignKey: 'coupon_id', as: 'orders' });
db.Order.belongsTo(db.Coupon, { foreignKey: 'coupon_id', as: 'coupon' });

// Order <-> OrderItem
db.Order.hasMany(db.OrderItem, { foreignKey: 'order_id', as: 'items' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id' });

// ProductVariant <-> OrderItem
db.ProductVariant.hasMany(db.OrderItem, { foreignKey: 'product_variant_id' });
db.OrderItem.belongsTo(db.ProductVariant, { foreignKey: 'product_variant_id', as: 'variant' });

// User <-> Review
db.User.hasMany(db.Review, { foreignKey: 'user_id', as: 'reviews' });
db.Review.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

// OrderItem <-> Review
db.OrderItem.hasOne(db.Review, { foreignKey: 'order_items_id', as: 'review' });
db.Review.belongsTo(db.OrderItem, { foreignKey: 'order_items_id', as: 'orderItem' });

// User <-> Cart
db.User.hasOne(db.Cart, { foreignKey: 'user_id', as: 'cart' });
db.Cart.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

// Cart <-> CartItem
db.Cart.hasMany(db.CartItem, { foreignKey: 'cart_id', as: 'items' });
db.CartItem.belongsTo(db.Cart, { foreignKey: 'cart_id' });

// ProductVariant <-> CartItem
db.ProductVariant.hasMany(db.CartItem, { foreignKey: 'product_variant_id' });
db.CartItem.belongsTo(db.ProductVariant, { foreignKey: 'product_variant_id', as: 'variant' });

module.exports = db;
