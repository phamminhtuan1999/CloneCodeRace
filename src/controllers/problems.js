const helper = {};
const request = require('request-promise');
const moment = require('moment');
const encode = require('nodejs-base64-encode');
const {forever} = require('request-promise');
const testcases = require('../models/testcases');
const submission = require('../models/submission');
const problems = require('../models/problems');
const users = require('../models/users');
const lang = require('../config/lang');
const contests = require('../models/contests');
const participation = require('../models/participation.js');
const uploadsmodel = require('../models/uploadfile');
const datatags = require('../models/tag');
const subjectsDb = require('../models/subjects');
const pSubjects = require('../models/pointSubjects');

const {enforceAuthentication} = require('./auth');

const files = [];
helper.viewfile1 = async (req, res, next) => {
  const removed = files.splice(0);
  // sử dụng mongoose lây dữ liệu và đổ dữ liệu
  uploadsmodel.find({}, function (error, dulieu) {
    // console.log(dulieu);
    res.render('viewfile', {data: dulieu});
    const removed = files.splice(0);
  });
};

helper.allProblems = async (req, res) => {
  res.render('pages/allproblems');
};

helper.getProblems = async (req, res, next) => {
  /** Finding all the problems sorted in descending order of the qID */
  console.log(req.body);
  const perPage = 25;
  const page = req.params.page || 1;
  try {
    await problems
      .find({})
      .sort({qID: 1})
      .then(data => {
        problems.countDocuments((err, count) => {
          const pages = Math.ceil(count / perPage);
          if (err) return next(err);
          res.jsonp({
            data,
            current: page,
            pages,
          });
        });
      });
  } catch (err) {
    console.log(err);
  }
};

/** To display all the problems to the users that should
 * be visible to the users.
 * route: /problems/all
 */
helper.problemSet = async (req, res, next) => {
  /** Quering problems that should be visible to the users */
  problems
    .find({isVisible: true})
    .then(data => {
      console.log(data);
      /** Accepted questions grouping by username and qID */
      submission
        .aggregate([
          {$match: {verdict: 'Accepted'}},
          {$group: {_id: {username: '$username', qID: '$qID'}}},
        ])
        .then(probSolved => {
          const probSolvedObj = {};
          /** Counting the frequency of each solved questions */
          for (let i = 0; i < probSolved.length; i++) {
            // console.log("win"+probSolvedObj[probSolved[i]._id.qID])
            probSolvedObj[probSolved[i]._id.qID] = 1 + (probSolvedObj[probSolved[i]._id.qID] || 0);
          }
          /** Comparator function to sort the problems in descending
           * order of the count of solved
           */
          function cmp(a, b) {
            // console.log("A"+probSolvedObj[a.qID]);
            // console.log("B"+probSolvedObj[b.qID]);
            if (probSolvedObj[a.qID] === null && probSolvedObj[b.qID] === null) return -1;
            if (probSolvedObj[a.qID] && !probSolvedObj[b.qID]) return -1;
            if (!probSolvedObj[a.qID] && probSolved[b.qID]) return 1;
            return Number(probSolvedObj[a.qID]) > Number(probSolvedObj[b.qID]) ? -1 : 1;
          }
          // console.log("win"+probSolvedObj)
          // console.log("win"+probSolved);
          for (let j = 0; j < data.length; j++) {
            console.log(`Tagss${data[j].tags}`);
          }
          datatags.find({}).then(dataTags => {
            data.sort(cmp);
            res.render('problem_set', {
              problems: data,
              dataTag: dataTags,
              solved: probSolvedObj,
            });
          });
        });
    })
    .catch(err => {
      console.log(err);
    });
};
/** Display the problem with qID
 * route: /problem/:qID
 */
helper.displayProblem = async (req, res, next) => {
  /** Finding the question by it's qID from the URL */
  problems
    .findOne({qID: req.params.qID})
    .then(data => {
      /** qID not found */
      if (data === null) {
        next();
      }
      /** false visible questions should not be accessible by a non-admin user */
      if (res.locals.user && res.locals.user.isAdmin === false && data.isVisible === false) {
        next();
      }
      /** false visible questions should not be accessible by a non logged in user */
      if (res.locals.user === null && data.isVisible === false) {
        next();
      }
      res.render('solution_submit', {langlist: lang, data});
    })
    .catch(err => {
      console.log(err);
      next();
    });
};
/** To display recently added new problems and
 * top ranking on home page
 * route: /
 */
