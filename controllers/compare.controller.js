const { Product, Brand, ProductVariant } = require('../models');
const { Op } = require('sequelize');

const compareProducts = async (req, res) => {
    try {
        const { ids } = req.query;

        // 1. Kiểm tra đầu vào
        if (!ids) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp danh sách ID sản phẩm để so sánh.'
            });
        }

        // 2. Chuyển chuỗi "113,114" thành mảng số [113, 114]
        const idArray = ids.split(',')
            .map(id => parseInt(id, 10))
            .filter(Number.isFinite);

        if (idArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách ID không hợp lệ.'
            });
        }

        // 3. Truy vấn Database
        const products = await Product.findAll({
            where: {
                id: { [Op.in]: idArray }
                // Tạm thời bỏ 'status: 1' để bạn kiểm tra nếu data trống
            },
            include: [
                {
                    model: Brand,
                    as: 'brand',
                    attributes: ['id', 'name', 'logo_url']
                    // Tạm thời bỏ 'required: true' để sản phẩm vẫn hiện dù brand bị lỗi
                },
                {
                    model: ProductVariant,
                    as: 'variants',
                    attributes: ['price', 'stock_quantity', 'variant_options']
                }
            ],
            attributes: [
                'id', 
                'name', 
                'slug', 
                'image_primary', 
                'price', 
                'sale_price', 
                'specifications', 
                'short_description'
            ]
        });

        // 4. Sắp xếp lại kết quả trả về theo đúng thứ tự ID người dùng gửi lên
        const orderedProducts = idArray
            .map(id => products.find(p => p.id === id))
            .filter(p => p !== undefined);

        // 5. Trả kết quả
        return res.status(200).json({
            success: true,
            count: orderedProducts.length,
            products: orderedProducts
        });

    } catch (error) {
        console.error('Error in compareProducts:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải dữ liệu so sánh.',
            error: error.message
        });
    }
};

module.exports = {
    compareProducts
};