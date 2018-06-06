var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
    title: {
        type: String,
        required: false
    },
    link: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        default: "The summary is unavailable, just click and see"
    },
    img: {
        type: String,
        default: "some link goes here"
    },
    saved: {
        type: Boolean,
        default: false
    },
    notes: {
        type: Schema.Types.ObjectId,
        ref: "Note"
    },
    created: {
        type: Date,
        default: Date.now
    }
})

var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;