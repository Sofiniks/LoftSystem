const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const newsSchema = new Schema({
    created_at: Date,
    text: String,
    title: String,
    id: String,
    user: {
        firstName: String,
        id: String,
        image: String,
        middleName: String,
        surName: String,
        userName: String
    },
    versionKey: false,
})

const News = mongoose.model('news', newsSchema);

module.exports = News;