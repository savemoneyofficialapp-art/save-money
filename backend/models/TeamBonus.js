const mongoose=require("mongoose");


const schema=new mongoose.Schema({


email:String,



challengeStart:{
type:Date,
default:Date.now
},



directCount:{
type:Number,
default:0
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

deactivatedAt:Date,

updatedAt:Date,





history:[


{

fromUser:String,


fromEmail:String,



level:Number,



amount:Number,



status:{
type:String,
default:"Paid"
},



date:{
type:Date,
default:Date.now
}


}


]


});



module.exports=
mongoose.model(
"TeamBonus",
schema
);
