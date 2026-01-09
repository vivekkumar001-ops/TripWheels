const express = require('express');
const router = express.Router();
const path = require("path");
const Register = require('../model/registerSchema');
const Contact = require('../model/contactSchema');
const Booking = require('../model/bookingSchema');
const Vehicle = require('../model/vehicleSchema');

// ============ AUTHENTICATION MIDDLEWARE ============
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        req.session.redirectTo = req.originalUrl;
        return res.redirect('/login');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.redirect('/dashboard');
    }
    next();
};

// ============ PUBLIC ROUTES ============

// 1. HOME
router.get('/', (req, res) => {
    res.render('index', { 
        page: 'home'
    });
});

// 2. VEHICLES
router.get('/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ available: true });
        res.render('vehicles', { 
            page: 'vehicles',
            vehicles: vehicles
        });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.render('vehicles', { 
            page: 'vehicles',
            vehicles: []
        });
    }
});

// 3. VEHICLE DETAIL
router.get('/vehicle/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.redirect('/vehicles');
        }
        res.render('vehicle-detail', { 
            vehicleId: req.params.id,
            vehicle: vehicle,
            page: 'vehicles'
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/vehicles');
    }
});

// 4. CITIES
router.get('/cities', (req, res) => {
    res.render('cities', { 
        page: 'cities'
    });
});

// 5. ABOUT
router.get('/about', (req, res) => {
    res.render('about', { 
        page: 'about'
    });
});

// 6. CONTACT - GET
router.get('/contact', (req, res) => {
    res.render('contact', { 
        page: 'contact',
        message: null,
        messageType: null
    });
});

// 7. CONTACT - POST
router.post('/contact', async (req, res) => {
    try {
        console.log('Contact form submitted:', req.body);

        const contactData = new Contact({
            name: req.body.fullname,
            email: req.body.email,
            phone: req.body.phone || '',
            subject: req.body.subject,
            message: req.body.message,
            userId: req.session.user ? req.session.user.id : null
        });

        await contactData.save();
        console.log('✅ Contact saved to database');

        res.render('contact', {
            page: 'contact',
            message: 'Thank you! Your message has been sent successfully.',
            messageType: 'success'
        });

    } catch (error) {
        console.error('❌ Error saving contact:', error);
        res.render('contact', {
            page: 'contact',
            message: 'Sorry, there was an error sending your message. Please try again.',
            messageType: 'error'
        });
    }
});

// 8. LOGIN - GET
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { 
        page: 'login',
        message: null,
        messageType: null
    });
});

// 9. LOGIN - POST
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await Register.findOne({ emailaddress: email });
        
        if (!user) {
            return res.render('login', {
                page: 'login',
                message: 'Invalid email or password!',
                messageType: 'error'
            });
        }
        
        // Check password
        if (user.password !== password) {
            return res.render('login', {
                page: 'login',
                message: 'Invalid email or password!',
                messageType: 'error'
            });
        }
        
        // Check if user is active
        if (user.status !== 'active') {
            return res.render('login', {
                page: 'login',
                message: 'Your account is ' + user.status + '. Please contact admin.',
                messageType: 'error'
            });
        }
        
        // Create session
        req.session.user = {
            id: user._id,
            email: user.emailaddress,
            name: `${user.firstname} ${user.lastname}`,
            firstname: user.firstname,
            lastname: user.lastname,
            phone: user.phonenumber,
            city: user.preferredcity,
            isAdmin: user.isAdmin
        };
        
        console.log(`✅ Login successful: ${user.emailaddress}`);
        
        // Redirect to intended page or dashboard
        const redirectTo = req.session.redirectTo || '/dashboard';
        delete req.session.redirectTo;
        res.redirect(redirectTo);
        
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', {
            page: 'login',
            message: 'Login failed! Please try again.',
            messageType: 'error'
        });
    }
});

// 10. REGISTER - GET
router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    
    res.render('register', { 
        page: 'register',
        message: null,
        messageType: null
    });
});

