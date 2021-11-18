const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth');

const {enforceAuthentication} = authController; // for checking the user/ admin logged in

/** POST: user login */
router.post('/login', enforceAuthentication(false, false), authController.postLogin);

/** Login out the user, redirected to the homepage */
router.get('/logout', enforceAuthentication(true, false), authController.getLogout);

/** POST: user signup */
router.post('/signup', enforceAuthentication(false, false), authController.postSignUp);

/** Display the user profile/ dashboard page */
router.get('/profile', enforceAuthentication(true, false), authController.showProfile);

/** Display the user submission history table */
router.get('/submissions', enforceAuthentication(true, false), authController.submissionHistory);

/** Display the user's particular submission by it's submitID */
router.get(
  '/submission/:subID',
  enforceAuthentication(true, false),
  authController.submission_subID,
);

/** Display the user update profile page */
router.get('/updateProfile', enforceAuthentication(true, false), authController.getUpdateProfile);

/** POST: user profile update */
router.post('/updateProfile', enforceAuthentication(true, false), authController.postUpdateProfile);

/** Display the page suggestion */
/** 
 * router.get("/suggestions",
enforceAuthentication(true, false),
authController.suggestions
);
*/
/** POST:Reset Pass :NewPass */

router.post('/passwordReset', enforceAuthentication(true, false), authController.postPasswordReset);

module.exports = router;
