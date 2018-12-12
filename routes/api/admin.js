const express = require('express');
const router = express.Router();
const passport = require('passport');
const recursive = require('recursive-readdir');
const fs = require('fs');

// Load models
const User = require('../../models/User').User;
const Post = require('../../models/Post');
const Upload = require('../../models/Upload');
const Report = require('../../models/Report').Report;
const ArchivedReport = require('../../models/Report').ArchivedReport;
const Comment = require('../../models/Comment');
const Division = require('../../models/Division');
const Application = require('../../models/Application').Application;
const ArchivedApplication = require('../../models/Application')
	.ArchivedApplication;

const requireRole = require('../../src/modules/requireRole');
const ifFile = require('../../src/modules/ifFile');
const isEmpty = require('../../src/modules/is-empty');
const fileUpload = require('../../src/modules/fileUpload');

// @route   GET admin/total-users
// @desc    Get total number of users
// @access  Admin
router.get(
	'/total-users',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		User.countDocuments((err, count) => {
			if (err) {
				res.status(400).json(err);
			} else {
				res.status(200).json(count);
			}
		});
	}
);

// @route   GET admin/total-posts
// @desc    Get total number of posts in database
// @access  Admin
router.get(
	'/total-posts',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Post.countDocuments((err, count) => {
			if (err) {
				res.status(400).json(err);
			} else {
				res.status(200).json(count);
			}
		});
	}
);

// @route   GET admin/total-uploads
// @desc    Get total number of uploads in file system
// @access  Admin
router.get(
	'/total-uploads',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		recursive('./uploads', (err, files) => {
			if (err) res.status(400).json(err);
			if (files) {
				const numFiles = files.length;
				res.status(200).json(numFiles);
			}
		});
	}
);

// @route   GET admin/total-comments
// @desc    Get total number of comments in file system
// @access  Admin
router.get(
	'/total-comments',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Comment.countDocuments((err, count) => {
			if (err) res.json(err);
			else res.json(count);
		});
	}
);

// @route   GET admin/total-reports/active
// @desc    Get total number of reports in file system
// @access  Admin
router.get(
	'/total-reports/active',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Report.countDocuments((err, count) => {
			if (err) res.json(err);
			else res.json(count);
		});
	}
);

// @route   GET admin/total-reports/resolved
// @desc    Get total number of archived reports in file system
// @access  Admin
router.get(
	'/total-reports/resolved',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		ArchivedReport.countDocuments((err, count) => {
			if (err) res.json(err);
			else res.json(count);
		});
	}
);

// @route   GET admin/total-applications/
// @desc    Get total number of unresolved applications
// @access  Admin
router.get(
	'/total-applications',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Application.countDocuments((err, count) => {
			if (err) res.json(err);
			else res.json(count);
		});
	}
);

// @route   GET admin/users/find?handle&page
// @desc    Find users by handle
// @access  Admin
// TODO - Remove user password from returned information
router.get(
	'/users/find',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		const skip = (req.query.page - 1) * 25;
		// Search entire 'users' collection by handle for the regular expression of the search query
		User.find(
			{ handle: { $regex: req.query.handle, $options: 'i' } },
			null,
			[{ limit: 25 }, { skip: skip }]
		)
			.then(user => {
				res.status(200).json(user);
			})
			.catch(err => res.status(404).json({ Error: 'No users found.' }));
	}
);

// @route   GET admin/user/:id
// @desc    Find user
// @access  Admin
// TODO - Remove user password from returned information
router.get(
	'/user/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		User.findById(req.params.id)
			.then(user => {
				res.status(200).json(user);
			})
			.catch(err =>
				res
					.status(404)
					.json({ Error: 'No user found with this handle.' })
			);
	}
);

