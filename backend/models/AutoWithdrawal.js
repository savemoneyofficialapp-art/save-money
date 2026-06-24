const mongoose=require("mongoose");

const schema=new mongoose.Schema({

email:String,

name:String,

walletId:String,

amount:Number,


bankName:String,

accountName:String,

accountNumber:String,

ifsc:String,

upiId:String,


status:{
type:String,
default:"Pending"
},


createdAt:{
type:Date,
default:Date.now
}


});


module.exports=
mongoose.model(
"AutoWithdrawal",
schema
);
