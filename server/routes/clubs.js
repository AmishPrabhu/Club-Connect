import express from 'express';
import mongoose from 'mongoose';
import Club from '../models/Club.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import ClubMember from '../models/ClubMember.js';
import ClubMessage from '../models/ClubMessage.js';
import { verifyToken, verifySuperAdmin, verifyClubOfficer, verifyClubMember } from '../middleware/auth.js';
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
        let club;

        if (mongoose.isValidObjectId(req.params.id)) {
            club = await Club.findById(req.params.id);
        }

        if (!club) {
            club = await Club.findOne({ slug: req.params.id });
        }

        if (!club) return res.status(404).json({ message: 'Club not found' });
        res.json(club);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create club (Protected - Super Admin Only)
router.post('/', verifySuperAdmin, async (req, res) => {
    try {
        const newClub = new Club(req.body);
        const savedClub = await newClub.save();

        // === AUTO-CREATE ClubMember records for officers ===
        // This ensures officers can perform actions immediately after club creation
        const officerRoles = [
            { email: req.body.secretaryEmail, role: 'Secretary', name: req.body.secretaryName },
            { email: req.body.presidentEmail, role: 'President', name: req.body.presidentName },
            { email: req.body.treasurerEmail, role: 'Treasurer', name: req.body.treasurerName },
            { email: req.body.advisorEmail, role: 'Advisor', name: req.body.advisorName },
        ];

        for (const officer of officerRoles) {
            if (officer.email) {
                // Check if already exists (avoid duplicates)
                const existing = await ClubMember.findOne({
                    clubId: savedClub._id.toString(),
                    email: officer.email
                });

                if (!existing) {
                    // Find if user already has an account to link userId
                    const existingUser = await User.findOne({
                        email: { $regex: new RegExp(`^${officer.email}$`, 'i') }
                    });

                    await ClubMember.create({
                        clubId: savedClub._id.toString(),
                        name: officer.name || officer.role,
                        email: officer.email,
                        role: officer.role,
                        boardType: 'main',
                        userId: existingUser?._id?.toString() || null,
                        joinedAt: new Date()
                    });
                    console.log(`[Club Create] Added ${officer.role}: ${officer.email} to ClubMember`);
                }
            }
        }

        // Update member count
        const count = await ClubMember.countDocuments({ clubId: savedClub._id.toString() });
        if (count > 0) {
            await Club.findByIdAndUpdate(savedClub._id, { members: count });
        }

        res.status(201).json(savedClub);
    } catch (error) {
        console.error('Create club error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update club (Protected - Club Officer or Super Admin)
router.put('/:id', verifyClubOfficer, async (req, res) => {
    try {
        // Allowed fields depend on role
        // For admin, also allow officer email/id updates
        const baseUpdates = ['name', 'description', 'image', 'category'];
        const adminUpdates = ['secretaryEmail', 'presidentEmail', 'treasurerEmail', 'advisorEmail',
            'secretaryId', 'presidentId', 'treasurerId', 'advisorId', 'advisorName'];

        const allowedUpdates = req.user.role === 'admin'
            ? [...baseUpdates, ...adminUpdates]
            : baseUpdates;

        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        updates.updatedAt = Date.now();

        const updatedClub = await Club.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!updatedClub) return res.status(404).json({ message: 'Club not found' });

        // === AUTO-CREATE ClubMember records when officer emails are updated ===
        const officerMappings = [
            { emailField: 'secretaryEmail', role: 'Secretary' },
            { emailField: 'presidentEmail', role: 'President' },
            { emailField: 'treasurerEmail', role: 'Treasurer' },
            { emailField: 'advisorEmail', role: 'Advisor' },
        ];

        for (const mapping of officerMappings) {
            const email = req.body[mapping.emailField];
            if (email) {
                // Check if ClubMember entry exists
                const existing = await ClubMember.findOne({
                    clubId: req.params.id,
                    email: { $regex: new RegExp(`^${email}$`, 'i') }
                });

                if (!existing) {
                    // Find if user has an account to link userId
                    const existingUser = await User.findOne({
                        email: { $regex: new RegExp(`^${email}$`, 'i') }
                    });

                    await ClubMember.create({
                        clubId: req.params.id,
                        name: mapping.role,
                        email: email,
                        role: mapping.role,
                        boardType: 'main',
                        userId: existingUser?._id?.toString() || null,
                        joinedAt: new Date()
                    });
                    console.log(`[Club Update] Auto-created ${mapping.role} ClubMember for ${email}`);
                } else if (existing.role !== mapping.role) {
                    // Update role if officer was already a member
                    existing.role = mapping.role;
                    existing.boardType = 'main';
                    await existing.save();
                    console.log(`[Club Update] Updated role for ${email} to ${mapping.role}`);
                }
            }
        }

        res.json(updatedClub);
    } catch (error) {
        console.error('Update club error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete club (Protected - Super Admin Only - was Officer)
router.delete('/:id', verifySuperAdmin, async (req, res) => {
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
        const members = await ClubMember.find({ clubId: req.params.id }).sort({ name: 1 }).lean();

        // Fetch latest profile info from User collection to ensure avatar is up to date
        // Logic: 1. Try userId 2. Try email (case insensitive)
        const enhancedMembers = await Promise.all(members.map(async (member) => {
            let user = null;

            if (member.userId) {
                user = await User.findById(member.userId).select('profileImage');
            }

            if (!user && member.email) {
                user = await User.findOne({
                    email: { $regex: new RegExp(`^${member.email}$`, 'i') }
                }).select('profileImage');
            }

            return {
                ...member,
                profileImage: user?.profileImage || member.profileImage || ''
            };
        }));

        res.json(enhancedMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add member to club (Protected - Club Officer)
router.post('/:id/members', verifyClubOfficer, async (req, res) => {
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

// Update member (Protected - Club Officer)
router.put('/:id/members/:memberId', verifyClubOfficer, async (req, res) => {
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

// Remove member (Protected - Club Officer)
router.delete('/:id/members/:memberId', verifyClubOfficer, async (req, res) => {
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

// GET messages for a club (Protected - Club Member Only)
router.get('/:id/messages', verifyClubMember, async (req, res) => {
    try {
        const messages = await ClubMessage.find({ clubId: req.params.id }).sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create club message
router.post('/:id/messages', verifyClubOfficer, async (req, res) => {
    try {
        const { title, body } = req.body;
        const clubId = req.params.id;
        const userId = req.user.id;

        let officerRole = null;

        if (req.user.role === 'admin') {
            officerRole = 'Admin';
        } else {
            const member = await ClubMember.findOne({
                clubId,
                userId,
                role: { $in: ['Secretary', 'President', 'Treasurer', 'Advisor'] }
            });
            officerRole = member.role;
        }

        // Fetch club name for the message record
        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        const newMessage = new ClubMessage({
            clubId,
            clubName: club.name,
            senderId: userId,
            senderName: req.user.name || 'Club Officer', // Fallback if name missing in token/user
            senderRole: officerRole,
            title,
            body,
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
