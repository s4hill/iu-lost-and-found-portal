const express = require('express');
const router = express.Router();

module.exports = (LostItem, upload) => {
    
    // Get all lost items
    router.get('/', async (req, res) => {
        try {
            const items = await LostItem.findAll({
                order: [['createdAt', 'DESC']],
                limit: req.query.limit ? parseInt(req.query.limit) : null
            });
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Search lost items
    router.get('/search', async (req, res) => {
        try {
            const { q, category, location, page = 1, limit = 9 } = req.query;
            const where = {};
            const { Op } = require('sequelize');
            
            if (q) {
                where[Op.or] = [
                    { item_name: { [Op.like]: `%${q}%` } },
                    { description: { [Op.like]: `%${q}%` } }
                ];
            }
            if (category) where.category = category;
            if (location) where.location_lost = location;
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            const { count, rows } = await LostItem.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
                order: [['createdAt', 'DESC']]
            });
            
            res.json({
                items: rows,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Get single lost item
    router.get('/:id', async (req, res) => {
        try {
            const item = await LostItem.findByPk(req.params.id);
            if (!item) return res.status(404).json({ error: 'Item not found' });
            res.json(item);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Report lost item
    router.post('/', upload.single('image'), async (req, res) => {
        try {
            const itemData = {
                item_name: req.body.item_name,
                category: req.body.category,
                description: req.body.description,
                date_lost: req.body.date_lost,
                location_lost: req.body.location_lost,
                contact_name: req.body.contact_name,
                contact_email: req.body.contact_email,
                contact_phone: req.body.contact_phone,
                image_path: req.file ? `/uploads/${req.file.filename}` : null,
                status: 'lost'
            };
            
            const item = await LostItem.create(itemData);
            res.status(201).json({ message: 'Item reported successfully', id: item.id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Mark as returned
    router.put('/:id/return', async (req, res) => {
        try {
            await LostItem.update(
                { status: 'returned' },
                { where: { id: req.params.id } }
            );
            res.json({ message: 'Item marked as returned' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Delete item
    router.delete('/:id', async (req, res) => {
        try {
            await LostItem.destroy({ where: { id: req.params.id } });
            res.json({ message: 'Item deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    return router;
};