helper.recentProbNrank = async (req, res, next) => {
  /** Quering problems that should be visible to the users */
  let recent_probs = [];
  await problems
    .find({isVisible: true})
    .then(recent_prob => {
      recent_probs = recent_prob;
      // console.log("dataxnxx"+recent_probs);
      // res.render("index", { recent_problems:  });
    })
    .catch(err => {
      console.log(err);
    });
  await users
    .find()
    .then(data => {
      /** Accepted questions grouping by username and qID */
      submission
        .aggregate([
          {$match: {verdict: 'Accepted'}},
          {$group: {_id: {username: '$username', qID: '$qID'}}},
        ])
        .then(user_questions => {
          const user_solved = {};
          /** Counting the frequency of problems solved by each user */
          for (var i = 0; i < user_questions.length; i++) {
            user_solved[user_questions[i]._id.username] =
              1 + (user_solved[user_questions[i]._id.username] || 0);
          }
          /** Comparator function to sort the user in descending
           * order of the count of solved
           */
          function cmp(a, b) {
            if (user_solved[a.username] === null && user_solved[b.username] === null) return -1;
            if (user_solved[a.username] && !user_solved[b.username]) return -1;
            if (!user_solved[a.username] && user_questions[b.username]) return 1;
            return Number(user_solved[a.username]) > Number(user_solved[b.username]) ? -1 : 1;
          }
          data.sort(cmp);
          /* console.log(recent_probs);
          console.log(data);
          console.log(user_solved); */
          /** Calulating the rank based on the total number of solved
           * problems by each user. User having same number of problems solved
           * has the same rank.
           * Initializing the current rank to 0 and current solved to INF (~100000000)
           */
          let currRank = 0;
          let currSolved = 100000000;
          for (var i = 0; i < data.length; i++) {
            /** This user hasn't solved even a single question */
            if (!user_solved[data[i].username]) {
              data[i].rank = currRank + 1;
              data[i].solved = 0;
              continue;
            } else if (user_solved[data[i].username] < currSolved) {
              /** This user has lesser problems solved than the previous user */
              currSolved = user_solved[data[i].username];
              currRank += 1;
            }
            /** Else this user has same number of problems solved as the previous user */
            data[i].rank = currRank;
            data[i].solved = currSolved;
          }
          res.render('pages/index', {
            ranks: data,
            recentProblems: recent_probs,
          });
        });
    })
    .catch(err => {
      console.log(err);
    });
};
helper.submitSolutionTest = async (req, res, next) => {
  const checkAnswer = async data => {
    const options = {
      method: 'POST',
      url: 'http://localhost:3000/submissions/?base64_encoded=true&wait=true',
      headers: {
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      },
      body: {
        source_code: '_fill',
        language_id: '_fill',
        stdin: '_fill',
        expected_output: '_fill',
        memory_limit: '_fill',
        cpu_time_limit: '_fill',
      },
      json: true,
    };
    const tests = [];

    /** Getting the required field values for making a user submission for a problem */
    options.body.cpu_time_limit = Number(data.timeLimit);
    options.body.wall_time_limit = options.body.cpu_time_limit * 1;
    options.body.memory_limit = Number(data.memoryLimit);
    options.body.source_code = encode.encode(data.code, 'base64');
    options.body.language_id = data.langID;

    /** Attaching each testcase */
    data.files.forEach(testcase => {
      options.body.stdin = encode.encode(testcase.stdin, 'base64');
      options.body.expected_output = encode.encode(testcase.stdout, 'base64');
      tests.push(request(options));
      // console.log(tests);
    });
    const judge0Response = await Promise.all(tests);
    return judge0Response;
  };

  const {qID} = req.body;
  // console.log("ID:::", qID);
  testcases.findOne({qID}, async (err, tc) => {
    if (err) {
      console.log(err);
    }
    const data = {
      qID: req.body.qID,
      code: req.body.code,
      langID: req.body.language,
      timeLimit: tc.timeLimit,
      memoryLimit: tc.memoryLimit,
      files: tc.cases,
    };
    const results = await checkAnswer(data);
    // console.log(results);

    // code to attach this submissions data to user's account
    const tcs = [];
    let verdict = 'Accepted';
    let time = 0;
    let mem = 0;
    let successtestcase = 0;
    let flag = false;
    for (i = 0; i < results.length; i++) {
      time = Math.max(time, results[i].time);
      mem = Math.max(mem, results[i].memory);
      if (flag === false && results[i].status.description !== 'Accepted') {
        verdict = results[i].status.description;
        flag = true;
      } else {
        successtestcase++;
      }

      tcs.push({
        status: results[i].status.description,
        time: results[i].time,
        memory: results[i].memory,
      });
    }
    const lengthresults = results.length;

    // console.log("lengthresults"+lengthresults);
    // console.log("verdict_length"+results.status);
    const ratesuccess = successtestcase / lengthresults;
    // console.log("ratesuccess"+ratesuccess);
    // console.log("successtestcase"+successtestcase);
    let langName;
    const subCount = await submission.countDocuments({});
    for (var i = 0; i < lang.length; i++) {
      if (lang[i].id === parseInt(req.body.language)) {
        langName = lang[i].name;
        break;
      }
    }

    // deleting fields that user shouldn't have access to
    results.forEach(item => {
      item.token = null;
      item.stdout = null;
    });
    // console.log(results);
    res.send(results);
  });
};
/** FILE: app.js
 * POST: submitting the problem qID
 * route: /submit/:qID */
