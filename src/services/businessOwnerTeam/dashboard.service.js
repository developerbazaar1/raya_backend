const Event = require('../../models/businessOwnerTeam/event.model');
const User = require('../../models/shared/users.model');

exports.getDashboardService = async (userId, query) => {
    const user = await User.findById(userId);

    const businessOwnerId = user.owner;

    const todayEvents = await Event.find({
        createdByUserId: {
            $in: [userId, businessOwnerId]
        }
    })
        .sort({ createdAt: -1 })
        .limit(2)
        .select('eventName date');

    return {
        todayEvents
    };
};
