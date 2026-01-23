import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String },
    type: { type: String, enum: ['image', 'video', 'pdf', 'link'], default: 'image' },
    label: { type: String },
}, { _id: false });

const eventTaskSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    assignedTo: [{ type: String }],
    assignedToEmails: [{ type: String }],
    deadline: { type: String },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    createdBy: { type: String },
    createdAt: { type: String },
}, { _id: false });

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
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published',
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

    // Author info
    authorId: {
        type: String,
    },
    authorName: {
        type: String,
    },

    // Event specific fields
    date: {
        type: String, // Storing as string YYYY-MM-DD or similar based on frontend usage
    },
    time: {
        type: String, // "2:30 PM - 5:00 PM"
    },
    location: {
        type: String,
    },
    locationType: {
        type: String,
        enum: ['campus', 'external'],
        default: 'campus',
    },
    locationUrl: {
        type: String, // Google Maps URL for external locations
    },

    // Registration fields
    registrationStart: {
        type: String, // YYYY-MM-DD
    },
    registrationStartTime: {
        type: String, // "10:00 AM"
    },
    registrationEnd: {
        type: String, // YYYY-MM-DD
    },
    registrationEndTime: {
        type: String, // "5:00 PM"
    },
    registrationLink: {
        type: String, // URL to registration form (Google Forms, etc.)
    },
    responseSpreadsheetUrl: {
        type: String, // Google Sheets URL for form responses
    },
    eventWhatsappLink: {
        type: String, // WhatsApp group link for the event
    },

    // Related event for announcements
    relatedEventId: {
        type: String,
    },
    relatedEventTitle: {
        type: String,
    },

    // Attachments
    attachments: [attachmentSchema], // Description images (uploaded when creating post)
    eventPhotos: [attachmentSchema], // Event photos/videos (uploaded after event by secretary)

    // Event tasks
    eventTasks: [eventTaskSchema],

    // Stats
    likes: {
        type: Number,
        default: 0,
    },
    rsvps: {
        type: Number,
        default: 0,
    },

    // Budget fields (for events)
    budgetImage: {
        type: String, // URL of uploaded budget file/image
        default: null,
    },
    budgetVerified: {
        type: Boolean,
        default: false,
    },
    budgetVerifiedBy: {
        type: String, // User ID of advisor who verified
        default: null,
    },
    budgetVerifiedAt: {
        type: Date,
        default: null,
    },

    // Certificate generation fields (for events)
    certificateTemplate: {
        templateUrl: { type: String, default: null }, // Cloudinary URL of certificate template
        namePosition: {
            x: { type: Number, default: 50 }, // X position (percentage)
            y: { type: Number, default: 50 }, // Y position (percentage)
            fontSize: { type: Number, default: 48 },
            fontFamily: { type: String, default: 'Arial' },
            color: { type: String, default: '#000000' },
        },
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

