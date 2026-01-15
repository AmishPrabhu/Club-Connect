import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: { // Description or body
        type: String,
        required: true,
    },
    image: {
        type: String, // URL
        default: '',
    },
    coverImage: { // Alias for image, or used optionally
        type: String,
        default: '',
    },
    type: {
        type: String,
        enum: ['event', 'announcement', 'post'],
        default: 'post',
    },
    // Relating to Club
    clubId: {
        type: String, // Can be ObjectId if strictly relational, but keeping string to match existing logic
        required: true,
    },
    clubName: {
        type: String,
        required: true,
    },
    clubImage: {
        type: String,
    },

    // Event specific fields
    date: {
        type: String, // Storing as string YYYY-MM-DD or similar based on frontend usage, or Date object
    },
    time: {
        type: String, // "2:30 PM"
    },
    location: {
        type: String,
    },

    likes: {
        type: Number,
        default: 0,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('Post', postSchema);
