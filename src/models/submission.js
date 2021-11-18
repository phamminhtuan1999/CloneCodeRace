var mongoose = require('mongoose');
const Double = require('@mongoosejs/double');

var Submission = new mongoose.Schema({
    username: String,
    qID: Number,
    skill: Array,
    subID: Number,
    code: String,
    language: String,
    verdict: String,
    time: Double,
    memory: Number,
    ratesuccesstestcase:{type:Number,default:0},
    isVisible: Boolean,
    timeStamp: Date,
    tc: [{ status: String, time: Double, memory: Number }]
});
var submission = mongoose.model('submission', Submission);
module.exports = submission;