// 11. REGISTER - POST
router.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        
        // Validate passwords match
        if (req.body.password !== req.body.confirmpassword) {
            return res.render('register', { 
                page: 'register',
                message: 'Passwords do not match!',
                messageType: 'error'
            });
        }
        
        // Check if user already exists
        const existingUser = await Register.findOne({ emailaddress: req.body.emailaddress });
        if (existingUser) {
            return res.render('register', { 
                page: 'register',
                message: 'User already exists with this email!',
                messageType: 'error'
            });
        }
        
        // Validate phone number
        if (!/^\d{10}$/.test(req.body.phonenumber)) {
            return res.render('register', { 
                page: 'register',
                message: 'Please enter valid 10-digit phone number!',
                messageType: 'error'
            });
        }
        
        // Create new user
        const newUser = new Register({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            emailaddress: req.body.emailaddress,
            phonenumber: req.body.phonenumber,
            password: req.body.password,
            confirmpassword: req.body.confirmpassword,
            preferredcity: req.body.preferredcity,
            status: 'active',
            isAdmin: false
        });
        
        await newUser.save();
        console.log('✅ User registered:', newUser.emailaddress);
        
        // Auto login after registration
        req.session.user = {
            id: newUser._id,
            email: newUser.emailaddress,
            name: `${newUser.firstname} ${newUser.lastname}`,
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            phone: newUser.phonenumber,
            city: newUser.preferredcity,
            isAdmin: false
        };
        
        res.render('register', { 
            page: 'register',
            message: 'Registration successful! You are now logged in.',
            messageType: 'success'
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { 
            page: 'register',
            message: 'Registration failed! Please try again.',
            messageType: 'error'
        });
    }
});

// 12. LOGOUT
router.get('/logout', (req, res) => {
    const userEmail = req.session.user ? req.session.user.email : 'Unknown';
    console.log(`Logout requested by: ${userEmail}`);
    
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Logout error:', err);
        }
        
        // Clear cookie
        res.clearCookie('connect.sid');
        
        console.log(`✅ User logged out: ${userEmail}`);
        res.redirect('/login');
    });
});

// ============ PROTECTED ROUTES (REQUIRE LOGIN) ============

// 13. DASHBOARD
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const user = await Register.findById(req.session.user.id);
        
        // Get statistics
        const userCount = await Register.countDocuments();
        const contactCount = await Contact.countDocuments();
        const bookingCount = await Booking.countDocuments({ userId: req.session.user.id });
        
        // Get user's recent bookings
        const recentBookings = await Booking.find({ userId: req.session.user.id })
            .sort({ bookingDate: -1 })
            .limit(5);
        
        res.render('dashboard/dashboard', {
            activePage: 'dashboard',
            dbUser: user,
            userCount: userCount,
            contactCount: contactCount,
            bookingCount: bookingCount,
            recentBookings: recentBookings
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect('/login');
    }
});

// 14. VIEW REGISTRATION (Admin only)
router.get('/view-registration', requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await Register.find({}).sort({ createdAt: -1 });
        const userCount = await Register.countDocuments();
        const contactCount = await Contact.countDocuments();
        
        res.render('dashboard/view-registration', { 
            users: users,
            userCount: userCount,
            contactCount: contactCount,
            activePage: 'view-registration'
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.render('dashboard/view-registration', { 
            users: [],
            userCount: 0,
            contactCount: 0,
            activePage: 'view-registration',
            error: 'Failed to load data'
        });
    }
});

// 15. EDIT REGISTRATION - GET
router.get('/edit-registration/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const user = await Register.findById(req.params.id);
        if (!user) {
            return res.redirect('/view-registration');
        }
        
        const userCount = await Register.countDocuments();
        const contactCount = await Contact.countDocuments();
        
        res.render('dashboard/edit-registration', {
            user: user,
            userCount: userCount,
            contactCount: contactCount,
            activePage: 'edit-registration'
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/view-registration');
    }
});

