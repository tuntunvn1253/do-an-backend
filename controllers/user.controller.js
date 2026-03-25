const { User } = require("../models");

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Error getting user by ID:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//     try {
//         const user = await User.findByPk(req.params.id);

//         if (user) {
//             const { full_name, email, role, status } = req.body;
//             user.full_name = full_name || user.full_name;
//             user.email = email || user.email;
//             user.role = role || user.role;
//             user.status = status || user.status;

//             const updatedUser = await user.save();
//             // Manually remove password from the returned object
//             const userJson = updatedUser.toJSON();
//             delete userJson.password;

//             res.json({ success: true, data: userJson });

//         } else {
//             res.status(404).json({ success: false, message: 'User not found' });
//         }
//     } catch (error) {
//         console.error('Error updating user:', error);
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// };
const updateUser = async (req, res) => {
  try {
    if (
      req.user.id !== parseInt(req.params.id) &&
      req.user.vai_tro !== 1 &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền sửa thông tin của người khác!",
      });
    }
    const user = await User.findByPk(req.params.id);

    if (user) {
      const { full_name, phone, gender, address, role, status } = req.body;

      user.full_name = full_name !== undefined ? full_name : user.full_name;
      user.phone = phone !== undefined ? phone : user.phone;
      user.gender = gender !== undefined ? gender : user.gender;
      user.address = address !== undefined ? address : user.address;
      
      // Admin only fields
      if (req.user.role === 'admin' || req.user.vai_tro === 1) {
          user.role = role !== undefined ? role : user.role;
          user.status = status !== undefined ? status : user.status;
      }

      const updatedUser = await user.save();

      const userJson = updatedUser.toJSON();
      delete userJson.password;

      res.json({
        success: true,
        data: userJson,
        message: "Cập nhật thành công",
      });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật user:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (user) {
      await user.destroy();
      res.json({ success: true, message: "User removed" });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser };
