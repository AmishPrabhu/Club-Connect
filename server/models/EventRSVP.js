
import mongoose from 'mongoose';

const eventRSVPSchema = new mongoose.Schema({
    eventId: {
        type: String, // ID of the Post (Event)
        required: true,
        index: true,
    },
    userId: {
        type: String, // Optional, if user is logged in
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    attendance: {
        type: String,
        enum: ['present', 'absent', 'pending'],
        default: 'pending',
    },
    rsvpedAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index to prevent duplicate RSVPs for same email on same event
eventRSVPSchema.index({ eventId: 1, email: 1 }, { unique: true });

export default mongoose.model('EventRSVP', eventRSVPSchema);