// 16. UPDATE REGISTRATION - POST
router.post('/update-registration/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { firstname, lastname, emailaddress, phonenumber, preferredcity, status, admin_notes } = req.body;
        
        const updateData = {
            firstname,
            lastname,
            emailaddress,
            phonenumber,
            preferredcity,
            status: status || 'active',
            admin_notes: admin_notes || '',
            updatedAt: Date.now()
        };
        
        await Register.findByIdAndUpdate(req.params.id, updateData);
        
        res.redirect('/view-registration');
        
    } catch (error) {
        console.error('Update error:', error);
        res.redirect('/view-registration');
    }
});

// 17. DELETE REGISTRATION
router.get('/delete-registration/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        await Register.findByIdAndDelete(req.params.id);
        console.log(`🗑️ Deleted user: ${req.params.id}`);
        res.redirect('/view-registration');
    } catch (error) {
        console.error('Delete error:', error);
        res.redirect('/view-registration');
    }
});

// 18. VIEW CONTACT MESSAGES (Admin only)
router.get('/view-contact', requireAuth, requireAdmin, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ date: -1 });
        const userCount = await Register.countDocuments();
        const contactCount = await Contact.countDocuments();
        
        res.render('dashboard/view-contact', { 
            contacts: contacts,
            userCount: userCount,
            contactCount: contactCount,
            activePage: 'view-contact'
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.render('dashboard/view-contact', { 
            contacts: [],
            userCount: 0,
            contactCount: 0,
            activePage: 'view-contact',
            error: 'Failed to load contacts'
        });
    }
});

// 19. EDIT CONTACT - GET
router.get('/edit-contact/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.redirect('/view-contact');
        }
        
        const userCount = await Register.countDocuments();
        const contactCount = await Contact.countDocuments();
        
        res.render('dashboard/edit-contact', {
            contact: contact,
            userCount: userCount,
            contactCount: contactCount,
            activePage: 'edit-contact'
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/view-contact');
    }
});

// 20. UPDATE CONTACT - POST
router.post('/update-contact/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, email, phone, subject, message, status, read, admin_notes } = req.body;
        
        const updateData = {
            name,
            email,
            phone,
            subject,
            message,
            status: status || 'new',
            read: read === 'on',
            admin_notes: admin_notes || '',
            updatedAt: Date.now()
        };
        
        await Contact.findByIdAndUpdate(req.params.id, updateData);
        
        res.redirect('/view-contact');
        
    } catch (error) {
        console.error('Error updating contact:', error);
        res.redirect(`/edit-contact/${req.params.id}`);
    }
});

// 21. DELETE CONTACT
router.post('/contacts/delete/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        console.log(`🗑️ Deleted contact: ${req.params.id}`);
        res.redirect('/view-contact');
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.redirect('/view-contact');
    }
});

// ============ BOOKING ROUTES ============

// 22. BOOKING PAGE
router.get('/booking', requireAuth, (req, res) => {
    res.render('booking', { 
        page: 'booking',
        message: null,
        messageType: null
    });
});

