const { Category } = require('../models');

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
        });
        res.status(200).json({ 
            success: true, 
            count: categories.length, 
            data: categories 
        });
    } catch (error) {
        console.error('Error getting categories: ', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        console.error('Error getting category by ID:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(400).json({ success: false, message: 'Could not create category', error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        const updatedCategory = await category.update(req.body);
        res.status(200).json({ success: true, data: updatedCategory });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(400).json({ success: false, message: 'Could not update category', error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        await category.destroy();
        res.status(200).json({ success: true, message: 'Category removed' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
