import express from 'express';
import Post from '../models/Post.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();


import EventRSVP from '../models/EventRSVP.js';

// Get user RSVPs by email (for viewing registered events and certificates)
// Moved to top to avoid shadowing by /:id/rsvps
router.get('/user/rsvps', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Fetch all RSVPs matching user email (including self-registered 'rsvp' source)
        const rsvps = await EventRSVP.find({
            email: { $regex: new RegExp(`^${userEmail}$`, 'i') }
        }).sort({ rsvpedAt: -1 });

        res.json(rsvps);
    } catch (error) {
        console.error('Error fetching user RSVPs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

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
            source: 'rsvp', // Self-RSVP
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
        const { name, email, source } = req.body;
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
            attendance: 'pending',
            source: source || 'manual', // Use provided source or default to manual
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

// GET tasks assigned to current user
router.get('/user/tasks', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Find posts that have tasks assigned to this user email
        const posts = await Post.find({
            'eventTasks.assignedToEmails': userEmail
        });

        // Extract and flatten tasks
        const userTasks = [];
        posts.forEach(post => {
            if (post.eventTasks && post.eventTasks.length > 0) {
                post.eventTasks.forEach(task => {
                    if (task.assignedToEmails && task.assignedToEmails.includes(userEmail)) {
                        userTasks.push({
                            ...task.toObject(),
                            eventId: post._id,
                            eventTitle: post.title,
                            clubId: post.clubId,
                            clubName: post.clubName
                        });
                    }
                });
            }
        });

        // Sort by deadline (ascending) or creation (descending)
        userTasks.sort((a, b) => {
            if (a.deadline && b.deadline) {
                return new Date(a.deadline) - new Date(b.deadline);
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json(userTasks);
    } catch (error) {
        console.error('Error fetching user tasks:', error);
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

// Upload/Update budget image (Treasurer only)
router.put('/:id/budget', verifyToken, async (req, res) => {
    try {
        // Check if user is treasurer
        if (req.user.role !== 'treasurer') {
            return res.status(403).json({ message: 'Only treasurers can upload budgets' });
        }

        const { budgetImage } = req.body;
        if (!budgetImage) {
            return res.status(400).json({ message: 'Budget image URL is required' });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            {
                budgetImage,
                budgetVerified: false, // Reset verification when budget is updated
                budgetVerifiedBy: null,
                budgetVerifiedAt: null,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(updatedPost);
    } catch (error) {
        console.error('Error uploading budget:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify budget (Advisor only)
router.put('/:id/budget/verify', verifyToken, async (req, res) => {
    try {
        // Check if user is advisor
        if (req.user.role !== 'advisor') {
            return res.status(403).json({ message: 'Only advisors can verify budgets' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (!post.budgetImage) {
            return res.status(400).json({ message: 'No budget uploaded for this event' });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            {
                budgetVerified: true,
                budgetVerifiedBy: req.user.id,
                budgetVerifiedAt: new Date(),
                updatedAt: new Date()
            },
            { new: true }
        );

        res.json(updatedPost);
    } catch (error) {
        console.error('Error verifying budget:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== CERTIFICATE ROUTES ====================

// Save certificate template configuration (President/Secretary only)
router.put('/:id/certificate-template', verifyToken, async (req, res) => {
    try {
        const userRole = req.user.role;
        if (!['admin', 'club-secretary', 'president', 'secretary'].includes(userRole)) {
            return res.status(403).json({ message: 'Only presidents and secretaries can manage certificates' });
        }

        const { templateUrl, namePosition } = req.body;
        if (!templateUrl) {
            return res.status(400).json({ message: 'Template URL is required' });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            {
                certificateTemplate: {
                    templateUrl,
                    namePosition: namePosition || {
                        x: 50,
                        y: 50,
                        fontSize: 48,
                        fontFamily: 'Arial',
                        color: '#000000'
                    }
                },
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(updatedPost);
    } catch (error) {
        console.error('Error saving certificate template:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update participant certificate URL (President/Secretary only)
router.patch('/:id/rsvps/:rsvpId/certificate', verifyToken, async (req, res) => {
    try {
        const userRole = req.user.role;
        if (!['admin', 'club-secretary', 'president', 'secretary'].includes(userRole)) {
            return res.status(403).json({ message: 'Only presidents and secretaries can update certificates' });
        }

        const { certificateUrl } = req.body;
        if (!certificateUrl) {
            return res.status(400).json({ message: 'Certificate URL is required' });
        }

        const rsvp = await EventRSVP.findByIdAndUpdate(
            req.params.rsvpId,
            { certificateUrl },
            { new: true }
        );

        if (!rsvp) {
            return res.status(404).json({ message: 'RSVP not found' });
        }

        res.json(rsvp);
    } catch (error) {
        console.error('Error updating certificate:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



export default router;
