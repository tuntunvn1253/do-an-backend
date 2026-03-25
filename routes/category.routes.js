const express = require('express');
const router = express.Router();
const { 
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.route('/')
    .get(getAllCategories)
    .post(protect, admin, createCategory);

router.route('/:id')
    .get(getCategoryById)
    .put(protect, admin, updateCategory)
    .delete(protect, admin, deleteCategory);

module.exports = router;
