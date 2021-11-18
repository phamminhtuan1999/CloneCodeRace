var mongoose = require('mongoose');


var admintration = new mongoose.Schema({
    createProblem:{type:Boolean,default:1},
    createContest:{type:Boolean,default:1},
    
});

var Admintration = mongoose.model('Administrative', admintration);

module.exports = Admintration;
