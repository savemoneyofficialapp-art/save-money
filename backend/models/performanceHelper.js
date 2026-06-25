const User=require("./User");


async function updatePerformanceStatus(email){

const user=await User.findOne({
email
});

if(!user) return;


/*
Admin manually active করেছে
তাহলে আর auto check করবে না
*/

if(user.performanceAdminOverride)
return;


/*
আগেই active
*/

if(user.performanceEnabled)
return;



const totalDirect=

await User.countDocuments({

referredBy:user.walletId,

activeStatus:"Active"

});



const now=new Date();



if(

totalDirect>=10

&&

now<=user.performanceExpireDate

){

user.performanceEnabled=true;

user.performanceStatus="Active";

await user.save();

return;

}



if(

now>

user.performanceExpireDate

){

user.performanceStatus="Expired";

await user.save();

}


}



module.exports={
updatePerformanceStatus
};
