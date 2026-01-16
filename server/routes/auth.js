import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ClubMember from '../models/ClubMember.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            role: 'user', // Force user role to prevent privilege escalation
        });

        await newUser.save();

        // Link any existing club memberships to this new user
        // We use a case-insensitive regex to match email since ClubMember might not match exact case
        await ClubMember.updateMany(
            { email: { $regex: new RegExp(`^${email}$`, 'i') } },
            { $set: { userId: newUser._id } }
        );

        // Create token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_In_production',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                likedClubs: newUser.likedClubs || [],
            },
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;



        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check for officer memberships if role is 'user'
        let effectiveRole = user.role;
        let effectiveClubId = user.clubId;
        let effectiveClubName = user.clubName;

        if (effectiveRole === 'user') {
            const officerMembership = await ClubMember.findOne({
                $or: [{ userId: user._id }, { email: user.email }],
                role: { $in: ['Secretary', 'President', 'Treasurer', 'Advisor'] }
            });

            if (officerMembership) {
                const roleMap = {
                    'Secretary': 'club-secretary',
                    'President': 'president',
                    'Treasurer': 'treasurer',
                    'Advisor': 'advisor'
                };
                effectiveRole = roleMap[officerMembership.role] || 'club-secretary';

                if (!effectiveClubId) {
                    effectiveClubId = officerMembership.clubId;
                }
            }
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: effectiveRole },
            process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_In_production',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: effectiveRole,
                clubId: effectiveClubId,
                clubName: effectiveClubName,
                likedClubs: user.likedClubs || [],
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Current User (Me)
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let effectiveRole = user.role;
        let effectiveClubId = user.clubId;
        let effectiveClubName = user.clubName;

        // If role is 'user', check if they have any officer memberships
        // this handles cases where admin created them as 'user' but assigned officer role
        if (effectiveRole === 'user') {
            const officerMembership = await ClubMember.findOne({
                $or: [{ userId: user._id }, { email: user.email }],
                role: { $in: ['Secretary', 'President', 'Treasurer', 'Advisor'] }
            });

            if (officerMembership) {
                // Map ClubMember role to User role
                const roleMap = {
                    'Secretary': 'club-secretary',
                    'President': 'president',
                    'Treasurer': 'treasurer',
                    'Advisor': 'advisor'
                };
                effectiveRole = roleMap[officerMembership.role] || 'club-secretary';

                // Also provide a default club context if missing
                if (!effectiveClubId) {
                    effectiveClubId = officerMembership.clubId;
                    // We don't have clubName here without a join, but that's okay
                    // The frontend will fetch memberships via getUserMemberships for full details
                }
            }
        }

        // Map to frontend-compatible format
        res.json({
            id: user._id,
            email: user.email,
            name: user.name,
            role: effectiveRole,
            clubId: effectiveClubId,
            clubName: effectiveClubName,
            likedClubs: user.likedClubs || [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
