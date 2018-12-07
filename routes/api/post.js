// TODO - Add server-side validation for category permissions
const router = require('express').Router();
const passport = require('passport');
const fs = require('fs');

// Load models
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');

// Load multer storage method
const fileUpload = require('../../src/modules/fileUpload');
const isEmpty = require('../../src/modules/is-empty');

// @route   GET post/test
// @desc    Test post route
// @access  Public
router.get('/test', (req, res) => res.status(200).json({ success: true }));

// @route   POST post/
// @desc    Create Post
// @access  Public
router.post(
	'/new',
	passport.authenticate('jwt', { session: false }),
	fileUpload.array('file'),
	(req, res) => {
		const newPost = new Post({
			user: req.user.id,
			title: req.body.title,
			text: req.body.text,
			category: req.body.category,
		});

		if (isEmpty(req.files)) {
			newPost
				.save()
				.then(post => res.status(200).json(post))
				.catch(err => res.status(400).json(err));
		} else {
			// Cycle through all files in request, add attributes to new Upload object and save to uploads collection. Then add saved object to 'uploads' array.
			req.files.forEach(file => {
				const upload = new Upload({
					filename: file.filename,
					path: file.path,
					mimetype: file.mimetype,
					size: file.size,
					originalname: file.originalname,
					user: req.user.id,
					date: Date.now(),
				});

				upload
					.save()
					.then(newPost.attachments.push(upload))
					.catch(err => res.status(400).json(err));
			});
			newPost
				.save()
				.then(post => res.status(200).json(post))
				.catch(err => res.status(400).json(err));
		}
	}
);

// @route   GET post/:id
// @desc    Get public post
// @access  Public
router.get('/:id', (req, res) => {
	Post.findById(req.params.id)
		.populate('attachments', ['originalname', 'path'])
		.populate('user', 'handle')
		.populate('comment')
		.then(post => res.json(post))
		.catch(err => res.json(err));
});

// @route   GET post/private:id
// @desc    Get private post
// @access  Private
router.get(
	'/private:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Post.findById(req.params.id)
			.populate('attachments', ['originalname', 'path'])
			.populate('user', 'handle')
			.populate('comment')
			.then(post => res.json(post))
			.catch(err => res.json(err));
	}
);

// @route   PUT post/edit/:id
// @desc    Edit post
// @access  Private
router.put(
	'/edit/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Post.findById(req.params.id)
			.then(post => {
				if (
					post.user._id.toHexString() === req.user.id ||
					req.user.role === 'Admin'
				) {
					if (req.body.title) post.title = req.body.title;
					if (req.body.title) post.title = req.body.title;

					post.save((err, post) => {
						err ? res.json(err) : res.json(post);
					});
				} else {
					res.status(401).json({ msg: 'Unauthorised.' });
				}
			})
			.catch(err => res.json(err));
	}
);

// @route   DELETE post/:id
// @desc    Delete post
// @access  Private
router.post(
	'/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Post.findById(req.params.id)
			.then(post => {
				if (
					post.user._id.toHexString() === req.user.id ||
					req.user.role === 'Admin'
				) {
					post.remove();
				}
			})
			.catch(err => res.json(err));
	}
);

// @route		POST post/:id/comment
// @desc		Add comment to post
// @access	Private
router.post(
	'/:id/comment',
	passport.authenticate('jwt', { session: false }),
	fileUpload.array('file'),
	(req, res) => {
		Post.findById(req.params.id).then(post => {
			const comment = new Comment({
				user: req.user.id,
				date: Date.now(),
				text: req.body.text,
				type: 'Post',
				ref: post.id,
			});

			if (isEmpty(req.files)) {
				comment
					.save()
					.then(comment => {
						post.comments.push(comment);
						post.save();
					})
					.then(res.json(post))
					.catch(err => res.json(err));
			} else {
				for (const file of req.files) {
					const upload = new Upload({
						filename: file.filename,
						path: file.path,
						mimetype: file.mimetype,
						size: file.size,
						originalname: file.originalname,
						user: req.user.id,
						date: Date.now(),
					});

					upload
						.save()
						.then(comment.attachments.push(upload))
						.catch(err => res.status(400).json(err));
				}
				comment
					.save()
					.then(comment => {
						post.comments.push(comment);
						post.save().then(res.json(post));
					})
					.catch(err => res.json(err));
			}
		});
	}
);

// @route		/post/comment/:id
// @desc		Delete comment from post,
// @access	Private
// FIXME - comment not being removed from post comments array.
router.delete(
	'/comment/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		console.log('Hi');
		Comment.findById(req.params.id)
			.then(comment => {
				if (
					comment.user._id === req.user.id ||
					req.user.role === 'Admin'
				) {
					if (!isEmpty(comment.attachments)) {
						for (const upload of comment.attachments) {
							Upload.findByIdAndDelete(upload.id).then(upload => {
								fs.unlink(upload.path, err => {
									if (err) res.json(err);
								});
							});
						}
					}

					Post.findById(comment.ref)
						.then(post => {
							const removeIndex = post.comments
								.map(item => item.id)
								.indexOf(comment.id);

							if (removeIndex == -1) {
								res.status(404).json({
									error: 'No comment to delete',
								});
							} else {
								// Splice out of array
								post.comments.splice(removeIndex, 1);

								// Save
								post.save().then(post => res.json(post));
							}
						})
						.then(comment.remove())
						.catch(err => res.json(err));
				} else {
					res.status(401).json({ Error: 'Insufficient Permissions' });
				}
			})
			.catch(err => res.json(err));
	}
);

module.exports = router;
