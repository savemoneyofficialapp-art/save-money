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






const within30Days =


new Date()

<=

user.performanceExpireDate;





if(

totalDirect>=10

&&

within30Days

){

user.performanceEnabled=true;

user.performanceStatus="Active";


await user.save();

return;

}




if(

!user.performanceEnabled

&&

new Date()

>

user.performanceExpireDate

){

user.performanceStatus="Expired";

await user.save();

}


}



module.exports={
updatePerformanceStatus
};
