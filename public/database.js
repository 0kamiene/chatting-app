const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://admin:admin@cluster0.ls1sccs.mongodb.net/chatters')

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', () => {
    console.log('Connected to MongoDB server');
});

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true

    },
    username: {
        type: String,
        required: true

    },
    password: {
        type: String,
        required: true

    },
    age: {
        type: String,
        require: true
    },
    birthday: {
        type: String,
        require: true
    },
    gender: {
        type: String,
        require: true
    }
})

const collection = new mongoose.model("loginIndexes", schema)

module.exports = collection