const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { sequelize, LostItem, FoundItem, Claim, Admin } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Session
app.use(session({
    secret: 'invertis-secret-key-2024',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public/uploads');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// ============ API ROUTES ============

// Statistics
app.get('/api/stats', async (req, res) => {
    try {
        const lostCount = await LostItem.count();
        const foundCount = await FoundItem.count();
        const returnedLost = await LostItem.count({ where: { status: 'returned' } });
        const returnedFound = await FoundItem.count({ where: { status: 'returned' } });
        const pendingClaims = await Claim.count({ where: { status: 'pending' } });
        
        res.json({
            lostItems: lostCount || 0,
            foundItems: foundCount || 0,
            returnedItems: (returnedLost + returnedFound) || 0,
            pendingClaims: pendingClaims || 0
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ LOST ITEMS ROUTES ============

// Get all lost items
app.get('/api/lost', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const options = {
            order: [['createdAt', 'DESC']]
        };
        if (limit) options.limit = limit;
        
        const items = await LostItem.findAll(options);
        res.json(items);
    } catch (error) {
        console.error('Lost items error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Search lost items - FIXED
app.get('/api/lost/search', async (req, res) => {
    try {
        const { q, category, location, page = 1, limit = 9 } = req.query;
        const where = {};
        const { Op } = require('sequelize');
        
        console.log('Lost search query:', { q, category, location, page, limit });
        
        if (q && q.trim() !== '') {
            where[Op.or] = [
                { item_name: { [Op.like]: `%${q}%` } },
                { description: { [Op.like]: `%${q}%` } }
            ];
        }
        if (category && category !== '') where.category = category;
        if (location && location !== '') where.location_lost = location;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { count, rows } = await LostItem.findAndCountAll({
            where: Object.keys(where).length > 0 ? where : {},
            limit: parseInt(limit),
            offset,
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            items: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (error) {
        console.error('Lost search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single lost item
app.get('/api/lost/:id', async (req, res) => {
    try {
        const item = await LostItem.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Report lost item
app.post('/api/lost', upload.single('image'), async (req, res) => {
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
        console.error('Create error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark lost item as returned
app.put('/api/lost/:id/return', async (req, res) => {
    try {
        const result = await LostItem.update(
            { status: 'returned' },
            { where: { id: req.params.id } }
        );
        
        if (result[0] === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ message: 'Item marked as returned' });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete lost item
app.delete('/api/lost/:id', async (req, res) => {
    try {
        const result = await LostItem.destroy({ where: { id: req.params.id } });
        
        if (result === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ FOUND ITEMS ROUTES ============

// Get all found items
app.get('/api/found', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const options = {
            order: [['createdAt', 'DESC']]
        };
        if (limit) options.limit = limit;
        
        const items = await FoundItem.findAll(options);
        res.json(items);
    } catch (error) {
        console.error('Found items error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Search found items - FIXED
app.get('/api/found/search', async (req, res) => {
    try {
        const { q, category, location, page = 1, limit = 9 } = req.query;
        const where = {};
        const { Op } = require('sequelize');
        
        console.log('Found search query:', { q, category, location, page, limit });
        
        if (q && q.trim() !== '') {
            where[Op.or] = [
                { item_name: { [Op.like]: `%${q}%` } },
                { description: { [Op.like]: `%${q}%` } }
            ];
        }
        if (category && category !== '') where.category = category;
        if (location && location !== '') where.location_found = location;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { count, rows } = await FoundItem.findAndCountAll({
            where: Object.keys(where).length > 0 ? where : {},
            limit: parseInt(limit),
            offset,
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            items: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (error) {
        console.error('Found search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single found item
app.get('/api/found/:id', async (req, res) => {
    try {
        const item = await FoundItem.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Report found item
app.post('/api/found', upload.single('image'), async (req, res) => {
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
        console.error('Create error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark found item as returned
app.put('/api/found/:id/return', async (req, res) => {
    try {
        const result = await FoundItem.update(
            { status: 'returned' },
            { where: { id: req.params.id } }
        );
        
        if (result[0] === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ message: 'Item marked as returned' });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete found item
app.delete('/api/found/:id', async (req, res) => {
    try {
        const result = await FoundItem.destroy({ where: { id: req.params.id } });
        
        if (result === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve item detail page
app.get('/item', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'item.html'));
});

// ============ CLAIMS ROUTES - FIXED ============

// Get all claims
app.get('/api/claims', async (req, res) => {
    try {
        const claims = await Claim.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(claims);
    } catch (error) {
        console.error('Claims error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit a claim - FIXED with validation and error handling
app.post('/api/claims', async (req, res) => {
    try {
        console.log('📝 Claim received:', req.body);
        
        const { 
            item_id, 
            item_type, 
            claimant_name, 
            claimant_email, 
            claimant_phone, 
            proof_description 
        } = req.body;
        
        // Validation
        if (!item_id) {
            return res.status(400).json({ error: 'Item ID is required' });
        }
        if (!item_type || !['lost', 'found'].includes(item_type)) {
            return res.status(400).json({ error: 'Valid item type (lost/found) is required' });
        }
        if (!claimant_name || claimant_name.trim() === '') {
            return res.status(400).json({ error: 'Claimant name is required' });
        }
        if (!claimant_email || !claimant_email.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required' });
        }
        
        // Check if item exists
        let itemExists = false;
        if (item_type === 'lost') {
            const item = await LostItem.findByPk(item_id);
            itemExists = !!item;
        } else {
            const item = await FoundItem.findByPk(item_id);
            itemExists = !!item;
        }
        
        if (!itemExists) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        // Check for existing pending claim
        const existingClaim = await Claim.findOne({
            where: {
                item_id: parseInt(item_id),
                item_type: item_type,
                status: 'pending'
            }
        });
        
        if (existingClaim) {
            return res.status(400).json({ error: 'A pending claim already exists for this item' });
        }
        
        // Create claim with proper data types
        const claimData = {
            item_id: parseInt(item_id),
            item_type: item_type,
            claimant_name: claimant_name.trim(),
            claimant_email: claimant_email.trim().toLowerCase(),
            claimant_phone: claimant_phone ? claimant_phone.trim() : null,
            proof_description: proof_description ? proof_description.trim() : null,
            status: 'pending'
        };
        
        console.log('Creating claim with data:', claimData);
        
        const claim = await Claim.create(claimData);
        
        console.log('✅ Claim created successfully with ID:', claim.id);
        
        res.status(201).json({ 
            success: true,
            message: 'Claim submitted successfully!', 
            id: claim.id 
        });
        
    } catch (error) {
        console.error('❌ Claim creation error:', error);
        
        // Handle validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.errors.map(e => e.message) 
            });
        }
        
        // Handle unique constraint errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                error: 'A claim for this item already exists' 
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to submit claim. Please try again.',
            message: error.message 
        });
    }
});

// Approve claim
app.put('/api/claims/:id/approve', async (req, res) => {
    try {
        const claim = await Claim.findByPk(req.params.id);
        if (!claim) {
            return res.status(404).json({ error: 'Claim not found' });
        }
        
        claim.status = 'approved';
        await claim.save();
        
        // Update the item status to 'claimed'
        if (claim.item_type === 'lost') {
            await LostItem.update(
                { status: 'claimed' },
                { where: { id: claim.item_id } }
            );
        } else {
            await FoundItem.update(
                { status: 'claimed' },
                { where: { id: claim.item_id } }
            );
        }
        
        res.json({ message: 'Claim approved successfully' });
    } catch (error) {
        console.error('Approve error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reject claim
app.put('/api/claims/:id/reject', async (req, res) => {
    try {
        const claim = await Claim.findByPk(req.params.id);
        if (!claim) {
            return res.status(404).json({ error: 'Claim not found' });
        }
        
        claim.status = 'rejected';
        await claim.save();
        
        res.json({ message: 'Claim rejected successfully' });
    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ ADMIN ROUTES ============

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ where: { username } });
        
        if (admin && bcrypt.compareSync(password, admin.password)) {
            req.session.adminId = admin.id;
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out' });
});

// Check admin session
app.get('/api/admin/check', (req, res) => {
    res.json({ loggedIn: !!req.session.adminId });
});

// ============ SERVE HTML FILES ============
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/lost', (req, res) => res.sendFile(path.join(__dirname, 'public', 'lost.html')));
app.get('/found', (req, res) => res.sendFile(path.join(__dirname, 'public', 'found.html')));
app.get('/report-lost', (req, res) => res.sendFile(path.join(__dirname, 'public', 'report-lost.html')));
app.get('/report-found', (req, res) => res.sendFile(path.join(__dirname, 'public', 'report-found.html')));
app.get('/claim', (req, res) => res.sendFile(path.join(__dirname, 'public', 'claim.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 SQLite database: database.sqlite`);
    console.log(`👤 Admin login: admin / admin123`);
});