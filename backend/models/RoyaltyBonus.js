const mongoose=require("mongoose");

const schema=new mongoose.Schema({


email:String,


directCount:{
type:Number,
default:0
},


requiredDirect:{
type:Number,
default:50
},



isActive:{
type:Boolean,
default:false
},



isFailed:{
type:Boolean,
default:false
},



wallet:{
type:Number,
default:0
},



thisMonthBusiness:{
type:Number,
default:0
},



totalBusiness:{
type:Number,
default:0
},



totalEarned:{
type:Number,
default:0
},




history:[{

fromUser:String,

investAmount:Number,

royalty:Number,

date:Date

}]



});


module.exports=mongoose.model(

"RoyaltyBonus",
schema

);
