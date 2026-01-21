import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import ClubMember from '../models/ClubMember.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';
import { getTransporter } from './auth.js';

const router = express.Router();

// Configure multer for file upload (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
        }
    }
});

// Bulk import members from Excel
router.post('/:clubId/members/bulk-import', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { clubId } = req.params;
        const { id: userId, role } = req.user;

        // Check authorization - only club secretary, president, treasurer, or admin
        if (!['admin', 'club-secretary', 'president', 'treasurer'].includes(role)) {
            return res.status(403).json({ message: 'Unauthorized to import members' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Parse Excel file
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty' });
        }

        if (data.length > 500) {
            return res.status(400).json({ message: 'Maximum 500 members allowed per import' });
        }

        const results = {
            total: data.length,
            added: 0,
            updated: 0,
            failed: 0,
            emailsSent: 0,
            details: {
                added: [],
                updated: [],
                failed: []
            }
        };

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel row number (accounting for header)

            try {
                // Validate required fields
                if (!row.Name || !row.Email || !row.Role) {
                    results.failed++;
                    results.details.failed.push({
                        row: rowNumber,
                        email: row.Email || 'N/A',
                        error: 'Missing required fields (Name, Email, or Role)'
                    });
                    continue;
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(row.Email)) {
                    results.failed++;
                    results.details.failed.push({
                        row: rowNumber,
                        email: row.Email,
                        error: 'Invalid email format'
                    });
                    continue;
                }

                const email = row.Email.toLowerCase().trim();
                const name = row.Name.trim();
                const memberRole = row.Role.toLowerCase().trim();

                // Check if user exists
                const existingUser = await User.findOne({ email });

                // Check if member already exists in this club
                const existingMember = await ClubMember.findOne({ clubId, email });

                if (existingMember) {
                    // Update existing member
                    existingMember.name = name;
                    existingMember.role = memberRole;
                    if (row['Board Type']) existingMember.boardType = row['Board Type'];
                    if (row['Academic Year']) existingMember.academicYear = row['Academic Year'];
                    if (row['Year Joined']) existingMember.joinedAt = new Date(row['Year Joined']);
                    await existingMember.save();

                    results.updated++;
                    results.details.updated.push({
                        name,
                        email,
                        role: memberRole
                    });
                } else {
                    // Add new member
                    const newMember = new ClubMember({
                        clubId,
                        name,
                        email,
                        role: memberRole,
                        boardType: row['Board Type'] || 'member',
                        academicYear: row['Academic Year'] || '',
                        userId: existingUser?._id,
                        joinedAt: row['Year Joined'] ? new Date(row['Year Joined']) : new Date()
                    });
                    await newMember.save();

                    // Auto-assign club-member role if user exists and has 'user' role
                    if (existingUser && existingUser.role === 'user') {
                        existingUser.role = 'club-member';
                        await existingUser.save();
                    }

                    results.added++;
                    results.details.added.push({
                        name,
                        email,
                        role: memberRole
                    });

                    // Send invitation email if user doesn't exist
                    if (!existingUser) {
                        try {
                            const { default: Club } = await import('../models/Club.js');
                            const club = await Club.findById(clubId);

                            const mailOptions = {
                                from: `"Club Connect" <${process.env.EMAIL_USER}>`,
                                to: email,
                                subject: `You've been added to ${club?.name || 'a club'} - Create Your Account`,
                                html: `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                        <div style="background: #002147; padding: 20px; text-align: center;">
                                            <h1 style="color: #DAA520; margin: 0;">Club Connect</h1>
                                        </div>
                                        <div style="padding: 30px; background: #f9f9f9;">
                                            <h2 style="color: #002147;">Welcome to ${club?.name || 'the club'}!</h2>
                                            <p>Hello ${name},</p>
                                            <p>You've been added as a <strong>${memberRole}</strong> to ${club?.name || 'a club'} on Club Connect!</p>
                                            <p>To get started, please create your account:</p>
                                            <div style="text-align: center; margin: 30px 0;">
                                                <a href="${process.env.FRONTEND_URL}?page=signUp&email=${encodeURIComponent(email)}" 
                                                   style="background: #DAA520; color: #002147; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                                    Create Account
                                                </a>
                                            </div>
                                            <p style="color: #666; font-size: 14px;">Your registered email: ${email}</p>
                                            <p style="color: #666; font-size: 14px;">Club: ${club?.name || 'N/A'}</p>
                                            <p style="color: #666; font-size: 14px;">Role: ${memberRole}</p>
                                        </div>
                                        <div style="background: #002147; padding: 15px; text-align: center;">
                                            <p style="color: #888; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Club Connect - Walchand College of Engineering</p>
                                        </div>
                                    </div>
                                `,
                            };

                            await getTransporter().sendMail(mailOptions);
                            results.emailsSent++;
                        } catch (emailError) {
                            console.error('Error sending invitation email:', emailError);
                            // Don't fail the import if email fails
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing row ${rowNumber}:`, error);
                results.failed++;
                results.details.failed.push({
                    row: rowNumber,
                    email: row.Email || 'N/A',
                    error: error.message || 'Unknown error'
                });
            }
        }

        res.json({
            success: true,
            message: 'Bulk import completed',
            summary: {
                total: results.total,
                added: results.added,
                updated: results.updated,
                failed: results.failed,
                emailsSent: results.emailsSent
            },
            details: results.details
        });

    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({
            message: 'Failed to import members',
            error: error.message
        });
    }
});

export default router;
