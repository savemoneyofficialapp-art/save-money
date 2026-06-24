const mongoose = require("mongoose");

const autoWithdrawSchema = new mongoose.Schema({

name:String,

email:String,

walletId:String,

amount:Number,

status:{
type:String,
default:"Pending"
},

bankDetails:Object,

createdAt:{
type:Date,
default:Date.now
},

actionDate:Date,

rejectReason:String

});


module.exports = mongoose.model(
"AutoWithdraw",
autoWithdrawSchema
);
