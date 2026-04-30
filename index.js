const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');

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

const DATA_FILE = 'data.json';

if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));

    bookings = data.bookings || [];
    users = data.users || [];
    bookingId = data.bookingId || 1;
    userId = data.userId || 1;
}

function saveData() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify({
            bookings,
            users,
            bookingId,
            userId
        }, null, 2)
    );
}

if (!users.find(u => u.role === "admin")) {
    users.push({
        id: userId++,
        username: "admin",
        phone: "+77751331727",
        password: "Admin123",
        role: "admin"
    });

    saveData();
}

app.get('/', (req, res) => {
    res.send('Server is working');
});

//registr
app.post('/register', (req, res) => {
    const { username, phone, password } = req.body;

    if (!username || !phone || !password) {
        return res.status(400).json({
            message: "Заполните все поля"
        });
    }

    //login validation
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return res.status(400).json({
            message: "Логин должен содержать только буквы и цифры"
        });
    }

    //phone validation
    if (!/^\+?[0-9]+$/.test(phone)) {
        return res.status(400).json({
            message: "Телефон должен содержать только цифры и может начинаться с +"
        });
    }

    //password validation
    if (
        password.length < 6 ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password)
    ) {
        return res.status(400).json({
            message: "Пароль должен содержать минимум 6 символов, 1 заглавную букву и 1 цифру"
        });
    }

    const exists = users.find(
        u => u.username === username || u.phone === phone
    );

    if (exists) {
        return res.status(400).json({
            message: "Такой пользователь уже существует"
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
    saveData();

    res.status(201).json({
        message: "Регистрация прошла успешно"
    });
});

//login
app.post('/login', (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({
            message: "Заполните все поля"
        });
    }

    const user = users.find(
        u => u.phone === phone && u.password === password
    );

    if (!user) {
        return res.status(401).json({
            message: "Неверный номер телефона или пароль"
        });
    }

    res.json({
        message: "Вход выполнен успешно",
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
        return res.status(401).json({ message: "Нет токена" });
    }

    const user = users.find(u => u.id == token);

    if (!user) {
        return res.status(401).json({ message: "Неверный токен" });
    }

    req.user = user;
    next();
}

function adminOnly(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Доступ только для администратора" });
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
        return res.status(404).json({ message: "Бронирование не найдено" });
    }

    res.json(booking);
});

//sozdat
app.post('/bookings', auth, (req, res) => {
    const { roomName, date, time, duration } = req.body;

    if (!roomName || !date || !time || !duration) {
        return res.status(400).json({ message: "Заполните все поля" });
    }

    if (
        isNaN(duration) ||
        duration <= 0 ||
        duration > 8
    ) {
        return res.status(400).json({
            message: "Длительность должна быть от 1 до 8 часов"
        });
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
    saveData();

    res.status(201).json(booking);
});

//obnovit status
app.patch('/bookings/:id', auth, (req, res) => {
    const booking = bookings.find(
        b => b.id == req.params.id && b.userId === req.user.id
    );

    if (!booking) {
        return res.status(404).json({ message: "Бронирование не найдено" });
    }

    const { status } = req.body;

    if (status !== "active" && status !== "cancelled") {
        return res.status(400).json({ message: "Статус должен быть active или cancelled" });
    }

    booking.status = status;
    saveData();

    res.json(booking);
});

//delete
app.delete('/bookings/:id', auth, (req, res) => {
    const index = bookings.findIndex(
        b => b.id == req.params.id && b.userId === req.user.id
    );

    if (index === -1) {
        return res.status(404).json({ message: "Бронирование не найдено" });
    }

    bookings.splice(index, 1);
    saveData();

    res.json({ message: "Бронирование удалено" });
});

//admin get all bookings
app.get('/admin/bookings', auth, adminOnly, (req, res) => {
    const result = bookings.map(booking => {
        const user = users.find(u => u.id === booking.userId);

        return {
            ...booking,
            username: user ? user.username : "Неизвестно"
        };
    });

    res.json(result);
});

//admin update booking status
app.patch('/admin/bookings/:id', auth, adminOnly, (req, res) => {
    const booking = bookings.find(b => b.id == req.params.id);

    if (!booking) {
        return res.status(404).json({ message: "Бронирование не найдено" });
    }

    const { status } = req.body;

    if (status !== "active" && status !== "cancelled") {
        return res.status(400).json({ message: "Статус должен быть active или cancelled" });
    }

    booking.status = status;
    saveData();

    res.json(booking);
});

//admin delete booking
app.delete('/admin/bookings/:id', auth, adminOnly, (req, res) => {
    const index = bookings.findIndex(b => b.id == req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: "Бронирование не найдено" });
    }

    bookings.splice(index, 1);
    saveData();

    res.json({ message: "Бронирование удалено администратором" });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});