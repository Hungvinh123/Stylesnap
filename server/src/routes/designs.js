import express from "express";
import sql from "mssql";
import { getPool } from "../db.js";

const router = express.Router();

// Lưu 1 thiết kế mới
router.post("/", async (req, res) => {
    try {
          const { userId, title, stateJson, thumbnailUrl } = req.body;
  if (!userId || !title || !stateJson) {
    return res.status(400).json({ error: "Missing userId/title/stateJson" });
  }
        const pool = await getPool();

        const result = await pool
            .request()
            .input("user_id", sql.Int, userId)
            .input("title", sql.NVarChar(200), title)
            .input("state_json", sql.NVarChar(sql.MAX), JSON.stringify(stateJson))
            .input("thumbnail_url", sql.NVarChar(500), thumbnailUrl || null)
            .query(
                "INSERT INTO Designs (user_id, title, state_json, thumbnail_url, created_at) OUTPUT INSERTED.id VALUES (@user_id, @title, @state_json, @thumbnail_url, SYSUTCDATETIME())"
            );

       const newId = result.recordset[0].id;
       res.status(201).json({ success: true, designId: newId, userId });
    } catch (err) {
        console.error("Save design error:", err);
        // giai đoạn dev trả thêm message để debug
 res.status(500).json({ error: "Failed to save design", detail: String(err?.message || err) });
    }
});

// Lấy tất cả thiết kế của user
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: "Missing userId" });
        const pool = await getPool();

        const result = await pool
            .request()
            .input("user_id", sql.Int, userId)
            .query("SELECT * FROM Designs WHERE user_id = @user_id ORDER BY created_at DESC");

        res.json(result.recordset.map(r => ({
            id: r.id,
            title: r.title,
            state: JSON.parse(r.state_json),
            thumbnailUrl: r.thumbnail_url,
            createdAt: r.created_at
        })));
    } catch (err) {
        console.error("Get designs error:", err);
        res.status(500).json({ error: "Failed to fetch designs" });
    }
});

export default router;