// @route   PUT admin/user/:id
// @desc    Find user and edit
// @access  Admin
router.put(
	'/user/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	fileUpload.fields([
		{ name: 'avatar', maxCount: 1 },
		{ name: 'coverphoto', maxCount: 1 },
	]),
	(req, res) => {
		// Create an object to store all configurable user settings and if new values are in the request body, add them to the object.
		const accountSettings = {};
		if (req.body.name) accountSettings.name = req.body.name;
		if (req.body.handle) accountSettings.handle = req.body.handle;
		if (req.body.email) accountSettings.email = req.body.email;
		if (req.body.dob) accountSettings.dob = req.body.dob;
		if (req.body.timezone) accountSettings.timezone = req.body.timezone;
		if (req.body.role) accountSettings.role = req.body.role;
		if (req.body.signature) accountSettings.signature = req.body.signature;

		accountSettings.preferences = {};
		if (req.body.newsletter)
			accountSettings.preferences.newsletter = req.body.newsletter;
		if (req.body.autofollowpost)
			accountSettings.preferences.autofollowpost =
				req.body.autofollowpost;
		if (req.body.autofollowreply)
			accountSettings.preferences.autofollowreply =
				req.body.autofollowreply;
		if (req.body.shownotificationpopup)
			accountSettings.preferences.shownotificationpopup =
				req.body.shownotificationpopup;
		if (req.body.singleemailbetweenvisit)
			accountSettings.preferences.singleemailbetweenvisit =
				req.body.singleemailbetweenvisit;
		if (req.body.playnotificationsound)
			accountSettings.preferences.playnotificationsound =
				req.body.playnotificationsound;
		if (req.body.receivemessage)
			accountSettings.preferences.receivemessage =
				req.body.receivemessage;
		if (req.body.addedtoconvo)
			accountSettings.preferences.addedtoconvo = req.body.addedtoconvo;
		if (req.body.contentfollownew)
			accountSettings.preferences.contentfollownew =
				req.body.contentfollownew;
		if (req.body.contentfollowcomment)
			accountSettings.preferences.contentfollowcomment =
				req.body.contentfollowcomment;
		if (req.body.contentfollowreview)
			accountSettings.preferences.contentfollowreview =
				req.body.contentfollowreview;
		if (req.body.personfollowpost)
			accountSettings.preferences.personfollowpost =
				req.body.personfollowpost;
		if (req.body.selfquoted)
			accountSettings.preferences.selfquoted = req.body.selfquoted;
		if (req.body.selfmention)
			accountSettings.preferences.selfmention = req.body.selfmention;
		if (req.body.selfcontentrep)
			accountSettings.preferences.selfcontentrep =
				req.body.selfcontentrep;
		if (req.body.selffollow)
			accountSettings.preferences.selffollow = req.body.selffollow;
		if (req.body.selfprofilepost)
			accountSettings.preferences.selfprofilepost =
				req.body.selfprofilepost;
		if (req.body.statusreply)
			accountSettings.preferences.statusreply = req.body.statusreply;
		if (req.body.personfollowstatus)
			accountSettings.preferences.personfollowstatus =
				req.body.personfollowstatus;
		if (req.body.selfclubinvite)
			accountSettings.preferences.selfclubinvite =
				req.body.selfclubinvite;
		if (req.body.selfclubrequestresponse)
			accountSettings.preferences.selfclubrequestresponse =
				req.body.selfclubrequestresponse;
		if (req.body.memberclubrequest)
			accountSettings.preferences.memberclubrequest =
				req.body.memberclubrequest;
		if (req.body.memberjoinclub)
			accountSettings.preferences.memberjoinclub =
				req.body.memberjoinclub;
		if (req.body.eventreminders)
			accountSettings.preferences.eventreminders =
				req.body.eventreminders;

		if (req.body.avatar) accountSettings.avatar = req.body.avatar;
		if (req.body.coverphoto)
			accountSettings.coverphoto = req.body.coverphoto;
		if (req.body.gender) accountSettings.gender = req.body.gender;
		if (req.body.location) accountSettings.location = req.body.location;

		if (typeof req.body.interests !== 'undefined') {
			accountSettings.interests = req.body.interests.split(',');
		}

		if (req.body.division) accountSettings.divisions = req.body.divisions;

		User.findById(req.params.id, (err, user) => {
			if (err) res.status(404).json(err);
			else {
				// Create an Async function to ensure that if we have files we can return the new user profile once they are uploaded.
				const updateSettings = async () => {
					// If the request contains files
					if (!isEmpty(req.files)) {
						// If the request files contain an avatar
						if (!isEmpty(req.files['avatar'])) {
							// If the current user avatar already exists
							if (user.avatar) {
								// Find record of existing upload and pass the path into fs.unlink() to delete from the file system
								await Upload.findById(
									user.avatar,
									(err, oldUpload) => {
										if (err) console.log(err);
										else if (oldUpload === null)
											res.json({
												Error:
													'cant find existing avatar',
											});
										// Delete file from file system
										fs.unlink(oldUpload.path, err => {
											if (err) console.log(err);
										});

										// Delete file document from collection
										Upload.findByIdAndDelete(
											oldUpload.id,
											err => {
												if (err)
													res.json(
														`Delete document: ${err}`
													);
											}
										);
									}
								);
							}
							// New avatar = new upload document
							const avatar = await ifFile(req, 'avatar');

							// Add new upload document to accountSettings object
							accountSettings.avatar = avatar._id;

							// Find the new upload document and add user id
							await Upload.findByIdAndUpdate(
								avatar._id,
								{
									$set: { user: user.id },
								},
								{ new: true }
							).catch(err => console.log(err));
						}

						// If the request files contain a coverphoto
						if (!isEmpty(req.files['coverphoto'])) {
							// If the current user coverphoto already exists
							if (user.coverphoto) {
								// Find record of existing upload and pass into fs.unlink() to delete from the file system
								await Upload.findById(
									user.coverphoto,
									(err, oldUpload) => {
										if (err) console.log(err);
										else if (oldUpload === null)
											res.json({
												Error:
													'cant find existing coverphoto',
											});
										// Delete file from file system
										fs.unlink(oldUpload.path, err => {
											if (err) res.json(err);
										});

										// Delete file document from collection
										Upload.findByIdAndDelete(
											oldUpload.id,
											err => {
												if (err) console.log(err);
											}
										);
									}
								);
							}

							// New coverphoto = new upload document
							const coverphoto = await ifFile(req, 'coverphoto');

							// Add new upload document to accountSettings object
							accountSettings.coverphoto = coverphoto._id;

							// Find the new upload document and add user id
							await Upload.findByIdAndUpdate(
								coverphoto._id,
								{
									$set: { user: user.id },
								},
								{ new: true }
							).catch(err => console.log(err));
						}
					}
					// Find and update the user document using the accountSettings object.
					await User.findByIdAndUpdate(
						user.id,
						{ $set: accountSettings },
						{ new: true },
						(err, user) => {
							err ? res.json(err) : res.json(user);
						}
					)
						.populate('avatar', ['filename', 'path'])
						.populate('coverphoto', ['filename', 'path'])
						.populate({
							path: 'following',
							populate: {
								path: 'user',
								model: ['handle', 'avatar'],
							},
						})
						.catch(err => console.log(err));
				};
				updateSettings().catch(err => console.log(err));
			}
		});
	}
);

