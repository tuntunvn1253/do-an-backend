const { Product, Brand, Category, ProductVariant } = require('../models');
const { Op } = require('sequelize');

const getAllProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 12, 
            sortBy = 'created_at', 
            order = 'DESC', 
            name, 
            category_slug,
            brand_name,
            is_featured,
            is_sale,
            minPrice,
            maxPrice
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        
        // Lọc theo tên
        if (name) {
            where.name = { [Op.like]: `%${name}%` };
        }
        
        // Lọc sản phẩm nổi bật
        if (is_featured === 'true' || is_featured === true || is_featured === '1') {
            where.is_featured = 1;
        }

        // Lọc sản phẩm đang giảm giá (sale_price > 0)
        if (is_sale === 'true' || is_sale === true) {
            where.sale_price = { [Op.gt]: 0 };
        }

        // Lọc theo khoảng giá (áp dụng cho giá bán hiện tại: ưu tiên sale_price nếu có, không thì price)
        if (minPrice || maxPrice) {
            where[Op.and] = [];
            if (minPrice) {
                where[Op.and].push({
                    [Op.or]: [
                        { sale_price: { [Op.gte]: parseFloat(minPrice) } },
                        { [Op.and]: [{ sale_price: { [Op.or]: [0, null] } }, { price: { [Op.gte]: parseFloat(minPrice) } }] }
                    ]
                });
            }
            if (maxPrice) {
                where[Op.and].push({
                    [Op.or]: [
                        { [Op.and]: [{ sale_price: { [Op.gt]: 0 } }, { sale_price: { [Op.lte]: parseFloat(maxPrice) } }] },
                        { [Op.and]: [{ sale_price: { [Op.or]: [0, null] } }, { price: { [Op.lte]: parseFloat(maxPrice) } }] }
                    ]
                });
            }
        }
        
// --- ĐOẠN CODE SAU KHI SỬA ---

        const include = [
            {
                model: Brand,
                as: 'brand',
                attributes: ['name', 'logo_url', 'status'], // Lấy thêm status để check
                where: { status: 1 }, // <--- QUAN TRỌNG: Chỉ lấy sản phẩm có Brand đang hoạt động
                required: true        // <--- BẮT BUỘC: Biến nó thành INNER JOIN để loại bỏ sản phẩm nếu Brand ẩn
            },
            {
                model: Category,
                as: 'primaryCategory',
                attributes: ['name', 'slug']
                // Nếu muốn ẩn sản phẩm khi Danh mục bị ẩn, bạn cũng thêm where: { status: 1 } ở đây
            },
            {
                model: ProductVariant,
                as: 'variants',
                attributes: ['price', 'stock_quantity', 'variant_options']
            }
        ];

        // Nếu người dùng có lọc theo brand_name cụ thể từ Sidebar
        if (brand_name) {
            // Kết hợp điều kiện: Tên khớp AND Status = 1
            include[0].where = {
                [Op.and]: [
                    { name: brand_name },
                    { status: 1 }
                ]
            };
        }

        if (category_slug) {
            include[1].where = { slug: category_slug };
            include[1].required = true;
        }

        const { count, rows } = await Product.findAndCountAll({
            where,
            offset,
            limit: parseInt(limit),
            order: [[sortBy, order]],
            include,
            distinct: true,
            attributes: [
                'id',
                'name',
                'slug',
                'price',
                'sale_price',
                'stock_quantity',
                'sku',
                'image_primary',
                'product_type',
                'status',
                'is_featured',
                'short_description',
                'description',
                'guide_use',
                'specifications',
                'created_at',
                'updated_at',
                'category_id'
            ]
        });

        res.status(200).json({
            success: true,
            totalProducts: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            products: rows
        });
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { slug: req.params.slug },
            include: [
                { model: Brand, as: 'brand' },
                { 
                    model: Category, 
                    as: 'primaryCategory'
                },
                { 
                    model: ProductVariant, 
                    as: 'variants'
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error(`Error getting product ${req.params.slug}:`, error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                { model: Brand, as: 'brand' },
                { 
                    model: Category, 
                    as: 'primaryCategory'
                },
                { 
                    model: ProductVariant, 
                    as: 'variants'
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error(`Error getting product by id ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const createProduct = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // 1. Tạo sản phẩm chính
        const product = await Product.createProduct(req.body, { transaction: t });

        // 2. KIỂM TRA BIẾN THỂ: Nếu Admin không gửi danh sách variants lên
        if (!req.body.variants || req.body.variants.length === 0) {
            // TỰ ĐỘNG TẠO VARIANT MẶC ĐỊNH
            await ProductVariant.createProduct({
                product_id: product.id,
                // Lấy SKU của sản phẩm gốc, nếu không có thì tự chế
                sku: req.body.sku || `DEF-${product.id}`, 
                // Lấy giá và tồn kho từ sản phẩm chính
                price: req.body.price || 0,
                stock_quantity: req.body.stock_quantity || 0,
                // Lưu tên phân loại là "Mặc định" dưới dạng JSON
                variant_options: { "Phân loại": "Mặc định" } 
            }, { transaction: t });
        } else {
            // Nếu có gửi danh sách variant (nhiều màu/size) thì lưu bình thường
            const variants = req.body.variants.map(v => ({ ...v, product_id: product.id }));
            await ProductVariant.bulkcreateProduct(variants, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ success: true, message: "Tạo sản phẩm thành công!" });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const updatedProduct = await product.update(req.body);
        res.status(200).json({ success: true, data: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(400).json({ success: false, message: 'Could not update product', error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await product.destroy();
        res.status(200).json({ success: true, message: 'Product removed' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = {
    getAllProducts,
    getProductBySlug,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};