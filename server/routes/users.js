import express from 'express';
import User from '../models/User.js';
import Club from '../models/Club.js';
import ClubMember from '../models/ClubMember.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get my club memberships
router.get('/memberships', verifyToken, async (req, res) => {
    try {
        const memberships = await ClubMember.find({
            $or: [
                { userId: req.user.id },
                { email: req.user.email }
            ]
        });

        const fullMemberships = await Promise.all(memberships.map(async (m) => {
            const club = await Club.findById(m.clubId);
            if (!club) return null;

            return {
                clubId: club._id,
                clubName: club.name,
                clubImage: club.image,
                clubIcon: '🏛️',
                role: m.role,
                joinedAt: m.joinedAt,

                // Add styling props that frontend might expect
                clubColor: 'from-blue-500 to-cyan-500', // Default or fetch from club if exists
            };
        }));

        res.json(fullMemberships.filter(m => m));
    } catch (error) {
        console.error('Error fetching memberships:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


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

// Like a club
router.post('/:id/like/:clubId', verifyToken, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(req.params.id);
        if (!user.likedClubs.includes(req.params.clubId)) {
            user.likedClubs.push(req.params.clubId);
            await user.save();
        }
        res.json(user.likedClubs);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Unlike a club
router.delete('/:id/like/:clubId', verifyToken, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(req.params.id);
        user.likedClubs = user.likedClubs.filter(id => id !== req.params.clubId);
        await user.save();

        res.json(user.likedClubs);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