helper.submitSolution = async (req, res, next) => {
  // takes obj as input {files:*all test files*, Time:*time limit per file*, Memory:*memory per file*, code:*user's code*, langID:*language ID*}
  const checkAnswer = async data => {
    const options = {
      method: 'POST',
      url: 'http://localhost:3000/submissions/?base64_encoded=true&wait=true',
      headers: {
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      },
      body: {
        source_code: '_fill',
        language_id: '_fill',
        stdin: '_fill',
        expected_output: '_fill',
        memory_limit: '_fill',
        cpu_time_limit: '_fill',
      },
      json: true,
    };
    const tests = [];

    /** Getting the required field values for making a user submission for a problem */
    options.body.cpu_time_limit = Number(data.timeLimit);
    options.body.wall_time_limit = options.body.cpu_time_limit * 1;
    options.body.memory_limit = Number(data.memoryLimit);
    options.body.source_code = encode.encode(data.code, 'base64');
    options.body.language_id = data.langID;

    /** Attaching each testcase */
    data.files.forEach(testcase => {
      options.body.stdin = encode.encode(testcase.stdin, 'base64');
      options.body.expected_output = encode.encode(testcase.stdout, 'base64');
      tests.push(request(options));
      // console.log(tests);
    });
    const judge0Response = await Promise.all(tests);
    return judge0Response;
  };

  const {qID} = req.body;
  console.log('ID:::', qID);
  testcases.findOne({qID}, async (err, tc) => {
    if (err) {
      console.log(err);
    }
    const data = {
      qID: req.body.qID,
      code: req.body.code,
      langID: req.body.language,
      timeLimit: tc.timeLimit,
      memoryLimit: tc.memoryLimit,
      files: tc.cases,
    };
    const results = await checkAnswer(data);
    // console.log(results);

    // code to attach this submissions data to user's account
    const tcs = [];
    let verdict = 'Accepted';
    let time = 0;
    let mem = 0;
    let successtestcase = 0;
    let flag = false;
    for (i = 0; i < results.length; i++) {
      time = Math.max(time, results[i].time);
      mem = Math.max(mem, results[i].memory);
      if (flag === false && results[i].status.description !== 'Accepted') {
        verdict = results[i].status.description;
        flag = true;
      } else {
        successtestcase++;
      }
      tcs.push({
        status: results[i].status.description,
        time: results[i].time,
        memory: results[i].memory,
      });
      // console.log("verdict_lengthxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"+verdict.length);
    }

    function roundToTwo(num) {
      return +`${Math.round(`${num}e+1`)}e-1`;
    }
    const lengthresults = results.length;

    // console.log("verdictxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"+lengthresults);
    // console.log("verdict_lengthxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"+results.status);
    const ratesuccess = roundToTwo(successtestcase / lengthresults);
    // console.log("ratesuccess"+ratesuccess);
    // console.log("successtestcase"+successtestcase);
    let langName;

    const subCount = await submission.countDocuments({});
    for (var i = 0; i < lang.length; i++) {
      if (lang[i].id === parseInt(req.body.language)) {
        langName = lang[i].name;
        break;
      }
    }
    problems.find({qID}).then(dataskill => {
      const dataskillLength = dataskill[0].tags;
      console.log(`LG${dataskillLength.length}`);
      const idtags = [];
      for (let z = 0; z < dataskillLength.length; z++) {
        idtags.push(dataskill[0].tags[z].id);
      }
      console.log(`idtags${idtags}`);
      const newSubmission = new submission({
        username: req.user ? req.user.username : 'Guest',
        qID: req.body.qID,
        subID: 1 + subCount,
        code: req.body.code,
        skill: idtags,
        language: langName,
        verdict,
        time,
        memory: mem,
        ratesuccesstestcase: ratesuccess,
        isVisible: true,
        timeStamp: new Date(),
        tc: tcs,
      });
      /** 17/12/2020 */
      newSubmission.save(function (err) {
        if (err) {
          console.log(err);
        }
        // console.log(newSubmission);
      });
    });

    // update dificulties problem
    submission.find({qID: req.body.qID}).then(async submitssionqid => {
      // console.log("submitssionqid"+submitssionqid);
      let submitssionqid_difficulty_sum = 0;
      let difficulty_sum = 0;
      for (let i = 0; i < submitssionqid.length; i++) {
        submitssionqid_difficulty_sum += submitssionqid[i].ratesuccesstestcase;
        difficulty_sum = submitssionqid_difficulty_sum / submitssionqid.length;
      }

      if (submitssionqid.length > 20) {
        // count the number of questions compiled, if questions compiled bigger 20 else update dificulty.

        const updateDifficulty = roundToTwo(1 - difficulty_sum);
        const editProblemDifficulty = {
          difficultyAutoUpdate: updateDifficulty,
        };
        // console.log("updateDifficulty"+updateDifficulty);

        await problems
          .update({qID: req.body.qID}, editProblemDifficulty)
          .then(val => {
            console.log(`EDITED: ${val}`);
          })
          .catch(err => {
            console.log(err);
          });
      } else {
        console.log(`submitssionqid.length${submitssionqid.length}`);
        console.log('you need more data');
      }

      problems.find({qID: req.body.qID}).then(async problemDifficulty => {
        // console.log("problemDifficulty"+problemDifficulty);
        problemDifficulty.difficultyAutoUpdate = 1 - difficulty_sum;
        // console.log(problemDifficulty.difficulty);
      });
    });
    // deleting fields that user shouldn't have access to
    results.forEach(item => {
      item.token = null;
      item.stdout = null;
    });
    // console.log(results);
    res.send(results);
  });
};
/// /////////////////////////////////////////////////////