// @route   DELETE admin/upload/remove/:id
// @desc    Find user upload and delete it.
// @access  Admin
router.delete(
	'/upload/remove/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		// Make sure an upload document exists with the provided id.
		Upload.findByIdAndRemove(req.params.id, (err, upload) => {
			if (err) res.status(404).json(err);
			else {
				// Find any user who is using this upload as an avatar or cover photo.
				User.findOne(
					{
						$or: [
							{ avatar: upload._id },
							{ coverphoto: upload._id },
						],
					},
					(err, user) => {
						if (err) res.status(404).json(err);
						if (user.avatar.toString() === upload._id.toString()) {
							user.avatar = undefined;
						} else if (
							user.coverphoto.toString() === upload._id.toString()
						) {
							user.coverphoto = undefined;
						}
						user.save()
							.then(user => res.json(user))
							.catch(err => res.json(err));
					}
				);
				fs.unlink(upload.path, err => {
					if (err) res.json(err);
				});
			}
		});
	}
);

// @route		PUT admin/user/unban/:id/:ban
// @desc		Find user and remove ban from account
// @access	Admin
router.put(
	'/user/unban/:id/:ban',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		User.findById(req.params.id).then(user => {
			const endIndex = user.ban
				.map(ban => ban.id)
				.indexOf(req.params.ban);

			if (endIndex === -1) {
				res.status(404).json({ Error: 'Ban ID not found' });
			} else {
				user.ban.splice(endIndex, 1);

				const endingBan = {
					reason: req.body.reason,
					start: user.ban[endIndex].start,
					end: Date.now(),
				};

				user.ban.splice(endIndex, 0, endingBan);
				user.save((err, user) => {
					err ? res.json(err) : res.json(user);
				});
			}
		});
	}
);

