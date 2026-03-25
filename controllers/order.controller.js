const crypto = require("crypto"); // Import thư viện mã hóa có sẵn của Node.js
const {
  Order,
  OrderItem,
  ProductVariant,
  sequelize,
  User,
  Product,
  Coupon,
} = require("../models");
const sendEmail = require("../utils/sendEmail");

const createOrder = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    shippingFee,
    couponCode,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No order items provided" });
  }
  if (!shippingAddress) {
    return res
      .status(400)
      .json({ success: false, message: "Shipping address is required" });
  }

  const t = await sequelize.transaction();

  try {
    let itemsTotalPrice = 0;
    const orderItemData = [];
    const emailItemDetails = [];

    // 1. Kiểm tra tồn kho và tính tiền
    for (const item of orderItems) {
      const variant = await ProductVariant.findByPk(item.product_variant_id, {
        include: [{ model: Product, as: "product" }],
      });

      if (!variant)
        throw new Error(
          `Không tìm thấy phiên bản sản phẩm ID: ${item.product_variant_id}`,
        );

      if (variant.stock_quantity < item.quantity) {
        throw new Error(
          `Sản phẩm ${variant.product.name} - ${JSON.stringify(variant.variant_options)} không đủ hàng.`,
        );
      }

      itemsTotalPrice += variant.price * item.quantity;

      orderItemData.push({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        price: variant.price,
      });

      emailItemDetails.push(`
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${variant.product.name} (${JSON.stringify(variant.variant_options)})</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${variant.price.toLocaleString("vi-VN")}đ</td>
        </tr>
      `);

      variant.stock_quantity -= item.quantity;
      await variant.save({ transaction: t });
    }

    // --- XỬ LÝ COUPON ---
    let discountAmount = 0;
    let appliedCouponId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        where: { code: couponCode, is_active: true },
      });
      if (coupon) {
        const now = new Date();
        const isStarted =
          !coupon.starts_at || now >= new Date(coupon.starts_at);
        const isEnded = coupon.ends_at && now > new Date(coupon.ends_at);
        const isWithinUsage =
          !coupon.usage_limit_total ||
          coupon.usage_count < coupon.usage_limit_total;
        const isMinOrderMet =
          !coupon.min_order_amount ||
          itemsTotalPrice >= coupon.min_order_amount;

        if (isStarted && !isEnded && isWithinUsage && isMinOrderMet) {
          if (coupon.discount_type === "percent") {
            discountAmount = (itemsTotalPrice * coupon.discount_value) / 100;
            if (
              coupon.max_discount_amount &&
              discountAmount > coupon.max_discount_amount
            ) {
              discountAmount = Number(coupon.max_discount_amount);
            }
          } else {
            discountAmount = Number(coupon.discount_value);
          }
          appliedCouponId = coupon.id;

          // Cập nhật lượt dùng
          coupon.usage_count += 1;
          await coupon.save({ transaction: t });
        }
      }
    }

    const totalAmount = itemsTotalPrice + (shippingFee || 0) - discountAmount;

    // 2. Tạo đơn hàng trong DB
    const order = await Order.create(
      {
        user_id: req.user.id,
        coupon_id: appliedCouponId,
        shipping_name: shippingAddress.name,
        shipping_phone: shippingAddress.phone,
        shipping_address: shippingAddress.address,
        customer_note: shippingAddress.note,
        payment_method: paymentMethod,
        shipping_fee: shippingFee,
      },
      { transaction: t },
    );

    await OrderItem.bulkCreate(
      orderItemData.map((item) => ({ ...item, order_id: order.id })),
      { transaction: t },
    );

    await t.commit();

    // 4. GỬI EMAIL XÁC NHẬN ĐƠN HÀNG (ASYNCHRONOUS)
    const orderStatusText = {
      pending: "Chờ xử lý",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao hàng",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
      refunded: "Đã hoàn tiền",
      returned: "Đã trả hàng",
    };

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #2c3e50; text-align: center;">Xác nhận đơn hàng #${order.id}</h2>
        <p>Chào <strong>${req.user.full_name}</strong>,</p>
        <p>Cảm ơn bạn đã đặt hàng tại <strong>DATN-CNC</strong>. Đơn hàng của bạn đã được tiếp nhận và đang trong quá trình xử lý.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #eee; text-align: left;">Sản phẩm</th>
              <th style="padding: 10px; border: 1px solid #eee; text-align: center;">SL</th>
              <th style="padding: 10px; border: 1px solid #eee; text-align: right;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${emailItemDetails.join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; font-weight: bold; text-align: right;">Phí vận chuyển:</td>
              <td style="padding: 10px; text-align: right;">${(shippingFee || 0).toLocaleString("vi-VN")}đ</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 10px; font-weight: bold; text-align: right; color: #e74c3c; font-size: 1.2em;">Tổng cộng:</td>
              <td style="padding: 10px; text-align: right; color: #e74c3c; font-weight: bold; font-size: 1.2em;">${totalAmount.toLocaleString("vi-VN")}đ</td>
            </tr>
          </tfoot>
        </table>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
          <p style="margin: 0;"><strong>Thông tin giao hàng:</strong></p>
          <p style="margin: 5px 0 0 0;">${shippingAddress.name} | ${shippingAddress.phone}</p>
          <p style="margin: 5px 0 0 0;">${shippingAddress.address}</p>
          <p style="margin: 5px 0 0 0;">Phương thức thanh toán: <strong>${paymentMethod === "banking" ? "Chuyển khoản / Online" : "Thanh toán khi nhận hàng (COD)"}</strong></p>
        </div>

        <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #7f8c8d;">
          Đây là email tự động, vui lòng không phản hồi email này.
        </p>
      </div>
    `;

    // Không làm gián đoạn luồng chính nếu gửi mail lỗi
    sendEmail({
      to: req.user.email,
      subject: `[DATN-CNC] Xác nhận đơn hàng mới #${order.id}`,
      html: emailHtml,
    }).catch((err) => console.error("Lỗi gửi mail xác nhận đơn hàng:", err));

    // 3. GỌI TRỰC TIẾP API PAYOS (BỎ QUA THƯ VIỆN BỊ LỖI)
    if (paymentMethod === "banking" || paymentMethod === "vnpay") {
      const payosOrderCode = Number(String(Date.now()).slice(-6) + order.id);

      // 3.1 Cấu trúc payload chuẩn của PayOS
      const requestBody = {
        amount: totalAmount,
        cancelUrl: `${process.env.FRONTEND_URL}/checkout`,
        description: `Thanh toan don ${order.id}`.substring(0, 25),
        orderCode: payosOrderCode,
        returnUrl: `${process.env.FRONTEND_URL}/checkout-success?orderId=${order.id}`,
      };

      // 3.2 Tạo chữ ký (Signature) bắt buộc theo chuẩn PayOS (Xếp theo bảng chữ cái alphabet)
      const signString = `amount=${requestBody.amount}&cancelUrl=${requestBody.cancelUrl}&description=${requestBody.description}&orderCode=${requestBody.orderCode}&returnUrl=${requestBody.returnUrl}`;
      const signature = crypto
        .createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY)
        .update(signString)
        .digest("hex");
      requestBody.signature = signature;

      // 3.3 Dùng fetch gốc của Node.js bắn API đi
      const payosResponse = await fetch(
        "https://api-merchant.payos.vn/v2/payment-requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": process.env.PAYOS_CLIENT_ID,
            "x-api-key": process.env.PAYOS_API_KEY,
          },
          body: JSON.stringify(requestBody),
        },
      );

      const payosData = await payosResponse.json();

      // 3.4 Nhận link và gửi về Frontend
      if (payosData.code === "00") {
        return res.status(201).json({
          success: true,
          data: order,
          checkoutUrl: payosData.data.checkoutUrl, // Lấy link thành công!
        });
      } else {
        console.error("PayOS API Error Response:", payosData);
        throw new Error(
          payosData.desc || "Không thể tạo link thanh toán từ PayOS",
        );
      }
    }

    // Nếu là thanh toán khi nhận hàng (COD)
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error("Lỗi khi tạo đơn hàng: ", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Lỗi get my orders: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: ProductVariant,
              as: "variant",
              include: [
                {
                  model: Product,
                  as: "product",
                  attributes: ["name", "slug", "image_primary"],
                },
              ],
            },
          ],
        },
        { model: User, as: "user", attributes: ["full_name", "email"] },
      ],
    });

    if (order) {
      if (order.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this order",
        });
      }
      res.json({ success: true, data: order });
    } else {
      res.status(404).json({ success: false, message: "Order not found" });
    }
  } catch (error) {
    console.error("Lỗi get order by ID: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Order.findAndCountAll({
      offset,
      limit: parseInt(limit),
      order: [["created_at", "DESC"]],
      include: [
        { model: User, as: "user", attributes: ["id", "full_name", "email"] },
      ],
    });

    res.status(200).json({
      success: true,
      totalOrders: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      orders: rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  const allowedStatuses = [
    "pending",
    "confirmed",
    "shipping",
    "delivered",
    "cancelled",
    "refunded",
    "returned",
  ];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status provided" });
  }

  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", attributes: ["email", "full_name"] },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const oldStatus = order.order_status;
    order.order_status = status;
    await order.save();

    // Gửi mail thông báo cập nhật trạng thái
    const statusText = {
      pending: "Chờ xử lý",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao hàng",
      delivered: "Đã giao hàng (Thành công)",
      cancelled: "Đã hủy",
      refunded: "Đã hoàn tiền",
      returned: "Đã trả hàng",
    };

    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
            <h2 style="color: #2c3e50; text-align: center;">Cập nhật trạng thái đơn hàng #${order.id}</h2>
            <p>Chào <strong>${order.user.full_name}</strong>,</p>
            <p>Trạng thái đơn hàng của bạn đã được thay đổi từ <strong>${statusText[oldStatus]}</strong> sang <strong style="color: #3498db;">${statusText[status]}</strong>.</p>
            <p>Vui lòng kiểm tra chi tiết đơn hàng trong tài khoản của bạn.</p>
            <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #7f8c8d;">
                Cảm ơn bạn đã tin tưởng mua sắm tại DATN-CNC.
            </p>
        </div>
    `;

    sendEmail({
      to: order.user.email,
      subject: `[DATN-CNC] Cập nhật trạng thái đơn hàng #${order.id}`,
      html: emailHtml,
    }).catch((err) => console.error("Lỗi gửi mail cập nhật trạng thái:", err));

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
