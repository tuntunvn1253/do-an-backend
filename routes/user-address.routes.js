const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { protect } = require('../middleware/auth.middleware');

// TẤT CẢ CÁC API NÀY ĐỀU CẦN ĐĂNG NHẬP (Protect)
router.use(protect);

router.get('/', addressController.getMyAddresses);
router.post('/', addressController.addAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.patch('/:id/set-default', addressController.setDefault);

module.exports = router;