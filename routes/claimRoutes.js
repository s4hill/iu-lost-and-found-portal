const express = require('express');
const router = express.Router();

module.exports = (Claim, LostItem, FoundItem) => {
    
    router.get('/', async (req, res) => {
        try {
            const claims = await Claim.findAll({
                order: [['createdAt', 'DESC']]
            });
            res.json(claims);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    router.post('/', async (req, res) => {
        try {
            const claimData = {
                item_id: req.body.item_id,
                item_type: req.body.item_type,
                claimant_name: req.body.claimant_name,
                claimant_email: req.body.claimant_email,
                claimant_phone: req.body.claimant_phone,
                proof_description: req.body.proof_description,
                status: 'pending'
            };
            
            const claim = await Claim.create(claimData);
            res.status(201).json({ message: 'Claim submitted successfully', id: claim.id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    router.put('/:id/approve', async (req, res) => {
        try {
            const claim = await Claim.findByPk(req.params.id);
            if (!claim) return res.status(404).json({ error: 'Claim not found' });
            
            claim.status = 'approved';
            await claim.save();
            
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
            res.status(500).json({ error: error.message });
        }
    });
    
    router.put('/:id/reject', async (req, res) => {
        try {
            const claim = await Claim.findByPk(req.params.id);
            if (!claim) return res.status(404).json({ error: 'Claim not found' });
            
            claim.status = 'rejected';
            await claim.save();
            
            res.json({ message: 'Claim rejected successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    return router;
};