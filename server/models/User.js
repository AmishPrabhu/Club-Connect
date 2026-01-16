import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'secretary', 'president', 'treasurer', 'advisor', 'club-secretary', 'student', 'cabinet-member'], // Added observed roles from Firebase logic
        default: 'user',
    },
    clubId: {
        type: String,
        default: null,
    },
    clubName: {
        type: String,
        default: null,
    },
    bio: {
        type: String,
        default: '',
    },
    likedClubs: [{
        type: String, // Club IDs
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('User', userSchema);
