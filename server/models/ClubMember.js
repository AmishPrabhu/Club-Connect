
import mongoose from 'mongoose';

const clubMemberSchema = new mongoose.Schema({
    clubId: {
        type: String, // ID of the Club
        required: true,
        index: true,
    },
    userId: {
        type: String, // Optional, if linked to a registered User
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['president', 'vice-president', 'treasurer', 'secretary', 'coordinator', 'member'],
        default: 'member',
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent duplicate email in same club
clubMemberSchema.index({ clubId: 1, email: 1 }, { unique: true });

export default mongoose.model('ClubMember', clubMemberSchema);
