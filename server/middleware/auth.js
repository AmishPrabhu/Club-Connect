import jwt from 'jsonwebtoken';
import ClubMember from '../models/ClubMember.js';

export const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Token verification error:", err.message);
        res.status(400).json({ message: 'Invalid token.' });
    }
};

export const verifyTokenOptional = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        // Optional token, so if invalid, just proceed as guest
        next();
    }
};

// Renamed from verifyAdmin to be more explicit - System Wide Admin only
export const verifySuperAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
        }
    })
}

// Check if user is an officer OF THE SPECIFIC CLUB in the route params OR body
export const verifyClubOfficer = async (req, res, next) => {
    verifyToken(req, res, async () => {
        try {
            // Super Admin always has access. 
            // NOTE: We allow this even if clubId is missing, assuming admin can do anything.
            if (req.user.role === 'admin') {
                return next();
            }

            const clubId = req.params.id || req.params.clubId || req.body.clubId;
            if (!clubId) {
                return res.status(400).json({ message: 'Club ID is required for authorization check.' });
            }

            // Check if user is an officer of THIS club
            const officerFn = await ClubMember.findOne({
                clubId: clubId,
                userId: req.user.id,
                role: { $in: ['Secretary', 'President', 'Treasurer', 'Advisor'] }
            });

            if (officerFn) {
                next();
            } else {
                res.status(403).json({ message: 'Access denied. You are not an officer of this club.' });
            }
        } catch (error) {
            console.error('Club Officer Auth Error:', error);
            res.status(500).json({ message: 'Server authorization error' });
        }
    })
}

// Check if user is a member (or officer) of the club
export const verifyClubMember = async (req, res, next) => {
    verifyToken(req, res, async () => {
        try {
            if (req.user.role === 'admin') {
                return next();
            }

            const clubId = req.params.id || req.params.clubId || req.body.clubId;
            if (!clubId) {
                return res.status(400).json({ message: 'Club ID is required for authorization check.' });
            }

            const member = await ClubMember.findOne({
                clubId: clubId,
                userId: req.user.id
            });

            if (member) {
                next();
            } else {
                res.status(403).json({ message: 'Access denied. You are not a member of this club.' });
            }
        } catch (error) {
            console.error('Club Member Auth Error:', error);
            res.status(500).json({ message: 'Server authorization error' });
        }
    })
}
