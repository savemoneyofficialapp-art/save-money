const mongoose=require("mongoose");


const schema=new mongoose.Schema({


email:String,


challengeStart:{
type:Date,
default:Date.now
},

deadline:Date,


directCount:{
type:Number,
default:0
},



required:{
type:Number,
default:10
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



activatedAt:Date,

failedAt:Date,



history:[

{

fromUser:String,

fromEmail:String,


amount:Number,


planYears:Number,


date:{
type:Date,
default:Date.now
},


status:{
type:String,
default:"Paid"
}

}

]



});



module.exports=
mongoose.model(
"PerformanceBonus",
schema
);
