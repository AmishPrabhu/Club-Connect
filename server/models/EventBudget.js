import mongoose from 'mongoose';

const eventBudgetSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
    },
    clubId: {
        type: String,
        required: true,
    },
    budgetImages: [{
        url: String,
        publicId: String,
    }],
    verified: {
        type: Boolean,
        default: false,
    },
    verifiedBy: {
        type: String,
        default: null,
    },
    verifiedByName: {
        type: String,
        default: null,
    },
    verifiedAt: {
        type: Date,
        default: null,
    },
    createdBy: {
        type: String,
        required: true,
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

export default mongoose.model('EventBudget', eventBudgetSchema);
