const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

let bookings = [];
let users = [];
let bookingId = 1;
let userId = 1;

users.push({
    id: userId++,
    username: "admin",
    phone: "+77751331727",
    password: "Admin123",
    role: "admin"
});

app.get('/', (req, res) => {
    res.send('Server is working');
});

//registr
//registr
app.post('/register', (req, res) => {
    const { username, phone, password } = req.body;

    if (!username || !phone || !password) {
        return res.status(400).json({
            message: "Missing fields"
        });
    }

    // login validation
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return res.status(400).json({
            message: "Login must contain only letters and numbers"
        });
    }

    // phone validation
    if (!/^\+?[0-9]+$/.test(phone)) {
        return res.status(400).json({
            message: "Phone must contain only numbers"
        });
    }

    // password validation
    if (
        password.length < 6 ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password)
    ) {
        return res.status(400).json({
            message: "Password must contain minimum 6 symbols, 1 capital letter and 1 number"
        });
    }

    const exists = users.find(
        u => u.username === username || u.phone === phone
    );

    if (exists) {
        return res.status(400).json({
            message: "User already exists"
        });
    }

    const user = {
        id: userId++,
        username,
        phone,
        password,
        role: "user"
    };

    users.push(user);

    res.status(201).json({
        message: "Registered successfully"
    });
});

//login
app.post('/login', (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({
            message: "Missing fields"
        });
    }

    const user = users.find(
        u => u.phone === phone && u.password === password
    );

    if (!user) {
        return res.status(401).json({
            message: "Invalid phone or password"
        });
    }

    res.json({
        message: "Login success",
        token: String(user.id),
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    });
});
//auth middleware
function auth(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "No token" });
    }

    const user = users.find(u => u.id == token);

    if (!user) {
        return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
}

function adminOnly(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
    }

    next();
}

//get vse
app.get('/bookings', auth, (req, res) => {
    const userBookings = bookings.filter(b => b.userId === req.user.id);
    res.json(userBookings);
});

//get odin
app.get('/bookings/:id', auth, (req, res) => {
    const booking = bookings.find(
        b => b.id == req.params.id && b.userId === req.user.id
    );

    if (!booking) {
        return res.status(404).json({ message: "Not found" });
    }

    res.json(booking);
});

//sozdat
app.post('/bookings', auth, (req, res) => {
    const { roomName, date, time, duration } = req.body;

    if (
    isNaN(duration) ||
    duration <= 0 ||
    duration > 8
) {
    return res.status(400).json({
        message: "Duration must be between 1 and 8 hours"
    });
}

    if (!roomName || !date || !time || !duration) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const booking = {
        id: bookingId++,
        userId: req.user.id,
        roomName,
        date,
        time,
        duration,
        status: "active"
    };

    bookings.push(booking);

    res.status(201).json(booking);
});

//obnovit status
app.patch('/bookings/:id', auth, (req, res) => {
    const booking = bookings.find(
        b => b.id == req.params.id && b.userId === req.user.id
    );

    if (!booking) {
        return res.status(404).json({ message: "Not found" });
    }

    const { status } = req.body;

    if (status !== "active" && status !== "cancelled") {
        return res.status(400).json({ message: "Status must be active or cancelled" });
    }

    booking.status = status;

    res.json(booking);
});

//delete
app.delete('/bookings/:id', auth, (req, res) => {
    const index = bookings.findIndex(
        b => b.id == req.params.id && b.userId === req.user.id
    );

    if (index === -1) {
        return res.status(404).json({ message: "Not found" });
    }

    bookings.splice(index, 1);

    res.json({ message: "Deleted" });
});

// admin get all bookings
app.get('/admin/bookings', auth, adminOnly, (req, res) => {
    const result = bookings.map(booking => {
        const user = users.find(u => u.id === booking.userId);

        return {
            ...booking,
            username: user ? user.username : "Unknown"
        };
    });

    res.json(result);
});

// admin update booking status
app.patch('/admin/bookings/:id', auth, adminOnly, (req, res) => {
    const booking = bookings.find(b => b.id == req.params.id);

    if (!booking) {
        return res.status(404).json({ message: "Not found" });
    }

    const { status } = req.body;

    if (status !== "active" && status !== "cancelled") {
        return res.status(400).json({ message: "Status must be active or cancelled" });
    }

    booking.status = status;

    res.json(booking);
});

// admin delete booking
app.delete('/admin/bookings/:id', auth, adminOnly, (req, res) => {
    const index = bookings.findIndex(b => b.id == req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: "Not found" });
    }

    bookings.splice(index, 1);

    res.json({ message: "Deleted by admin" });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});