// @route		GET admin/reports/?page&handle&reporter&catagory&type
// @desc		Retrieve all reports
// @access	Admin
router.get(
	'/reports',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const options = {
			limit: 25,
			populate: {
				path: 'user',
				select:
					'name handle email dob registerdate interests lastloggedin',
			},
		};
		if (req.query.page) options.page = req.query.page;

		const search = {};
		if (req.query.handle)
			search.itemowner = { $regex: req.query.itemowner, $options: 'i' };
		if (req.query.reporter)
			search.reporter = { $regex: req.query.reporter, $options: 'i' };
		if (req.query.category)
			search.category = { $regex: req.query.category, $options: 'i' };
		if (req.query.type)
			search.type = { $regex: req.query.type, $options: 'i' };

		// Find all reports
		Report.paginate(search, options)
			.then(reports => {
				const returnPopulatedReports = async () => {
					const populateReports = async () => {
						const foundReports = [];

						for (const report of reports.docs) {
							const reportItem = {
								id: report._id,
								reporter: report.reporter,
								category: report.category,
								text: report.text,
								type: report.type,
								status: report.status,
							};

							switch (report.type) {
								case 'User':
									reportItem.item = await User.findById(
										report.item
									);
									break;
								case 'Post':
									reportItem.item = await Post.findById(
										report.item
									).catch(err => console.log(err));
									break;
								case 'Upload':
									reportItem.item = await Upload.findById(
										report.item
									);
									break;
								case 'Comment':
									reportItem.item = await Comment.findById(
										report.item
									);
									break;
								default:
									break;
							}

							foundReports.unshift(reportItem);
						}
						return foundReports;
					};
					res.json(await populateReports());
				};
				returnPopulatedReports();
			})
			.catch(err => res.json(err));
	}
);

// @route		GET admin/report/:id
// @desc		Retrieve a report and populate
// @access	Admin
router.get(
	'/report/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Report.findById(req.params.id).then(report => {
			const returnPopulatedReport = async () => {
				const populateReport = async () => {
					const reportItem = {
						reporter: report.reporter,
						category: report.category,
						text: report.text,
						type: report.type,
						status: report.status,
					};

					switch (report.type) {
						case 'User':
							reportItem.item = await User.findById(report.item);
							break;
						case 'Post':
							reportItem.item = await Post.findById(
								report.item
							).catch(err => console.log(err));
							break;
						case 'Upload':
							reportItem.item = await Upload.findById(
								report.item
							);
							break;
						case 'Comment':
							reportItem.item = await Comment.findById(
								report.item
							);
							break;
						default:
							break;
					}

					return reportItem;
				};
				res.json(await populateReport());
			};
			returnPopulatedReport();
		});
	}
);

// @route		PUT admin/report/:id
// @desc		Change status of report
// @access	Admin
router.put(
	'/report/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Report.findById(req.params.id).then(report => {
			newStatus = {
				date: Date.now(),
				status: req.body.status,
			};
			report.status.unshift(newStatus);
			report.save((err, report) => {
				if (err) res.json(err);
				else res.json(report);
			});
		});
	}
);

// @route		PUT admin/report/archive/:id
// @desc		Move report to completed collection
// @access	Admin
router.put(
	'/report/archive/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Report.findByIdAndDelete(req.params.id)
			.then(report => {
				const archivedReport = new ArchivedReport({
					reporter: report.reporter,
					category: report.category,
					text: report.text,
					item: report.item,
					type: report.type,
					status: report.status,
				});
				archivedReport
					.save()
					.then(archivedReport => res.json(archivedReport.id))
					.catch(err => res.json(err));
			})
			.catch(err => res.json(err));
	}
);

