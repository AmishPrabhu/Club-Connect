import express from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();


// Get total student stats
router.get('/stats/count', async (req, res) => {
    try {
        const count = await User.countDocuments({ role: 'student' }); // Or just all users if 'student' role isn't strict yet
        // Fallback to all users if student role specific logic isn't populated
        const total = await User.countDocuments();
        res.json({ count: total });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/:id', verifyToken, async (req, res) => {

    try {
        const { name, bio, email, clubId, clubName } = req.body;
        // Prevent role update here for security, unless admin
        const updates = { name, bio, email };

        // Allow updating club association
        if (clubId !== undefined) updates.clubId = clubId;
        if (clubName !== undefined) updates.clubName = clubName;

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
