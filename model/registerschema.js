const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        trim: true
    },
    lastname: { 
        type: String,
        required: true,
        trim: true
    },
    emailaddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phonenumber: { 
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    confirmpassword: {
        type: String,
        required: true
    },
    preferredcity: {
        type: String,
        required: true,
        enum: ['Delhi', 'Mumbai', 'Bangalore', 'Goa', 'Jaipur', 'Kerala', 'Other'],
        default: 'Delhi'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending', 'suspended'],
        default: 'active'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    admin_notes: {
        type: String,
        default: ''
    },
    bookings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create default admin user on start
registerSchema.statics.initAdmin = async function() {
    try {
        const adminExists = await this.findOne({ emailaddress: 'admin@tripwheels.com' });
        if (!adminExists) {
            const admin = new this({
                firstname: 'Admin',
                lastname: 'User',
                emailaddress: 'admin@tripwheels.com',
                phonenumber: '9876543210',
                password: 'admin123',
                confirmpassword: 'admin123',
                preferredcity: 'Delhi',
                status: 'active',
                isAdmin: true
            });
            await admin.save();
            console.log('✅ Default admin user created');
        }
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    }
};

const Register = mongoose.model('Register', registerSchema);

// Initialize admin
Register.initAdmin();

module.exports = Register;