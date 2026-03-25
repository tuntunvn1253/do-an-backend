const { Banner } = require('../models'); // Đảm bảo đường dẫn tới Model Banner chính xác

// 1. Lấy danh sách Banner
const getBanners = async (req, res) => {
    try {
        const { active, position } = req.query;
        let where = {};
        if (active === 'true') where.is_active = 1;
        if (position) where.position = position;

        const banners = await Banner.findAll({
            where,
            order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
        });
        res.status(200).json({ success: true, data: banners });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy banner' });
    }
};

// 2. Lấy 1 Banner theo ID
const getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
        res.json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Tạo mới Banner (Cho Admin)
const createBanner = async (req, res) => {
    try {
        const newBanner = await Banner.create(req.body);
        res.status(201).json({ success: true, data: newBanner });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 4. Cập nhật Banner (Cho Admin)
const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
        
        await banner.update(req.body);
        res.json({ success: true, data: banner });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 5. Xóa Banner (Cho Admin)
const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: 'Không tìm thấy banner' });
        
        await banner.destroy();
        res.json({ success: true, message: 'Xóa banner thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// QUAN TRỌNG: Export đầy đủ để file Routes không bị undefined
module.exports = { 
    getBanners, 
    getBannerById, 
    createBanner, 
    updateBanner, 
    deleteBanner 
};