// 23. PROCESS BOOKING
router.post('/booking', requireAuth, async (req, res) => {
    try {
        console.log('New booking from:', req.session.user.email);
        
        // Calculate total amount
        const distance = parseFloat(req.body.distance) || 100;
        const pricePerKm = parseFloat(req.body.pricePerKm) || 15;
        const totalDays = parseInt(req.body.totalDays) || 1;
        
        const totalAmount = distance * pricePerKm * totalDays;
        const advancePaid = parseFloat(req.body.advancePaid) || 0;
        const balanceAmount = totalAmount - advancePaid;
        
        // Create new booking
        const newBooking = new Booking({
            userId: req.session.user.id,
            userName: req.session.user.name,
            userEmail: req.session.user.email,
            userPhone: req.body.phone || req.session.user.phone,
            
            vehicleType: req.body.vehicleType,
            vehicleName: req.body.vehicleName || `${req.body.vehicleType} Car`,
            vehicleId: req.body.vehicleId || 'V' + Date.now().toString().slice(-6),
            
            pickupCity: req.body.pickupCity,
            dropCity: req.body.dropCity || req.body.pickupCity,
            pickupDate: new Date(req.body.pickupDate),
            dropDate: new Date(req.body.dropDate),
            pickupTime: req.body.pickupTime,
            
            totalDays: totalDays,
            distance: distance,
            totalPassengers: parseInt(req.body.passengers) || 1,
            
            pricePerKm: pricePerKm,
            totalAmount: totalAmount,
            advancePaid: advancePaid,
            balanceAmount: balanceAmount,
            
            status: 'Pending',
            paymentStatus: advancePaid > 0 ? 'Partially Paid' : 'Pending',
            
            specialRequirements: req.body.requirements || '',
            driverRequired: req.body.driverRequired === 'on' || true
        });
        
        await newBooking.save();
        console.log('✅ Booking created:', newBooking._id);
        
        // Update user's bookings array
        await Register.findByIdAndUpdate(
            req.session.user.id,
            { $push: { bookings: newBooking._id } }
        );
        
        res.render('booking', {
            page: 'booking',
            message: `🎉 Booking successful! Booking ID: ${newBooking._id.toString().slice(-8)}`,
            messageType: 'success',
            booking: newBooking
        });

    } catch (error) {
        console.error('❌ Booking error:', error);
        res.render('booking', {
            page: 'booking',
            message: 'Sorry, booking failed. Please try again.',
            messageType: 'error'
        });
    }
});

// 24. MY BOOKINGS
router.get('/my-bookings', requireAuth, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.session.user.id })
            .sort({ bookingDate: -1 });
        
        const userCount = await Register.countDocuments();
        const contactCount = await Contact.countDocuments();
        const bookingCount = bookings.length;
        
        // Calculate statistics
        const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
        const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
        
        res.render('dashboard/my-bookings', {
            bookings: bookings,
            userCount: userCount,
            contactCount: contactCount,
            bookingCount: bookingCount,
            totalRevenue: totalRevenue,
            pendingBookings: pendingBookings,
            confirmedBookings: confirmedBookings,
            activePage: 'my-bookings'
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.render('dashboard/my-bookings', {
            bookings: [],
            userCount: 0,
            contactCount: 0,
            bookingCount: 0,
            totalRevenue: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            activePage: 'my-bookings'
        });
    }
});

// 25. EDIT BOOKING
router.get('/edit-booking/:id', requireAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        // Check ownership
        if (!booking || booking.userId.toString() !== req.session.user.id) {
            return res.redirect('/my-bookings');
        }
        
        const userCount = await Register.countDocuments();
        const contactCount = await Contact.countDocuments();
        
        res.render('dashboard/edit-booking', {
            booking: booking,
            userCount: userCount,
            contactCount: contactCount,
            activePage: 'my-bookings'
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/my-bookings');
    }
});

// 26. UPDATE BOOKING
router.post('/update-booking/:id', requireAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking || booking.userId.toString() !== req.session.user.id) {
            return res.redirect('/my-bookings');
        }
        
        const updateData = {
            ...req.body,
            totalAmount: parseFloat(req.body.totalAmount),
            advancePaid: parseFloat(req.body.advancePaid),
            balanceAmount: parseFloat(req.body.totalAmount) - parseFloat(req.body.advancePaid),
            updatedAt: Date.now()
        };
        
        await Booking.findByIdAndUpdate(req.params.id, updateData);
        
        res.redirect('/my-bookings');
        
    } catch (error) {
        console.error('Error:', error);
        res.redirect(`/edit-booking/${req.params.id}`);
    }
});

