import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        default: '',
    },
    image: {
        type: String, // URL
        default: '',
    },
    // Officers
    secretaryId: { type: String },
    secretaryEmail: { type: String },
    presidentId: { type: String },
    presidentEmail: { type: String },
    treasurerId: { type: String },
    treasurerEmail: { type: String },
    advisorId: { type: String },
    advisorEmail: { type: String },
    advisorName: { type: String },

    members: {
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

export default mongoose.model('Club', clubSchema);
