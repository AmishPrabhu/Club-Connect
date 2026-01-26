import express from 'express';
import Club from '../models/Club.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import ClubMember from '../models/ClubMember.js';
import ClubMessage from '../models/ClubMessage.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import { sendClubInvitationEmail } from '../services/emailService.js';

const router = express.Router();

// Get all clubs
router.get('/', async (req, res) => {
    try {
        const clubs = await Club.find().sort({ name: 1 });
        // Return clubs with default category if missing
        const clubsWithCategory = clubs.map(club => {
            const clubObj = club.toObject();
            return {
                ...clubObj,
                category: clubObj.category || 'technical'
            };
        });
        res.json(clubsWithCategory);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single club
router.get('/:id', async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });
        res.json(club);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create club (Protected)
router.post('/', verifyToken, async (req, res) => {
    try {
        const newClub = new Club(req.body);
        const savedClub = await newClub.save();
        res.status(201).json(savedClub);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update club (Protected)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const updatedClub = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedClub) return res.status(404).json({ message: 'Club not found' });
        res.json(updatedClub);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete club (Protected)
// Delete club (Protected)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        // 1. Demote Officers (Secretary, President, Treasurer, Advisor)
        const officerIds = [
            club.secretaryId,
            club.presidentId,
            club.treasurerId,
            club.advisorId
        ].filter(id => id); // Filter out null/undefined

        if (officerIds.length > 0) {
            await User.updateMany(
                { _id: { $in: officerIds } },
                {
                    $set: {
                        role: 'user',
                        clubId: null,
                        clubName: null
                    }
                }
            );
        }

        // 2. Delete related data
        await Promise.all([
            Post.deleteMany({ clubId: req.params.id }),
            ClubMember.deleteMany({ clubId: req.params.id }),
            ClubMessage.deleteMany({ clubId: req.params.id })
        ]);

        // 3. Delete the club
        await Club.findByIdAndDelete(req.params.id);

        res.json({ message: 'Club and associated data deleted' });
    } catch (error) {
        console.error('Delete club error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});




// ... existing routes ...

// ==================== MEMBER ROUTES ====================

// GET members for a club
router.get('/:id/members', async (req, res) => {
    try {
        const members = await ClubMember.find({ clubId: req.params.id }).sort({ name: 1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add member to club
router.post('/:id/members', verifyToken, async (req, res) => {
    try {
        const { name, email, role, userId, boardType, academicYear, joinedAt } = req.body;
        const clubId = req.params.id;

        const existing = await ClubMember.findOne({ clubId, email });
        if (existing) {
            return res.status(400).json({ message: 'Member already exists in this club' });
        }

        const newMember = new ClubMember({
            clubId,
            name,
            email,
            role: role || 'Member',
            boardType: boardType || 'member',
            userId: userId || null,
            academicYear: academicYear || '',
            joinedAt: joinedAt || Date.now()
        });

        await newMember.save();

        // Check if user exists and auto-assign club-member role
        let existingUser = null;
        if (userId) {
            existingUser = await User.findById(userId);
            if (existingUser && existingUser.role === 'user') {
                existingUser.role = 'club-member';
                await existingUser.save();
            }
        } else if (email) {
            existingUser = await User.findOne({ email });
            if (existingUser && existingUser.role === 'user') {
                existingUser.role = 'club-member';
                await existingUser.save();
            }
        }

        // Send invitation email if user doesn't exist (fire-and-forget, don't block API response)


        if (!existingUser) {

            // Fire-and-forget: don't await, let it run in background
            (async () => {
                try {
                    const club = await Club.findById(clubId);
                    const signUpUrl = `${process.env.FRONTEND_URL}?page=signUp&email=${encodeURIComponent(email)}`;


                    const result = await sendClubInvitationEmail({
                        name,
                        email,
                        role: role || 'Member',
                        clubName: club?.name || 'a club',
                        signUpUrl
                    });

                    if (result.success) {
                        // Email sent
                    } else {
                        console.error('❌ Failed to send invitation email:', result.error);
                    }
                } catch (emailError) {
                    console.error('❌ Error sending invitation email:', emailError);
                }
            })();
        } else {
            // User already exists
        }

        // Update member count in Club
        const count = await ClubMember.countDocuments({ clubId });
        await Club.findByIdAndUpdate(clubId, { members: count });

        res.status(201).json(newMember);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update member
router.put('/:id/members/:memberId', verifyToken, async (req, res) => {
    try {
        const { name, email, role, academicYear, joinedAt, boardType } = req.body;
        // Basic validation/permission check could go here

        const updateData = { name, email, role };
        if (academicYear !== undefined) updateData.academicYear = academicYear;
        if (joinedAt !== undefined) updateData.joinedAt = joinedAt;
        if (boardType !== undefined) updateData.boardType = boardType;

        const updatedMember = await ClubMember.findByIdAndUpdate(
            req.params.memberId,
            updateData,
            { new: true }
        );
        res.json(updatedMember);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remove member
router.delete('/:id/members/:memberId', verifyToken, async (req, res) => {
    try {
        const memberToDelete = await ClubMember.findById(req.params.memberId);
        if (!memberToDelete) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const memberEmail = memberToDelete.email;
        await ClubMember.findByIdAndDelete(req.params.memberId);

        // Auto-downgrade role if user is no longer in any clubs
        const user = await User.findOne({ email: memberEmail });
        if (user && user.role === 'club-member') {
            // Check if user is still in any other clubs
            const otherMemberships = await ClubMember.countDocuments({ email: memberEmail });

            if (otherMemberships === 0) {
                // No longer in any clubs, downgrade to 'user'
                user.role = 'user';
                await user.save();
            }
        }

        // Update member count
        const count = await ClubMember.countDocuments({ clubId: req.params.id });
        await Club.findByIdAndUpdate(req.params.id, { members: count });

        res.json({ message: 'Member removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




// ... existing routes ...

// ==================== MESSAGE ROUTES ====================

// GET messages for a club
router.get('/:id/messages', verifyToken, async (req, res) => {
    try {
        const messages = await ClubMessage.find({ clubId: req.params.id }).sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create club message
router.post('/:id/messages', verifyToken, async (req, res) => {
    try {
        const { title, body, senderId, senderName, senderRole, clubName } = req.body;
        const clubId = req.params.id;

        const newMessage = new ClubMessage({
            clubId,
            clubName,
            senderId,
            senderName,
            senderRole,
            title,
            body,
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
