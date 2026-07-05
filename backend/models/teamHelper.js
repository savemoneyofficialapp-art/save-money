const User = require("./User");

async function getUplines(user, maxLevel = 5) {

  const uplines = [];

  let current = user;

  for (let level = 1; level <= maxLevel; level++) {

    if (!current.referredBy) break;

    const sponsor = await User.findOne({
      referCode: current.referredBy
    });

    if (!sponsor) break;

    uplines.push({
      level,
      user: sponsor
    });

    current = sponsor;
  }

  return uplines;
}

function teamBonusAmount(level) {

  switch (level) {

    case 1:
      return 0;

    case 2:
      return 50;

    case 3:
      return 40;

    case 4:
      return 30;

    case 5:
      return 20;

    default:
      return 0;

  }

}

module.exports = {

  getUplines,

  teamBonusAmount

};
