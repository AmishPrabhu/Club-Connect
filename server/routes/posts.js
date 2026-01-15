import express from 'express';
import Post from '../models/Post.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();


import EventRSVP from '../models/EventRSVP.js';

// GET all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: 1 }); // Sort by date ascending
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET specific post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Also fetch RSVP count
        const rsvpCount = await EventRSVP.countDocuments({ eventId: req.params.id });
        const postObj = post.toObject();
        postObj.rsvps = rsvpCount;

        res.json(postObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== RSVP ROUTES ====================

// GET RSVPs for an event
router.get('/:id/rsvps', verifyToken, async (req, res) => {
    try {
        const rsvps = await EventRSVP.find({ eventId: req.params.id }).sort({ rsvpedAt: -1 });
        res.json(rsvps);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create RSVP
router.post('/:id/rsvp', async (req, res) => {
    try {
        const { name, email, userId } = req.body;
        const eventId = req.params.id;

        // Check for duplicate
        const existing = await EventRSVP.findOne({ eventId, email });
        if (existing) {
            return res.status(400).json({ message: 'You have already RSVPed to this event.' });
        }

        const newRSVP = new EventRSVP({
            eventId,
            name,
            email,
            userId: userId || null, // Optional
        });

        await newRSVP.save();

        // Update post rsvp count (optional optimization, but good for list views)
        // logic moved to get request or maintained here. 
        // For simple sync, let's just update the Post doc if we want to cache it, 
        // but Post model doesn't strictly persist it. The frontend interface expects it on Post.
        const rsvpCount = await EventRSVP.countDocuments({ eventId });
        await Post.findByIdAndUpdate(eventId, { rsvps: rsvpCount });

        res.status(201).json(newRSVP);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Participant Attendance (Secretary/Admin only)
router.patch('/:id/rsvps/:rsvpId', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['present', 'absent'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const rsvp = await EventRSVP.findByIdAndUpdate(
            req.params.rsvpId,
            { attendance: status },
            { new: true }
        );
        res.json(rsvp);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Participant (Secretary/Admin only)
router.delete('/:id/rsvps/:rsvpId', verifyToken, async (req, res) => {
    try {
        await EventRSVP.findByIdAndDelete(req.params.rsvpId);

        // Update count
        const rsvpCount = await EventRSVP.countDocuments({ eventId: req.params.id });
        await Post.findByIdAndUpdate(req.params.id, { rsvps: rsvpCount });

        res.json({ message: 'Participant removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add Manual Participant (Secretary/Admin only)
router.post('/:id/rsvps/add', verifyToken, async (req, res) => {
    try {
        const { name, email } = req.body;
        const eventId = req.params.id;

        // Check for duplicate
        const existing = await EventRSVP.findOne({ eventId, email });
        if (existing) {
            return res.status(400).json({ message: 'Participant with this email already exists.' });
        }

        const newRSVP = new EventRSVP({
            eventId,
            name,
            email,
            attendance: 'pending' // Default manual add is pending or present? Let's say pending.
        });

        await newRSVP.save();

        const rsvpCount = await EventRSVP.countDocuments({ eventId });
        await Post.findByIdAndUpdate(eventId, { rsvps: rsvpCount });

        res.status(201).json(newRSVP);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Create post (Protected)
router.post('/', verifyToken, async (req, res) => {
    try {
        const newPost = new Post(req.body);
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        console.error("Error creating post", error)
        res.status(500).json({ message: 'Server error' });
    }
});

// Update post
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
})


import Notification from '../models/Notification.js';

// Delete post (Protected)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        // Delete associated notifications
        await Notification.deleteMany({ relatedId: req.params.id });

        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
