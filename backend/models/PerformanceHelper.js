const User = require("./User");
const Investment = require("./Investment");

async function updatePerformanceStatus(email) {

    const user = await User.findOne({
        email: String(email).toLowerCase()
    });

    if (!user) return;

    // Admin manually control করছে
    if (user.performanceAdminOverride) {
        return;
    }

    // আগেই Active
    if (user.performanceEnabled) {
        return;
    }

    // 30 days শেষ
    if (
        user.performanceExpireDate &&
        new Date() > user.performanceExpireDate
    ) {

        user.performanceStatus = "Expired";
        await user.save();
        return;
    }

    // Direct referrals
    const directs = await User.find({
        referredBy: user.referCode || user.walletId
    });

    let qualified = 0;

    for (const d of directs) {

        const firstInvestment =
            await Investment.findOne({
                email: d.email.toLowerCase(),
                status: "Active"
            });

        if (firstInvestment) {
            qualified++;
        }

    }

    if (qualified >= 10) {

        user.performanceEnabled = true;

        user.performanceCompleted = true;

        user.performanceStatus = "Active";

        user.performanceActivatedAt = new Date();

        user.performanceActivatedBy = "AUTO";

        await user.save();

    }

}

module.exports = {
    updatePerformanceStatus
};