helper.submitContestSolutionTest = async (req, res, next) => {
  // takes obj as input {files:*all test files*, Time:*time limit per file*, Memory:*memory per file*, code:*user's code*, langID:*language ID*}
  const checkAnswer = async data => {
    const options = {
      method: 'POST',
      url: 'http://localhost:3000/submissions/?base64_encoded=true&wait=true',
      headers: {
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      },
      body: {
        source_code: '_fill',
        language_id: '_fill',
        stdin: '_fill',
        expected_output: '_fill',
        memory_limit: '_fill',
        cpu_time_limit: '_fill',
      },
      json: true,
    };
    const tests = [];

    /** Getting the required field values for making a user submission for a problem */
    options.body.cpu_time_limit = Number(data.timeLimit);
    options.body.wall_time_limit = options.body.cpu_time_limit * 1;
    options.body.memory_limit = Number(data.memoryLimit);
    options.body.source_code = encode.encode(data.code, 'base64');
    options.body.language_id = data.langID;

    /** Attaching each testcase */
    data.files.forEach(testcase => {
      options.body.stdin = encode.encode(testcase.stdin, 'base64');
      options.body.expected_output = encode.encode(testcase.stdout, 'base64');
      tests.push(request(options));
    });
    const judge0Response = await Promise.all(tests);
    return judge0Response;
  };

  contests
    .find({code: req.params.contestCode})
    .then(async contestData => {
      // The Contest should not be empty.
      if (contestData.length == 0) {
      }
      // Number of questions in the contest are less than the number of question asked.
      if (contestData[0].problemsID.length >= req.params.qID) {
      }
      // Has the contest started yet?
      const qID = contestData[0].problemsID[req.params.qID];
      // Get all the test cases of this question.
      testcases.findOne({qID}, async (err, tc) => {
        if (err) {
          console.log(err);
        }
        const data = {
          qID: req.body.qID,
          code: req.body.code,
          langID: req.body.language,
          timeLimit: tc.timeLimit,
          memoryLimit: tc.memoryLimit,
          files: tc.cases,
        };
        const results = await checkAnswer(data);

        // code to attach this submissions data to user's account
        const tcs = [];
        let verdict = 'Accepted';
        let time = 0;
        let mem = 0;
        let flag = false;

        for (i = 0; i < results.length; i++) {
          time = Math.max(time, results[i].time);
          mem = Math.max(mem, results[i].memory);
          if (flag === false && results[i].status.description !== 'Accepted') {
            verdict = results[i].status.description;
            flag = true;
          }
          tcs.push({
            status: results[i].status.description,
            time: results[i].time,
            memory: results[i].memory,
          });
        }
        // Which language are we using?
        let langName;
        const subCount = await submission.countDocuments({});
        for (var i = 0; i < lang.length; i++) {
          if (lang[i].id === parseInt(req.body.language)) {
            langName = lang[i].name;
            break;
          }
        }
        // Create the submission object.

        // deleting fields that user shouldn't have access to
        results.forEach(item => {
          item.token = null;
          item.stdout = null;
        });
        res.send(results);
      });
    })
    .catch(async err => {
      console.log(err);
    });
};

