const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleType: {
        type: String,
        required: true,
        enum: ['Hatchback', 'Sedan', 'SUV', 'Innova', 'Tempo Traveller', 'Bus', 'Car', 'Bike', 'Scooter', 'Truck']
    },
    vehicleName: {
        type: String,
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true,
        unique: true
    },
    color: {
        type: String,
        required: true
    },
    registrationNumber: {
        type: String,
        required: true,
        unique: true
    },
    registrationDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Maintenance', 'Booked'],
        default: 'Active'
    },
    ownerName: {
        type: String,
        required: true
    },
    ownerPhone: {
        type: String,
        required: true
    },
    ownerEmail: {
        type: String,
        required: true
    },
    pricePerKm: {
        type: Number,
        default: 15
    },
    seatingCapacity: {
        type: Number,
        default: 4
    },
    features: [{
        type: String
    }],
    city: {
        type: String,
        default: 'Delhi'
    },
    available: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;