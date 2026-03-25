const { User } = require("../models");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
require("dotenv").config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin" });
  }

  try {
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "Email này đã được đăng ký" });
    }

    const user = User.build({
      full_name,
      email,
      password,
    });

    // Create verification token
    const verificationToken = user.getVerificationToken();

    await user.save();

    // Create verification url that points to the frontend
    const verifyUrl = `http://localhost:4200/verify-email?token=${verificationToken}`;

    const message = `<h1>Xác nhận email của bạn</h1>
                         <p>Cảm ơn bạn đã đăng ký tại DATN-CNC. Vui lòng nhấn vào link bên dưới để xác nhận email:</p>
                         <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Xác nhận đăng ký tài khoản DATN-CNC",
        html: message,
      });

      res.status(201).json({
        success: true,
        message:
          "Email xác nhận đã được gửi. Vui lòng kiểm tra hộp thư của bạn.",
      });
    } catch (emailError) {
      console.error("Verification email could not be sent:", emailError);
      user.verificationToken = null;
      user.verificationTokenExpire = null;
      await user.save();
      return res
        .status(500)
        .json({ success: false, message: "Không thể gửi email xác nhận" });
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verifyemail/:token
// @access  Public
const verifyEmail = async (req, res) => {
  // Hash token from URL
  const verificationToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  try {
    const user = await User.findOne({
      where: {
        verificationToken,
        verificationTokenExpire: {
          [require("sequelize").Op.gt]: Date.now(),
        },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
    }

    // Set email_verified_at
    user.email_verified_at = new Date();
    user.verificationToken = null;
    user.verificationTokenExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Email đã được xác nhận thành công. Bạn có thể đăng nhập ngay bây giờ.",
    });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng nhập email và mật khẩu" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil(
        (user.lockUntil - Date.now()) / (60 * 1000),
      );
      return res.status(403).json({
        success: false,
        message: `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`,
      });
    }

    if (user.status === "blocked") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Tài khoản của bạn đã bị khóa vĩnh viễn.",
        });
    }

    // Check if email is verified
    if (!user.email_verified_at) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Vui lòng xác nhận email trước khi đăng nhập.",
        });
    }

    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      // Reset failed login attempts
      await user.update({
        last_login_at: new Date(),
        login_failed_count: 0,
        lockUntil: null,
      });

      res.json({
        success: true,
        _id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      let updates = {
        login_failed_count: user.login_failed_count + 1,
      };

      if (updates.login_failed_count >= 5) {
        updates.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
        updates.login_failed_count = 0; // Reset counter after locking
        await user.update(updates);
        return res.status(403).json({
          success: false,
          message:
            "Bạn đã nhập sai quá 5 lần. Tài khoản sẽ bị khóa trong 30 phút.",
        });
      }

      await user.update(updates);
      res
        .status(401)
        .json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

const forgotPassword = async (req, res) => {
  const user = await User.findOne({ where: { email: req.body.email } });

  if (!user) {
    // It's better not to reveal if a user exists or not for security reasons
    return res
      .status(200)
      .json({ success: true, message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP." });
  }

  const otp = user.getResetPasswordOTP();

  await user.save();

  const message = `<h1>Yêu cầu khôi phục mật khẩu</h1>
                     <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu khôi phục mật khẩu. Mã OTP của bạn là:</p>
                     <h2 style="font-size: 24px; text-align: center; letter-spacing: 4px;">${otp}</h2>
                     <p>Mã OTP này sẽ hết hạn sau 10 phút.</p>`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Khôi phục mật khẩu DATN-CNC",
      html: message,
    });

    res
      .status(200)
      .json({ success: true, message: "Email khôi phục mật khẩu đã được gửi" });
  } catch (error) {
    console.error("Forgot Password Email Error:", error);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();
    return res
      .status(500)
      .json({
        success: false,
        message: "Không thể gửi email khôi phục mật khẩu",
      });
  }
};

const resetPasswordWithOTP = async (req, res) => {
  const { email, otp, password } = req.body;
  
  if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin" });
  }

  try {
    // Find user by email
    const user = await User.findOne({
      where: {
        email,
        resetPasswordExpire: {
          [require("sequelize").Op.gt]: Date.now(),
        },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email không tồn tại hoặc mã OTP đã hết hạn.",
        });
    }

    // Hash the incoming OTP and compare it with the stored hash
    const hashedOTP = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    if (user.resetPasswordToken !== hashedOTP) {
        return res.status(400).json({ success: false, message: "Mã OTP không chính xác." });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Mật khẩu đã được cập nhật thành công",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPasswordWithOTP,
};
