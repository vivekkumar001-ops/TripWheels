const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        default: '',
        trim: true
    },
    subject: {
        type: String,
        required: true,
        enum: ['Booking Inquiry', 'Vehicle Information', 'Complaint', 'Feedback', 'Partnership', 'Other']
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    },
    read: {
        type: Boolean,
        default: false
    },
    admin_notes: {
        type: String,
        default: ''
    },
    replied_at: {
        type: Date
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-update timestamp
contactSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;