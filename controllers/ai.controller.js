const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../models/index");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        const { Product, Category, ProductVariant, Brand } = db;

        if (!Product || !Category) {
            return res.status(500).json({ success: false, message: "Lỗi cấu hình Database." });
        }

        // 1. LẤY DỮ LIỆU SẢN PHẨM ĐỂ AI HỌC
        const rawProducts = await Product.findAll({
            where: { status: 'active' },
            limit: 50,
            attributes: ['id', 'name', 'slug'],
            include: [
                { model: Brand, as: 'brand', attributes: ['name'] },
                { model: ProductVariant, as: 'variants', attributes: ['price'] }
            ]
        });

        // Định dạng danh sách SP cho AI đọc dễ hiểu
        const productContext = rawProducts.map(p => {
            const minPrice = p.variants?.length > 0 ? Math.min(...p.variants.map(v => Number(v.price))) : 0;
            const priceStr = new Intl.NumberFormat('vi-VN').format(minPrice) + 'đ';
            return `- ${p.name} (${p.brand?.name}). Giá từ: ${priceStr}. Mã SP: ${p.slug}`;
        }).join('\n');

        // 2. CẤU HÌNH AI (ÉP DÙNG MÃ NGẦM ĐỂ HIỆN BOX Ở FRONTEND)
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: `
                Bạn là trợ lý ảo shop cầu lông CNC HUB. 
                DANH SÁCH SẢN PHẨM:
                ${productContext}

                QUY TẮC:
                1. Trả lời ngắn gọn (dưới 3 câu). Không lặp lại lời chào.
                2. Tuyệt đối không chèn link URL dài vào câu trả lời.
                3. Nếu muốn gợi ý sản phẩm, hãy thêm một dòng duy nhất ở CUỐI CÙNG theo đúng cú pháp sau:
                   [LINK_SP] slug_sản_phẩm | tên_sản_phẩm
                   Ví dụ: [LINK_SP] vot-yonex-astrox-77 | Vợt Yonex Astrox 77 Pro
            `,
        });

        // 3. XỬ LÝ LỊCH SỬ CHAT
        const formattedHistory = (history || []).map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text || "" }],
        }));

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: { maxOutputTokens: 5000, temperature: 0.6 },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        
        // Trả dữ liệu về cho Frontend xử lý tách Box
        res.status(200).json({ success: true, data: response.text() });

    } catch (error) {
        console.error("❌ LỖI AI:", error.message);
        res.status(500).json({ success: false, message: "AI đang bận, thử lại sau nhé!" });
    }
};