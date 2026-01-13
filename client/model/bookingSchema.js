const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // User Information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userPhone: {
        type: String,
        required: true
    },
    
    // Vehicle Information
    vehicleType: {
        type: String,
        required: true,
        enum: ['Hatchback', 'Sedan', 'SUV', 'Innova', 'Tempo Traveller', 'Bus']
    },
    vehicleName: {
        type: String,
        required: true
    },
    vehicleId: {
        type: String,
        required: true
    },
    
    // Booking Details
    pickupCity: {
        type: String,
        required: true
    },
    dropCity: {
        type: String,
        required: true
    },
    pickupDate: {
        type: Date,
        required: true
    },
    dropDate: {
        type: Date,
        required: true
    },
    pickupTime: {
        type: String,
        required: true
    },
    
    // Trip Details
    totalDays: {
        type: Number,
        required: true
    },
    distance: {
        type: Number,
        required: true
    },
    totalPassengers: {
        type: Number,
        required: true,
        min: 1
    },
    
    // Pricing
    pricePerKm: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    advancePaid: {
        type: Number,
        default: 0
    },
    balanceAmount: {
        type: Number,
        required: true
    },
    
    // Booking Status
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'In Progress'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partially Paid', 'Paid', 'Refunded'],
        default: 'Pending'
    },
    
    // Additional Information
    specialRequirements: {
        type: String,
        default: ''
    },
    driverRequired: {
        type: Boolean,
        default: true
    },
    
    // Dates
    bookingDate: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // Admin Notes
    adminNotes: {
        type: String,
        default: ''
    }
});

// Auto-calculate balance and update timestamp
bookingSchema.pre('save', function(next) {
    this.balanceAmount = this.totalAmount - this.advancePaid;
    this.updatedAt = Date.now();
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;