// 27. DELETE BOOKING
router.post('/delete-booking/:id', requireAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking || booking.userId.toString() !== req.session.user.id) {
            return res.redirect('/my-bookings');
        }
        
        await Booking.findByIdAndDelete(req.params.id);
        console.log(`🗑️ Deleted booking: ${req.params.id}`);
        
        // Remove from user's bookings array
        await Register.findByIdAndUpdate(
            req.session.user.id,
            { $pull: { bookings: req.params.id } }
        );
        
        res.redirect('/my-bookings');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/my-bookings');
    }
});

// 28. CANCEL BOOKING
router.post('/cancel-booking/:id', requireAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking || booking.userId.toString() !== req.session.user.id) {
            return res.redirect('/my-bookings');
        }
        
        await Booking.findByIdAndUpdate(req.params.id, {
            status: 'Cancelled',
            updatedAt: Date.now()
        });
        
        res.redirect('/my-bookings');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/my-bookings');
    }
});

// ============ VEHICLE MANAGEMENT ============

// 29. ADD VEHICLE PAGE (Admin only)
router.get('/add-vehicle', requireAuth, requireAdmin, (req, res) => {
    res.render('add-vehicle', { 
        page: 'add-vehicle'
    });
});

// 30. ADD VEHICLE - POST
router.post('/add-vehicle', requireAuth, requireAdmin, async (req, res) => {
    try {
        const vehicleData = new Vehicle({
            vehicleType: req.body.vehicleType,
            vehicleName: req.body.vehicleName,
            vehicleNumber: req.body.vehicleNumber || 'VH' + Date.now().toString().slice(-6),
            color: req.body.color || 'White',
            registrationNumber: req.body.registrationNumber || 'REG' + Date.now().toString().slice(-6),
            registrationDate: new Date(req.body.registrationDate),
            expiryDate: new Date(req.body.expiryDate),
            status: req.body.status || 'Active',
            ownerName: req.body.ownerName,
            ownerPhone: req.body.ownerPhone,
            ownerEmail: req.body.ownerEmail,
            pricePerKm: parseFloat(req.body.pricePerKm) || 15,
            seatingCapacity: parseInt(req.body.seatingCapacity) || 4,
            city: req.body.city || 'Delhi',
            available: true
        });
        
        await vehicleData.save();
        console.log('✅ Vehicle added:', vehicleData.vehicleName);
        
        res.redirect('/vehicles');
        
    } catch (error) {
        console.error('Error adding vehicle:', error);
        res.redirect('/add-vehicle');
    }
});

// ============ OTHER DASHBOARD PAGES ============

// 31. PAYMENTS PAGE
router.get('/payments', requireAuth, async (req, res) => {
    try {
        const userCount = await Register.countDocuments();
        const contactCount = await Contact.countDocuments();
        
        // Get user's bookings
        const bookings = await Booking.find({ userId: req.session.user.id });
        
        res.render('dashboard/dashboard', {
            userCount: userCount,
            contactCount: contactCount,
            activePage: 'payments',
            bookings: bookings
        });
    } catch (error) {
        console.error('Error:', error);
        res.render('dashboard/dashboard', {
            userCount: 0,
            contactCount: 0,
            activePage: 'payments'
        });
    }
});

// 32. OFFERS PAGE
router.get('/offers', requireAuth, (req, res) => {
    res.render('dashboard/dashboard', {
        activePage: 'offers'
    });
});

// 33. SUPPORT PAGE
router.get('/support', requireAuth, (req, res) => {
    res.render('dashboard/dashboard', {
        activePage: 'support'
    });
});

// 34. SETTINGS PAGE
router.get('/settings', requireAuth, async (req, res) => {
    try {
        const user = await Register.findById(req.session.user.id);
        res.render('dashboard/dashboard', {
            activePage: 'settings',
            dbUser: user
        });
    } catch (error) {
        console.error('Error:', error);
        res.render('dashboard/dashboard', {
            activePage: 'settings'
        });
    }
});

