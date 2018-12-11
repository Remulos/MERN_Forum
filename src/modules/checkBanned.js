const isEmpty = require('../modules/is-empty');

module.exports = checkBanned = () => {
	return (req, res, next) => {
		if (isEmpty(req.user.ban)) {
			for (const ban of req.user.ban) {
				const currentBan = Date.now() - ban.end;

				if (currentBan >= 0) {
					next();
				} else {
					return res
						.status(403)
						.json(
							`You are currently banned from posting until ${
								ban.end
							} for ${ban.reason}`
						);
				}
			}
		} else {
			next();
		}
	};
};
