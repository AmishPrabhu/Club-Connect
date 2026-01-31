import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import ClubMember from '../models/ClubMember.js';
import { verifyToken } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check email domain
        if (!email.endsWith('@walchandsangli.ac.in')) {
            return res.status(400).json({ message: 'Only @walchandsangli.ac.in email addresses are allowed' });
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

// Google OAuth Login
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        // Check domain restriction - only allow @walchandsangli.ac.in emails
        if (!email.endsWith('@walchandsangli.ac.in')) {
            return res.status(403).json({
                message: 'Only @walchandsangli.ac.in email addresses are allowed to sign in.'
            });
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            // User doesn't exist - tell frontend to redirect to signup
            return res.status(404).json({
                code: 'USER_NOT_FOUND',
                message: 'No account exists with this email. Please create an account.',
                googleData: {
                    email,
                    name,
                    credential // Pass back for signup verification
                }
            });
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

        // Create JWT token
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
        console.error('Google OAuth error:', error);
        res.status(500).json({ message: 'Google authentication failed' });
    }
});

// Google OAuth Signup (creates account with password)
router.post('/google/signup', async (req, res) => {
    try {
        const { credential, password } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        // Check domain restriction - only allow @walchandsangli.ac.in emails
        if (!email.endsWith('@walchandsangli.ac.in')) {
            return res.status(403).json({
                message: 'Only @walchandsangli.ac.in email addresses are allowed to sign up.'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists. Please login instead.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with Google + password
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            authProvider: 'google',
            role: 'user',
        });

        await newUser.save();

        // Link any existing club memberships to this new user
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
        console.error('Google signup error:', error);
        res.status(500).json({ message: 'Google signup failed' });
    }
});

// Forgot Password - Send reset email
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                code: 'USER_NOT_FOUND',
                message: 'No account found with this email address'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Save token to user (expires in 1 hour)
        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}?page=resetPassword&token=${resetToken}&email=${encodeURIComponent(email)}`;

        // Send email using Resend
        const result = await sendPasswordResetEmail(user, resetUrl);

        if (!result.success) {
            console.error('Failed to send password reset email:', result.error);
            return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
        }

        res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }
});

// Reset Password - Verify token and update password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, email, password } = req.body;

        if (!token || !email || !password) {
            return res.status(400).json({ message: 'Token, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Hash the token to compare with stored hash
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            email: email.toLowerCase(),
            resetPasswordToken: tokenHash,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token. Please request a new password reset.' });
        }

        // Hash new password and save
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Failed to reset password. Please try again.' });
    }
});

export default router;
