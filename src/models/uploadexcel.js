var mongoose = require('mongoose');
var dataexcel=new mongoose.Schema({
    description:{type:String},
    filesexcel:{type:String},
},{collection:"uploadexcel"});
module.exports=mongoose.model('uploadexcel',dataexcel);