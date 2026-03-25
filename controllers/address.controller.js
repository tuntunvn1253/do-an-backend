const { UserAddress } = require("../models/index");

exports.getMyAddresses = async (req, res) => {
  try {
    const addresses = await UserAddress.findAll({
      where: { user_id: req.user.id },
      order: [
        ["is_default", "DESC"],
        ["created_at", "DESC"],
      ], // Đưa mặc định lên đầu
    });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    console.error("❌ Lỗi getMyAddresses:", error); // <-- Đã thêm log để in ra Terminal
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { full_name, phone, address, is_default } = req.body;
    const user_id = req.user.id;

    // Nếu user chọn đây là mặc định, set các địa chỉ cũ về false (0)
    if (is_default) {
      await UserAddress.update({ is_default: false }, { where: { user_id } });
    }

    // Nếu đây là địa chỉ đầu tiên, tự động cho nó là mặc định
    const count = await UserAddress.count({ where: { user_id } });
    const finalIsDefault = count === 0 ? true : is_default || false;

    const newAddress = await UserAddress.create({
      user_id,
      full_name,
      phone,
      address,
      is_default: finalIsDefault,
    });

    res.status(201).json({
      success: true,
      message: "Thêm địa chỉ thành công",
      data: newAddress,
    });
  } catch (error) {
    console.error("❌ Lỗi addAddress:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { full_name, phone, address, is_default } = req.body;
    const user_id = req.user.id;
    const addressId = req.params.id;

    const existingAddress = await UserAddress.findOne({
      where: { id: addressId, user_id },
    });
    if (!existingAddress)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy địa chỉ" });

    if (is_default) {
      await UserAddress.update({ is_default: false }, { where: { user_id } });
    }

    await existingAddress.update({
      full_name,
      phone,
      address,
      is_default:
        is_default !== undefined ? is_default : existingAddress.is_default,
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      data: existingAddress,
    });
  } catch (error) {
    console.error("❌ Lỗi updateAddress:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const user_id = req.user.id;
    const addressId = req.params.id;

    const existingAddress = await UserAddress.findOne({
      where: { id: addressId, user_id },
    });
    if (!existingAddress)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy địa chỉ" });

    await existingAddress.destroy();
    res.status(200).json({ success: true, message: "Đã xóa địa chỉ" });
  } catch (error) {
    console.error("❌ Lỗi deleteAddress:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đặt làm mặc định
exports.setDefault = async (req, res) => {
  try {
    const user_id = req.user.id;
    const addressId = req.params.id;

    // Reset tất cả về 0
    await UserAddress.update({ is_default: false }, { where: { user_id } });
    // Set cái được chọn thành 1
    await UserAddress.update(
      { is_default: true },
      { where: { id: addressId, user_id } },
    );

    res
      .status(200)
      .json({ success: true, message: "Đã cập nhật địa chỉ mặc định" });
  } catch (error) {
    console.error("❌ Lỗi setDefault:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
