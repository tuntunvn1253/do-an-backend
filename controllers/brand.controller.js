const { Brand } = require('../models');

const getAllBrands = async (req, res) => {
    try {
        const activeOnly = req.query.active === 'true';

        const where = activeOnly ? { status: 1 } : {}; 

        const brands = await Brand.findAll({
            where,
            order: [['sort_order', 'ASC'], ['name', 'ASC']]
        });

        res.status(200).json({ success: true, data: brands });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Lấy brand theo ID
const getBrandById = async (req, res) => {
    try {
        const brand = await Brand.findByPk(req.params.id);
        if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
        res.status(200).json({ success: true, data: brand });
    } catch (error) {
        console.error('Error getting brand by ID:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Tạo brand mới
const createBrand = async (req, res) => {
    try {
        const brand = await Brand.create(req.body);
        res.status(201).json({ success: true, data: brand });
    } catch (error) {
        console.error('Error creating brand:', error);
        res.status(400).json({ success: false, message: 'Could not create brand', error: error.message });
    }
};

// Cập nhật brand
const updateBrand = async (req, res) => {
    try {
        const brand = await Brand.findByPk(req.params.id);
        if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

        const updatedBrand = await brand.update(req.body);
        res.status(200).json({ success: true, data: updatedBrand });
    } catch (error) {
        console.error('Error updating brand:', error);
        res.status(400).json({ success: false, message: 'Could not update brand', error: error.message });
    }
};

// Xóa brand
const deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findByPk(req.params.id);
        if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

        await brand.destroy();
        res.status(200).json({ success: true, message: 'Brand removed' });
    } catch (error) {
        console.error('Error deleting brand:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { getAllBrands, getBrandById, createBrand, updateBrand, deleteBrand };