// 35. VIEW BOOKING DETAILS
router.get('/booking/:id', requireAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        // Check ownership
        if (!booking || booking.userId.toString() !== req.session.user.id) {
            return res.render('404');
        }
        
        res.render('booking-details', {
            page: 'booking',
            booking: booking
        });
    } catch (error) {
        console.error('Error:', error);
        res.render('404');
    }
});

// SIMPLIFIED BOOKING ROUTE - FIXED
router.post('/booking', async (req, res) => {
    try {
        console.log('=== BOOKING ATTEMPT ===');
        console.log('Session User:', req.session.user);
        console.log('Form Data:', req.body);
        
        // SIMPLE VALIDATION
        if (!req.body.fullname || !req.body.email || !req.body.phone) {
            throw new Error('Missing required fields');
        }
        
        // Calculate total amount
        const distance = parseFloat(req.body.distance) || 100;
        const pricePerKm = parseFloat(req.body.pricePerKm) || 15;
        const totalDays = parseInt(req.body.totalDays) || 1;
        
        const totalAmount = distance * pricePerKm * totalDays;
        const advancePaid = parseFloat(req.body.advancePaid) || 0;
        const balanceAmount = totalAmount - advancePaid;
        
        // Get user info (if logged in)
        let userId = 'guest';
        let userName = req.body.fullname;
        let userEmail = req.body.email;
        let userPhone = req.body.phone;
        
        if (req.session.user) {
            userId = req.session.user.id;
            userName = req.session.user.name;
            userEmail = req.session.user.email;
            userPhone = req.session.user.phone || req.body.phone;
        }
        
        // Create booking object
        const bookingData = {
            userId: userId,
            userName: userName,
            userEmail: userEmail,
            userPhone: userPhone,
            
            vehicleType: req.body.vehicleType || 'Sedan',
            vehicleName: req.body.vehicleName || 'Car',
            vehicleId: req.body.vehicleId || 'V' + Date.now().toString().slice(-6),
            
            pickupCity: req.body.pickupCity || 'Delhi',
            dropCity: req.body.dropCity || req.body.pickupCity || 'Delhi',
            pickupDate: new Date(req.body.pickupDate || Date.now()),
            dropDate: new Date(req.body.dropDate || req.body.pickupDate || Date.now()),
            pickupTime: req.body.pickupTime || '09:00',
            
            totalDays: totalDays,
            distance: distance,
            totalPassengers: parseInt(req.body.passengers) || 1,
            
            pricePerKm: pricePerKm,
            totalAmount: totalAmount,
            advancePaid: advancePaid,
            balanceAmount: balanceAmount,
            
            status: 'Pending',
            paymentStatus: advancePaid > 0 ? 'Partially Paid' : 'Pending',
            
            specialRequirements: req.body.requirements || '',
            driverRequired: true
        };
        
        console.log('Booking Data to Save:', bookingData);
        
        // Save to database
        const newBooking = new Booking(bookingData);
        await newBooking.save();
        
        console.log('✅ Booking saved successfully:', newBooking._id);
        
        // If user is logged in, update their bookings
        if (req.session.user) {
            try {
                await Register.findByIdAndUpdate(
                    req.session.user.id,
                    { $push: { bookings: newBooking._id } }
                );
                console.log('✅ User booking list updated');
            } catch (userError) {
                console.warn('⚠️ Could not update user bookings:', userError.message);
            }
        }
        
        // Success response
        res.render('booking', {
            page: 'booking',
            message: `🎉 Booking successful! Your Booking ID: ${newBooking._id.toString().slice(-8)}`,
            messageType: 'success',
            booking: newBooking
        });

    } catch (error) {
        console.error('❌ BOOKING ERROR:', error);
        console.error('Error Stack:', error.stack);
        
        res.render('booking', {
            page: 'booking',
            message: `Booking failed: ${error.message}. Please check console for details.`,
            messageType: 'error'
        });
    }
});

// 36. SESSION CHECK
router.get('/check-session', (req, res) => {
    res.json({
        loggedIn: !!req.session.user,
        user: req.session.user
    });
});


module.exports = router;