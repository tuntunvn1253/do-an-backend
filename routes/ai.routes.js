const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");

// Route này công khai cho khách hàng tư vấn
router.post("/consult", aiController.chatWithAI);

module.exports = router;
