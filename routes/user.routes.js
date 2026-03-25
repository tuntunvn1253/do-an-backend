const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { protect, admin } = require('../middleware/auth.middleware');


router.use(protect);

// PHÂN QUYỀN RIÊNG CHO TỪNG ROUTE

router.route('/')
    .get(admin, getUsers);


router.route('/:id')
    .get(getUserById)   
    .put(updateUser)     
    .delete(admin, deleteUser); // Chỉ admin mới được xóa user

module.exports = router;