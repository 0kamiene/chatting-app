const Joi = require('joi');
const express = require('express');
const app = express();
const hbs = require('hbs');
const path = require('path');
const collection = require('./public/database');
const http = require('http');
const cors = require('cors');
const server = http.createServer(app);
const socketio = require('socket.io');
const session = require('express-session');

const PORT = process.env.PORT || 3000;
const io = socketio(server);

//connect socket.io
io.on('connection', (socket) => {

    socket.on('disconnect', () => {
        console.log('User Disconnected');
    });

    socket.on('chatMessage', messageInput => {
        io.emit('message', messageInput);
    })

});

app.use(cors());
app.use(express.json());
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, './views'));
app.use(express.static(path.join(__dirname, './public')));
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: '012345',
    resave: false,
    saveUninitialized: true
}));


app.get('/', (req, res) => {
    res.render('index')
})

app.get('/signup', (req, res) => {
    res.render('signup')
})


app.post('/', async (req, res) => {
    try {
        const check = await collection.findOne({ username: req.body.username });

        if (check) {
            if (check.password === req.body.password) {
                req.session.userId = req.body.username; // store username on session
                console.log(req.session.userId);
                res.render('dashboard', { username: req.session.userId });
            } else {
                res.send('<script>alert("Incorrect Password"); window.location.href="/";</script>');
            }
        } else {
            res.send('<script>alert("Username not found"); window.location.href="/";</script>');
        }
    }
    catch {
        res.send('<script>alert("Something Went Wrong"); window.location.href="/";</script>');
    }
});

//this is where the user can sign up
app.post('/signup', async (req, res) => {

    const dataValue = {
        name: req.body.name,
        username: req.body.username,
        password: req.body.password
    }
    if (req.body.username.length < 3 || req.body.username.length > 12) {
        res.send('<script>alert("Username must be between 3 and 12 characters long."); window.location.href="/signup";</script>')
    } else if (req.body.password.length < 6 || req.body.password.length > 20) {
        res.send('<script>alert("Password must be between 6 and 20 characters long."); window.location.href="/signup";</script>')
    } else if (req.body.name.length < 3 || req.body.name.length > 32) {
        res.send(
            '<script>alert("Name must be between 3 and 32 characters long."); window.location.href="/signup";</script>'
        );
    } else {
        try {
            const check = await collection.findOne({ username: req.body.username })
            if (check.username === req.body.username) {
                res.send('<script>alert("Username Already Taken"); window.location.href="/signup";</script>')
            }
        }
        catch {
            await collection.insertMany([dataValue])
            res.send('<script>alert("Sign up Successfully"); window.location.href="/";</script>')
        }
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        res.render('dashboard');
    }
});

app.get('/profile', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        res.render('profile');
    }
});

app.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        const user = await collection.findOne({ username: req.session.userId });
        res.render('profile', { user });
    }
});

app.get('/profile', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        collection.findOne({ username: req.session.userId }).then(user => {
            res.render('profile', { user });
        }).catch(err => {
            console.error(err);
            res.send('Error fetching user data');
        });
    }
});

app.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        try {
            const user = await collection.findOne({ username: req.session.userId });
            res.render('profile', { user });
        } catch {
            res.send('<script>alert("Something Went Wrong"); window.location.href="/";</script>');
        }
    }
});

app.post('/profile', async (req, res) => {
    try {
        const user = await collection.findOne({ username: req.session.userId });

        // Update user data with form input
        user.age = req.body.age;
        user.birthday = req.body.birthday;

        // Save updated user data to database
        await collection.updateOne({ username: req.session.userId }, { $set: user });

        // Redirect to profile page with updated user data
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/chat', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        res.render('chat');
    }
});

app.get('/account', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        res.render('account');
    }
});

app.get('/chName', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        res.render('chName');
    }
});

app.post('/chName', async (req, res) => {
    const newName = req.body.newName;
    const username = req.session.userId;
    try {
        await collection.updateOne({ username: username }, { $set: { name: newName } });
        res.send('<script>alert("Name Updated Successfully"); window.location.href="/account";</script>');
    } catch {
        res.send('<script>alert("Something Went Wrong"); window.location.href="/chName";</script>');
    }
});

app.get('/chUsername', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        res.render('chUsername');
    }
});

app.post('/chUsername', async (req, res) => {
    const oldUsername = req.session.userId;
    const newUsername = req.body.newUsername;
    try {
        // Check if the new username is already taken
        const check = await collection.findOne({ username: newUsername })
        if (check) {
            return res.send('<script>alert("Username Already Taken"); window.location.href="/chUsername";</script>')
        }
        // Update the username for the currently logged-in user in the database
        await collection.findOneAndUpdate({ username: oldUsername }, { $set: { username: newUsername } })
        // Update the session with the new username
        req.session.userId = newUsername;
        res.send('<script>alert("Username Changed Successfully"); window.location.href="/account";</script>')
    }
    catch {
        res.send('<script>alert("Something Went Wrong"); window.location.href="/chUsername";</script>');
    }
});

app.get('/chPassword', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        res.render('chPassword');
    }
});

app.post('/chPassword', async (req, res) => {
    try {
        if (req.body.newPassword.length < 6 || req.body.newPassword.length > 20) {
            res.send('<script>alert("Password must be between 6 and 20 characters long"); window.location.href="/chPassword";</script>');
            return;
        }
        const check = await collection.findOne({ username: req.session.userId });
        if (check) {
            if (check.password === req.body.currentPassword) {
                if (req.body.newPassword === req.body.confirmPassword) {
                    const update = await collection.updateOne({ username: req.session.userId }, { $set: { password: req.body.newPassword } });
                    if (update.modifiedCount > 0) {
                        res.send('<script>alert("Password updated successfully"); window.location.href="/account";</script>');
                    } else {
                        res.send('<script>alert("Failed to update password. Please try again"); window.location.href="/chPassword";</script>');
                    }
                } else {
                    res.send('<script>alert("New Password and Confirm Password did not match"); window.location.href="/chPassword";</script>');
                }
            } else {
                res.send('<script>alert("Current Password is incorrect"); window.location.href="/chPassword";</script>');
            }
        } else {
            res.send('<script>alert("User not found"); window.location.href="/";</script>');
        }
    } catch {
        res.send('<script>alert("Something went wrong"); window.location.href="/chPassword";</script>');
    }
});


app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Now using port ${PORT}...`)
});
