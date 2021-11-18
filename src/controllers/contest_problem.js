var helper = {};
var request = require("request-promise");
var testcases = require("../models/testcases");
var submission = require("../models/submission");
var problems = require("../models/problems");
var users = require("../models/users");
var lang = require("../config/lang");
var contests = require("../models/contests");

var moment = require("moment");

/*
 *  Display a problem which is part of a contest.
 *  /contests/:code/:qId
 */
helper.displayProblem = async (req, res, next) => {
  var contestCode = req.params.contestCode;
  contests.findOne({ code: contestCode }).then((contestData) => {
    var contest_start =
      moment(contestData.date).format("YYYY-MM-DD H:mm:ss") >
      moment(Date.now()).format("YYYY-MM-DD H:mm:ss");
    if (contest_start) {
      res.redirect("/contests/");
      return;
    }
    var qidread = contestData.problemsID[req.params.qID];
    //console.log(qidread);
    /**Finding the question by it's qID from the URL */
    problems
      .findOne({ qID: contestData.problemsID[req.params.qID] })
      .then((data) => {
        /**qID not found */
        if (data === null) {
          next();
        }
        /**false visible questions should not be accessible by a non-admin user */
        if (
          res.locals.user &&
          res.locals.user.isAdmin === false &&
          data.isVisible === false
        ) {
          next();
        }
        /**false visible questions should not be accessible by a non logged in user */
        if (res.locals.user === null && data.isVisible === false) {
          next();
        }
        data.qID = req.params.qID;
        var contest_start_1 = moment(contestData.endDate).format(
          "YYYY-MM-DD H:mm:ss"
        );
        //console.log("CLOCK:"+contest_start_1);
        res.render("contest_solution_submit", {
          langlist: lang,
          questions: data,
          contestData: contestData,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

module.exports = helper;
