const express = require('express');
const router = express.Router();

module.exports = (FoundItem, upload) => {
    
    router.get('/', async (req, res) => {
        try {
            const items = await FoundItem.findAll({
                order: [['createdAt', 'DESC']],
                limit: req.query.limit ? parseInt(req.query.limit) : null
            });
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
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
            if (location) where.location_found = location;
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            const { count, rows } = await FoundItem.findAndCountAll({
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
    
    router.get('/:id', async (req, res) => {
        try {
            const item = await FoundItem.findByPk(req.params.id);
            if (!item) return res.status(404).json({ error: 'Item not found' });
            res.json(item);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    router.post('/', upload.single('image'), async (req, res) => {
        try {
            const itemData = {
                item_name: req.body.item_name,
                category: req.body.category,
                description: req.body.description,
                date_found: req.body.date_found,
                location_found: req.body.location_found,
                finder_name: req.body.finder_name,
                finder_email: req.body.finder_email,
                finder_phone: req.body.finder_phone,
                handed_to_security: req.body.handed_to_security === 'on',
                image_path: req.file ? `/uploads/${req.file.filename}` : null,
                status: 'found'
            };
            
            const item = await FoundItem.create(itemData);
            res.status(201).json({ message: 'Item reported successfully', id: item.id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    router.put('/:id/return', async (req, res) => {
        try {
            await FoundItem.update(
                { status: 'returned' },
                { where: { id: req.params.id } }
            );
            res.json({ message: 'Item marked as returned' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    router.delete('/:id', async (req, res) => {
        try {
            await FoundItem.destroy({ where: { id: req.params.id } });
            res.json({ message: 'Item deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    return router;
};