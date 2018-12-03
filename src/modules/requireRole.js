// Permissions validator for routes
module.exports = requireRole = role => {
	return (req, res, next) => {
		if (req.user.role === role) {
			next();
		} else {
			res.status(403).json('Insufficient permissions to access route.');
		}
	};
};
