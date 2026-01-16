import express from 'express';
import Notification from '../models/Notification.js';
import { verifyToken, verifyTokenOptional } from '../middleware/auth.js';

const router = express.Router();

// Get notifications for user or global
router.get('/', verifyTokenOptional, async (req, res) => {
    try {
        // Get global notifications OR notifications for this specific user
        let query = { userId: null };
        if (req.user) {
            query = {
                $or: [
                    { userId: null },
                    { userId: req.user.id }
                ]
            };
        }

        const notifications = await Notification.find(query).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create notification
router.post('/', verifyToken, async (req, res) => {
    try {
        const newNotification = new Notification(req.body);
        const savedNotification = await newNotification.save();
        res.status(201).json(savedNotification);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete notification
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
})

export default router;
