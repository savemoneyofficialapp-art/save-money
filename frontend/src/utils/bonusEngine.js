const User = require("../models/User");
const WalletHistory = require("../models/WalletHistory");
const BonusLedger = require("../models/BonusLedger");
const Investment = require("../models/Investment");

async function addWallet(

email,
amount,
title,
description

){

const user = await User.findOne({email});


if(!user) return;



user.wallet += amount;


user.totalIncome += amount;



await user.save();




await WalletHistory.create({


email:user.email,


type:title,


amount,


balance:user.wallet,


title,


description,


status:"Success"



});


}

async function saveBonusLedger({


email,

fromUser,

fromName,

fromMobile,

fromPhoto,


bonusType,

type,


level,

amount,

businessAmount=0,


note=""



}){



await BonusLedger.create({


email,


fromEmail:fromUser,


fromName,


fromMobile,


fromPhoto,


bonusType,


type,


level,


amount,


businessAmount,


note,



month:new Date().getMonth()+1,


year:new Date().getFullYear()



});



}



async function giveReferBonus(investment){

const user = await User.findOne({
email:investment.email
});

if(!user) return;



if(!user.referredBy) return;



const sponsor = await User.findOne({

referCode:user.referredBy

});


if(!sponsor) return;



/*
Admin Disable
*/

if(sponsor.disableBonus)
return;




/*
Sponsor Active Check
*/

const sponsorInvestment = await Investment.findOne({

email:sponsor.email,

status:"Active"

});


if(!sponsorInvestment)
return;




/*
First Investment Only
*/


if(user.firstInvestmentDone)
return;




let bonus=0;



switch(investment.planYears){

case 1:

bonus=499;

break;


case 3:

bonus=599;

break;


case 5:

bonus=699;

break;


case 10:

bonus=799;

break;


default:

bonus=0;


}



if(bonus<=0)
return;





sponsor.referIncome += bonus;

sponsor.wallet += bonus;

sponsor.totalIncome += bonus;



await sponsor.save();




await addWallet(


sponsor.email,


bonus,


"Refer Bonus",


`Refer Bonus Added from ${user.name}`


);




await saveBonusLedger({



email:sponsor.email,


fromUser:user.email,


fromName:user.name,


fromMobile:user.mobile,


fromPhoto:user.photo,



bonusType:"refer",



type:"Refer Bonus",



level:1,


amount:bonus,


businessAmount:investment.amount,



note:"First Investment Referral"



});





user.firstInvestmentDone=true;


user.firstInvestmentDate=new Date();


await user.save();



}

module.exports={

addWallet,

saveBonusLedger,

giveReferBonus

}