/** FILE: app.js
 * POST: submitting the problem qID from contest with id -> ContestCode
 * route: /submit/:contestCode/:qID */
helper.submitContestSolution = async (req, res, next) => {
  // takes obj as input {files:*all test files*, Time:*time limit per file*, Memory:*memory per file*, code:*user's code*, langID:*language ID*}
  const checkAnswer = async data => {
    const options = {
      method: 'POST',
      url: 'http://localhost:3000/submissions/?base64_encoded=true&wait=true',
      headers: {
        'cache-control': 'no-cache',
        'Content-Type': 'application/json',
      },
      body: {
        source_code: '_fill',
        language_id: '_fill',
        stdin: '_fill',
        expected_output: '_fill',
        memory_limit: '_fill',
        cpu_time_limit: '_fill',
      },
      json: true,
    };
    const tests = [];

    /** Getting the required field values for making a user submission for a problem */
    options.body.cpu_time_limit = Number(data.timeLimit);
    options.body.wall_time_limit = options.body.cpu_time_limit * 1;
    options.body.memory_limit = Number(data.memoryLimit);
    options.body.source_code = encode.encode(data.code, 'base64');
    options.body.language_id = data.langID;

    /** Attaching each testcase */
    data.files.forEach(testcase => {
      options.body.stdin = encode.encode(testcase.stdin, 'base64');
      options.body.expected_output = encode.encode(testcase.stdout, 'base64');
      tests.push(request(options));
    });
    const judge0Response = await Promise.all(tests);
    return judge0Response;
  };

  contests
    .find({code: req.params.contestCode})
    .then(async contestData => {
      // The Contest should not be empty.
      if (contestData.length == 0) {
      }
      // Number of questions in the contest are less than the number of question asked.
      if (contestData[0].problemsID.length >= req.params.qID) {
      }
      // Has the contest started yet?
      const contest_start =
        moment(contestData.date).format('YYYY-MM-DD H:mm:ss') >
        moment(Date.now()).format('YYYY-MM-DD H:mm:ss');
      if (contest_start) {
        res.redirect('/contests/');
        return;
      }
      const qID = contestData[0].problemsID[req.params.qID];
      // Get all the test cases of this question.
      testcases.findOne({qID}, async (err, tc) => {
        if (err) {
          console.log(err);
        }
        const data = {
          qID: req.body.qID,
          code: req.body.code,
          langID: req.body.language,
          timeLimit: tc.timeLimit,
          memoryLimit: tc.memoryLimit,
          files: tc.cases,
        };
        const results = await checkAnswer(data);

        // code to attach this submissions data to user's account
        const tcs = [];
        let verdict = 'Accepted';
        let time = 0;
        let mem = 0;
        let flag = false;

        for (i = 0; i < results.length; i++) {
          time = Math.max(time, results[i].time);
          mem = Math.max(mem, results[i].memory);
          if (flag === false && results[i].status.description !== 'Accepted') {
            verdict = results[i].status.description;
            flag = true;
          }
          tcs.push({
            status: results[i].status.description,
            time: results[i].time,
            memory: results[i].memory,
          });
        }
        // Which language are we using?
        let langName;
        const subCount = await submission.countDocuments({});
        for (var i = 0; i < lang.length; i++) {
          if (lang[i].id === parseInt(req.body.language)) {
            langName = lang[i].name;
            break;
          }
        }
        // Create the submission object.
        const newSubmission = new submission({
          username: req.user ? req.user.username : 'Guest',
          qID: req.body.qID,
          subID: 1 + subCount,
          code: req.body.code,
          language: langName,
          verdict,
          time,
          memory: mem,
          isVisible: true,
          timeStamp: new Date(),
          tc: tcs,
        });

        // Update the database.
        newSubmission.save(function (err) {
          if (err) {
            console.log(err);
          }
          // console.log(newSubmission);
        });
        // Get the user's participation in this contest.
        participation.findOne(
          {
            username: newSubmission.username,
            contestCode: contestData[0].code,
          },
          function (err, result) {
            if (err) {
              throw err;
            }
            // console.log("------Updating the database--------------");
            temp = result;
            temp.submissions.push(newSubmission.subID);
            let check = false;

            // Check if the submission is within the contest time.
            if (Date.now() >= temp.startTime && Date.now() <= temp.endTime) {
              check = true;
            }

            if (check) {
              // Check if the current Question is already solved or not.
              let current_problem_exists = false;
              for (let i = 0; i < temp.solved_qID.length; i++) {
                if (newSubmission.qID === temp.solved_qID[i]) {
                  current_problem_exists = true;
                  break;
                }
              }

              /* 
                       If Verdict is Accepted and Question was not previously solved then,
                       update score, penalty and add it to solved questions.
                    */
              // console.log("questions"+temp.solved_qID);

              for (let j = 0; j < newSubmission.tc.length; j++) {
                // console.log("stt:"+newSubmission.tc[j].status);
                if (
                  newSubmission.tc[j].status === 'Accepted' &&
                  current_problem_exists == false &&
                  check == true
                ) {
                  temp.score += 1;
                  temp.solved_qID.push(newSubmission.qID);
                }
                if (current_problem_exists === false && newSubmission.tc[j].status != 'Accepted') {
                  temp.score += 0;
                  temp.solved_qID.push(newSubmission.qID);
                }
              }

              /*
               if (
                newSubmission.tc.status === "Accepted"
              ) {
                
                temp.score += 1;
                temp.penalty +=0;
                temp.solved_qID.push(newSubmission.qID);
              }
              if (
                current_problem_exists === false &&
                newSubmission.verdict != "Accepted"
              ) {
                // temp.penalty += 20*60;
              }
             */
            }

            // Update the Database with the values calculated above
            const query = {
              username: newSubmission.username,
              contestCode: contestData[0].code,
            };
            const newValues = {
              $set: {
                score: temp.score,
                penalty: temp.penalty,
                solved_qID: temp.solved_qID,
                submissions: temp.submissions,
              },
            };
            // console.log("newValues"+newValues)
            participation
              .updateOne(query, newValues)
              .then(async data1 => {
                // console.log(data1);
                // console.log("------Completed Updating Database--------------");
              })
              .catch(async err => {
                // console.log("------Some Error While Updating Database--------------");
                console.log(err);
              });
          },
        );

        // deleting fields that user shouldn't have access to
        results.forEach(item => {
          item.token = null;
          item.stdout = null;
        });
        res.send(results);
      });
    })
    .catch(async err => {
      console.log(err);
    });
};

