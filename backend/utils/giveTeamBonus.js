const BonusLedger=require("../models/BonusLedger");
const WalletHistory=require("../models/WalletHistory");
const User=require("../models/User");



async function giveTeamBonus(user){

try{


const sponsor1=await User.findOne({
referCode:user.referredBy
});


if(!sponsor1) return;



const sponsor2=await User.findOne({
referCode:sponsor1.referredBy
});


const sponsor3=await User.findOne({
referCode:sponsor2?.referredBy
});


const sponsor4=await User.findOne({
referCode:sponsor3?.referredBy
});



const levels=[

{
user:sponsor2,
amount:70,
level:1
},

{
user:sponsor3,
amount:50,
level:2
},

{
user:sponsor4,
amount:35,
level:3
}

];




for(const lv of levels){


if(!lv.user) continue;



if(lv.user.teamBonusStatus==="inactive")
continue;




lv.user.wallet+=lv.amount;

lv.user.teamIncome+=lv.amount;



await lv.user.save();




await BonusLedger.create({


email:lv.user.email,

fromEmail:user.email,

fromName:user.name,


bonusType:"team",


type:"Team Bonus",

level:lv.level,

amount:lv.amount,


status:"Paid",


note:`Level ${lv.level} Team Bonus`



});





await WalletHistory.create({


email:lv.user.email,


type:"Credit",

amount:lv.amount,


title:"Team Bonus",


description:
`Level ${lv.level} Team Bonus from ${user.name}`



});



}




}catch(err){

console.log(err);

}



}



module.exports=giveTeamBonus;
