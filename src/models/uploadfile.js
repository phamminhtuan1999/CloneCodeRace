var mongoose = require('mongoose');
var files=new mongoose.Schema({
    ten:{type:String},
   //gia:{type:Number},
    description:{type:String},
    files:{type:Array}
},{collection:"uploadfile"});
module.exports=mongoose.model('uploadfile',files);