module.exports = checkBanned = () => {
	return (req, res, next) => {
		if (req.user.ban) {
			for (const ban of req.user.ban) {
				const currentBan = Date.now() - ban.end;

				if (currentBan <= 0) {
					next();
				} else {
					res.status(403).json(
						`You are currently banned from posting until ${
							ban.endDate
						} for ${ban.reason}`
					);
				}
			}
		} else {
			next();
		}
	};
};