/** Display the IDE page
 * route: /ide
 */
helper.getIde = function (req, res) {
  res.render('pages/ide', {langlist: lang});
};

/** POST: submitting the IDE code, input
 * route: /ide
 */
helper.postIde = async function (req, res) {
  const options = {
    method: 'POST',
    /** &wait=true for getting the submission result after submitting the code automatically */
    url: 'http://localhost:3000/submissions/?base64_encoded=true&wait=true',
    headers: {
      'cache-control': 'no-cache',
      'Content-Type': 'application/json',
    },
    body: {
      source_code: encode.encode(req.body.src, 'base64'),
      language_id: parseInt(req.body.lang),
      stdin: encode.encode(req.body.stdin, 'base64'),
      cpu_time_limit: 5, // time limit to 5 sec for the IDE
    },
    json: true,
  };
  // console.log(options);
  // console.log(body);

  request(options, function (err, result, body1) {
    // console.log(body1);
    res.send(body1);
  });
};

/**
 * To display the user ranklist
 * route: /rankings
 */
helper.userRankings = function (req, res) {
  /** Getting all the users */
  users
    .find()
    .then(data => {
      /** Accepted questions grouping by username and qID */
      submission
        .aggregate([
          {$match: {verdict: 'Accepted'}},
          {$group: {_id: {username: '$username', qID: '$qID'}}},
        ])
        .then(user_questions => {
          const user_solved = {};
          /** Counting the frequency of problems solved by each user */
          for (var i = 0; i < user_questions.length; i++) {
            user_solved[user_questions[i]._id.username] =
              1 + (user_solved[user_questions[i]._id.username] || 0);
          }
          /** Comparator function to sort the user in descending
           * order of the count of solved
           */
          function cmp(a, b) {
            if (user_solved[a.username] === null && user_solved[b.username] === null) return -1;
            if (user_solved[a.username] && !user_solved[b.username]) return -1;
            if (!user_solved[a.username] && user_questions[b.username]) return 1;
            return Number(user_solved[a.username]) > Number(user_solved[b.username]) ? -1 : 1;
          }
          data.sort(cmp);
          /** Calulating the rank based on the total number of solved
           * problems by each user. User having same number of problems solved
           * has the same rank.
           * Initializing the current rank to 0 and current solved to INF (~100000000)
           */
          let currRank = 0;
          let currSolved = 100000000;
          for (var i = 0; i < data.length; i++) {
            /** This user hasn't solved even a single question */
            if (!user_solved[data[i].username]) {
              data[i].rank = currRank + 1;
              data[i].solved = 0;
              continue;
            } else if (user_solved[data[i].username] < currSolved) {
              /** This user has lesser problems solved than the previous user */
              currSolved = user_solved[data[i].username];
              currRank += 1;
            }
            /** Else this user has same number of problems solved as the previous user */
            data[i].rank = currRank;
            data[i].solved = currSolved;
          }
          res.render('rankings', {data});
        });
    })
    .catch(err => {
      console.log(err);
    });
};
/** GET: Page Subjects */
helper.chooseSubjects = async (req, res, next) => {
  subjectsDb.find({}).then(data => {
    res.render('page_choose_subjects', {data});
  });
};