// @route 	POST admin/ban/user/:id
// @desc		Place a temporary ban on a user
// @access	Admin
router.post(
	'/ban/user/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		User.findById(req.params.id)
			.then(user => {
				const enddate = new Date(req.body.end).getTime();
				const ban = {
					reason: req.body.reason,
					start: Date.now(),
					end: enddate,
				};

				user.ban.unshift(ban);
				user.save((err, user) => {
					err ? res.json(err) : res.json(user);
				});
			})
			.catch(err => res.json({ err: 'No user can be found' }));
	}
);

// @route		POST /admin/user/unban:id/:ban
// @desc		Find user and remove ban from account
// @access	Admin
router.put(
	'/user/unban/:id/:ban',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		User.findById(req.params.id).then(user => {
			const endIndex = user.ban
				.map(ban => ban.id)
				.indexOf(req.params.ban);

			if (endIndex === -1) {
				res.status(404).json({ Error: 'Ban ID not found' });
			} else {
				user.ban.splice(endIndex, 1);

				const endingBan = {
					reason: req.body.reason,
					start: user.ban[endIndex].start,
					end: Date.now(),
				};

				user.ban.splice(endIndex, 0, endingBan);
				user.save((err, user) => {
					err ? res.json(err) : res.json(user);
				});
			}
		});
	}
);

// @route		POST /admin/division
// @desc		Add division to array
// @access	Admin
router.post(
	'/division',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Division.find({})
			.then(divdocs => {
				const divisions = divdocs[0].divarray;

				console.log(divisions.some(e => e.name == req.body.division));

				if (divisions.some(e => e.name == req.body.division)) {
					res.status(400).json({
						Error: 'This division already exists',
					});
				} else {
					divisions.push({
						name: req.body.division,
						description: req.body.description,
					});
					divdocs[0]
						.save()
						.then(divdoc => res.json(divdoc))
						.catch(err => res.json(err));
				}
			})
			.catch(err => res.json(err));
	}
);

// @route		DELETE /admin/division
// @desc		Remove division from array
// @access	Admin
router.delete(
	'/division',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Division.findOne({}).then(divdoc => {
			const index = divdoc.divarray
				.map(division => division.name)
				.indexOf(req.body.division);

			if (index == -1)
				res.status(404).json('No division with that name exists');
			else {
				divdoc.divarray.splice(index, 1);
				divdoc
					.save()
					.then(divdoc => res.json(divdoc))
					.catch(err => res.json(err));
			}
		});
	}
);

// @route		GET admin/applications
// @desc		Get all open applications
// @access	Admin
router.get(
	'/applications',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		const options = {
			limit: 25,
			populate: {
				path: 'user',
				select:
					'name handle email dob registerdate interests lastloggedin',
			},
		};
		if (req.query.page) options.page = req.query.page;

		Application.paginate({}, options)
			.then(applications => res.json(applications))
			.catch(err => res.json(err));
	}
);

// @route		GET admin/application/:id
// @desc		Get open application
// @access	Admin
router.get(
	'/application/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Application.findById(req.params.id)
			.then(application => res.json(application))
			.catch(err => res.json(err));
	}
);

// @route		PUT admin/application/:id
// @desc		Approve application and add Member to users divisions array
// @access	Admin
router.put(
	'/application/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Application.findByIdAndDelete(req.params.id).then(application => {
			User.findById(application.user).then(user => {
				user.divisions.push({ name: 'Member' });
				user.save().catch(err => res.json(err));
			});
			const archivedApplication = new ArchivedApplication({
				user: application.user,
				date: application.date,
				message: application.date,
			});

			archivedApplication
				.save()
				.then(application => res.json(application))
				.catch(err => res.json(err));
		});
		// TODO - message user that application has been approved.
	}
);

// @route		GET admin/user/reports/:id
// @desc		Retrieve all reports about a certain user
// @access	Admin

module.exports = router;
