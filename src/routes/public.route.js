const express = require('express');

const router = express.Router();
const contests = require('../controllers/contests');
const problems = require('../controllers/problems');
const contestProblem = require('../controllers/contest_problem');
const {enforceAuthentication} = require('../controllers/auth');

/** Getting the homepage */
router.get('/', (req, res) => {
  res.render('pages/index');
});

router.get('/allproblems', problems.allProblems);

router.post('/getproblems', problems.getProblems);

/**
 * Display all problems with datatable
 */
router.get('/problems', problems.recentProbNrank);

/** Display the contribution page */
router.get('/contribution', (req, res) => {
  res.render('contribution');
});

router.get('/viewfileuser', problems.viewfile1);
/** Display the user contest page */
router.get('/contests', contests.showContests);

/** Display the problem set visible to the users */
router.get('/problems/all', problems.problemSet);

/** Display the problem with qID */
router.get('/problem/:qID', enforceAuthentication(true, false), problems.displayProblem);

/** Display the user ranklist page */
router.get('/rankings', problems.userRankings);

/** Display the contest */
router.get('/contests/:contestCode', contests.showContest);

/** Display the ranklist */
router.get('/contests/:contestCode/standings', contests.ranklist);

/** Display the page to submit problem qID */
router.post(
  '/contests/:contestCode/submit/:qID',
  enforceAuthentication(true, false),
  problems.submitContestSolution,
);

router.post(
  '/contests/:contestCode/submit/test/:qID',
  enforceAuthentication(true, false),
  problems.submitContestSolutionTest,
);

router.post('/submit/test/:qID', enforceAuthentication(true, false), problems.submitSolutionTest);

/** POST: submitting the problem qID */
router.post('/submit/:qID', enforceAuthentication(true, false), problems.submitSolution);

/** POST: after clicking the submit button on the problem display page */
router.post('/problem/:qID', (req, res) => {
  res.redirect(`/submit/${req.params.qID}`);
});

/** Display the IDE page */
router.get('/ide', problems.getIde);

/** POST: submitting the IDE code, input */
router.post('/ide', problems.postIde);

/** Display the contest problem */
router.get(
  '/contests/:contestCode/:qID',
  enforceAuthentication(true, false),
  contestProblem.displayProblem,
);

/** Display question Subjects  */
router.get(
  '/question_subjects/:idSubject',
  enforceAuthentication(true, false),
  problems.questionSubjects,
);
/** Display the page Suggestions */
router.get('/choose_subjects', problems.chooseSubjects);

/** Display About Us page */
router.get('/about', problems.about);

module.exports = router;