helper.questionSubjects = async (req, res, next) => {
  const idSubjects = req.params.idSubject;
  const idChapters = req.params.idChapter;
  /**
   * subjectsDb.find({_id:idSubjects}).then((data)=>{
    console.log("Dataxxxxxxxxxxxxxxxx"+data[0].chapter);
    data.find({id:idChapters}).then((data1)=>{
      res.render("question_subjects",{data:data1});

    })
  })
   */
  subjectsDb.find({_id: idSubjects}).then(async data => {
    const dataUser = req.user ? req.user.username : 'Guest';
    const arrayData = [];
    if (dataUser != 'Guest') {
      submission
        .find({
          username: dataUser,
          verdict: 'Accepted',
        })
        .then(async data1 => {
          for (let i = 0; i < data1.length; i++) {
            /// /lọc trùng
            arrayData.push(data1[i].qID);

            const arraySet = [...new Set(arrayData)];
            var dataUpdate = {
              questionAccess: arraySet,
            };
            /// import vào db
          }
          await users
            .update({username: dataUser}, dataUpdate)
            .then(val => {
              console.log(`EDITED: ${val}`);
            })
            .catch(err => {
              console.log(err);
            });
          users.find({username: dataUser}).then(async data2 => {
            res.render('question_subjects', {data, data2});
          });
        });
    } else {
      res.render('question_subjects', {data});
    }
  });
};
helper.about = async (req, res, next) => {
  res.render('about');
};
module.exports = helper;
