var passport = require("passport");
var user = require("../models/users");
var submissions = require("../models/submission");
var subjects=require("../models/subjects");
var pSubjects=require("../models/pointSubjects");
var subject = require("../models/subjects");
var problem = require("../models/problems");
var moment = require("moment");

/**POST: user signup
 * route: /user/signup
 */

exports.postSignUp = function (req, res) {
  user
    .findOne(
      {$or: [
        {email: req.body.email},
        {username: req.body.username }
    ]})
    .exec(function(err, data) {
       /**If any user with same username exists */
      if (data) {
        return res.send({ message: "Người dùng đã tồn tại" });
      }
       /**Checking the password */
      if (req.body.password !== req.body.password2) {
        return res.send({ message: "Mật khẩu không hợp lệ" });
      }
     else{
        var acc = new user({
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            /**By default the admin access is not provided */
            isAdmin: false,
            isTeacher: false,
            createProblem: false,
            createContest:false,
          });
        /**Registering the new user */
      user.register(acc, req.body.password, (err, user) => {
        if (err) {
          return res.send({ message: err });
        }
        /**New user signup successfully */
        passport.authenticate("local")(req, res, function () {
          /**Redirecting to homepage with the success message */
          res.send({ valid: true });
        });
      });  
    };
    // .then((data) => {
    //   /**If any user with same username exists */
    //   if (data) {
    //     return res.send({ message: "Username already exists!" });
    //   }
    //   /**Checking the password */
    //   if (req.body.password !== req.body.password2) {
    //     return res.send({ message: "Password does not match" });
    //   }
    //   /**Everything is fine now, and ready to create a new account object */
    //   var acc = new user({
    //     name: req.body.name,
    //     username: req.body.username,
    //     email: req.body.email,
    //     /**By default the admin access is not provided */
    //     isAdmin: false,
    //     isTeacher: false,
    //   });
    //   /**Registering the new user */
    //   user.register(acc, req.body.password, (err, user) => {
    //     if (err) {
    //       return res.send({ message: err });
    //     }
    //     /**New user signup successfully */
    //     passport.authenticate("local")(req, res, function () {
    //       /**Redirecting to homepage with the success message */
    //       res.send({ valid: true });
    //     });
    //   });
    // })
    // .catch((err) => {
    //   console.log(err);
    // });
  })};
/**POST: user login
 * route: user/login
 */
exports.postLogin = function (req, res) {
  passport.authenticate("local", function (err, user) {
    if (!user) {
      return res.send({ message: "Tên người dùng hoặc mật khẩu sai" });
    }
    req.logIn(user, function (err) {
      if (err) {
        console.log(err);
        return res.send({ message: "Tên người dùng hoặc mật khẩu sai" });
      }
      return res.send({ valid: true });
    });
  })(req, res);
};

/**Login out the user, redirected to the homepage
 * route: /user/logout
 */
exports.getLogout = function (req, res) {
  req.logout();
  res.redirect("/");
};

/**Implementing the routing guards */
exports.enforceAuthentication = (
  loginRequired = true,
  adminRequired = false
) => (req, res, next) => {
  if (loginRequired === req.isAuthenticated()) {
    if (!adminRequired || req.user.isAdmin) {
      next();
    } else {
      res.redirect("/");
    }
  } else {
    res.redirect("/");
  }
};

/**To show the user profile when logged in
 * route: /user/profile
 * */
exports.showProfile = async (req, res, next) => {
  /**Collecting the user's data from the submissions collection */
  submissions
    .find({ username: res.locals.user.username })
    .then((data) => {
      /**Object for storing the user submission statistics */
      stats = {
        AC: 0,
        WA: 0,
        TLE: 0,
        RE: 0,
        CE: 0,
      };
      /**Count GPA */
      function roundToTwo(num) {    
        return +(Math.round(num + "e+6")  + "e-6");
      }
      
        //var dataSubject=[];
        subjects.find({}).then((dataSubject)=>{
          //console.log("dataSubject.Length"+dataSubject.length);
          pointSubjects=0;
          var xxxx=[];
          for(var i=0;i<dataSubject.length;i++){
            //console.log("dataSubject"+dataSubject[i].subjectsName);
            var dataSubjectChapter=dataSubject[i].chapter;

           // var dataChapter=[];
           var xx=[];  

            for(var j=0;j<dataSubjectChapter.length;j++){
            pointChapter=0;
              var dataSubjectChapterqId=dataSubjectChapter[j].qId;             
                for(var z=0;z<dataSubjectChapterqId.length;z++){
                  for(var h=0;h<data.length;h++){
                    
                    if(data[h].qID == dataSubjectChapterqId[z]){
                      //console.log("data.length"+h);
                      //console.log("data.lengthx"+data.length);
                      pointChapter += data[h].ratesuccesstestcase/(data.length+1);
                    }else{
                    }             
                  }
                }               
                //console.log("dataSubjectChapter"+dataSubjectChapter[j].ChapterName);
                //console.log("Point: "+pointChapter);
                xx.push(pointChapter);
            }              
            //console.log("Point: "+xx);
            for(var x=0;x<xx.length;x++){
              pointSubjects += xx[x] / (xx.length+1);
            } 
            var xxx={
              subjectsName:dataSubject[i].subjectsName,
              pointSubjects:roundToTwo(pointSubjects),
            }
            xxxx.push(xxx);
          }
          gpa=0;
          gpafull=0;
          var datax=data.length;
          var userDataSkill=[];
          for(var z=0;z<data.length;z++){
            //console.log("FindDataSkill"+data[z].skill);
            var dataSkill=data[z].skill;
            for(var t=0;t<dataSkill.length;t++){
              //console.log("xxmxmxmxmxmmx"+dataSkill[t]);
              if (userDataSkill.indexOf(dataSkill[t]) === -1) {
                userDataSkill.push(dataSkill[t]);
              } else if (userDataSkill.indexOf(dataSkill[t]) > -1) {
                console.log(dataSkill[t] + ' already exists in the veggies collection.');
              }
            }
          }
          //console.log("userDataSkill"+userDataSkill);
          // var userData=userDataSkill.map(item => item.trim())
          for(var h=0;h<userDataSkill.length;h++) {
            //console.log("userData"+userData[h]);
              var skillx={
                skill:userDataSkill
              } 
              //console.log("skill"+skillx);
      
            user.update({username:res.locals.user.username},skillx).then((val) => {
                console.log("EDITED: " + val);
            })
            .catch((err) => {
                console.log(err);
            })
          }
          
    
          data.forEach((countGPA)=>{
            //var datax=(countGPA.ratesuccesstestcase(countGPA.length)
    
            gpafull += countGPA.ratesuccesstestcase / datax;
            gpa=roundToTwo(gpafull);
            //console.log("ratesuccesstestcase"+countGPA);
          });
          //console.log("length"+datax);
          //console.log("XXXXXXXXXXX"+gpa);
          var gpaSuccess={
            gpaSuccess:gpa,
          }
          user.update({username:res.locals.user.username},gpaSuccess).then((val) => {
            console.log("EDITED: " + val);
          })
          .catch((err) => {
              console.log(err);
          })
          
          /**Checking the verdict of each user submissions */
          data.forEach((subm) => {
            if (subm.verdict === "Accepted") {
              stats.AC += 1;
            } else if (subm.verdict === "Wrong Answer") {
              stats.WA += 1;
            } else if (subm.verdict === "Time Limit Exceeded") {
              stats.TLE += 1;
            } else if (subm.verdict === "Compilation Error") {
              stats.CE += 1;
            } else {
              stats.RE += 1;
            }
          });
          res.render("profile", { stats: stats , gpa:gpa, data:xxxx});
          pSubjects.find({ username: res.locals.user.username}).then((data)=>{
            if(data.length === 0){
              var xxxxx=new pSubjects({
                username:res.locals.user.username,
                point:xxxx,
              });
              xxxxx.save();
            }
            else{
              var xxxxxx=({
                username:res.locals.user.username,
                point:xxxx,
              });
              pSubjects.update({username:res.locals.user.username},xxxxxx).then((val) => {
                console.log("success" + val);
              })
              .catch((err) => {
                  console.log(err);
              })
            }
          })

        });

    })
    .catch((err) => {
      console.log(err);
    });
};

/**To show the user submission history table when logged in
 * route: /user/submissions
 */
exports.submissionHistory = async (req, res, next) => {
  /**Collecting the user submission data from the submissions collection
   * in descending order of the timestamp (newest to oldest)
   */
  submissions
    .find({ username: res.locals.user.username })
    .sort({ timeStamp: -1 })
    .then((data) => {
      /**Changing the date-time format */
      for (var i = 0; i < data.length; i++) {
        data[i].date = moment(data[i].timeStamp).format(
          "MMMM Do YYYY, h:mm:ss A"
        );
      }
      res.render("submissions", { data: data,gpa:gpa });
    })
    .catch((err) => {
      console.log(err);
    });
};

/**To show the user submission code and testcases results when logged in
 * route: /user/submission/subID
 */
exports.submission_subID = async (req, res, next) => {
  /**Collecting the user submission data from the submissions collection */
  submissions
    .findOne({ subID: req.params.subID })
    .then((data) => {
      /**Assuring that the user is opening his submission only */
      if (data.username === res.locals.user.username) {
        /**Changing the date-time format */
        data.date = moment(data.timeStamp).format("MMMM Do YYYY, h:mm:ss A");
        res.render("submission_subID", { data: data });
      } else {
        res.redirect("/user/submissions");
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

/**Getting the webpage for user info update
 * route: /user/updateProfile
 */
exports.getUpdateProfile = (req, res, next) => {
  res.render("edit_profile", { message: null });
};

/**Updating the user info i.e. email, name and password
 * POST: /user/updateProfile
 */
exports.postUpdateProfile = async (req, res, next) => {
  let message = "";
  /**Updating the user email and/or name */
  try {
    if (req.body.email) {
      await user.findByIdAndUpdate(
        { _id: req.user._id },
        { email: req.body.email }
      );
      // message += "Your-email-has-been-updated";
      message+= "?_UpdateEmailSuccess";
    }
    if (req.body.name) {
      await user.findOneAndUpdate(
        { _id: req.user._id },
        { name: req.body.name }
      );
      message += "?_UpdateNameSuccess";
    }
  } catch (error) {
    message += "?_ErrorUpdate";
  }
  /**Updating the user password */
  try {
    if (req.body.old && req.body.new) {
      await req.user.changePassword(req.body.old, req.body.new);
      message += "?_UpdatePassSuccess";
    }
  } catch (error) {
    if (error.message === "Password-or-username-is-incorrect") {
      message += "?_CurrentPasswordIsIncorrect";
    } else {
      message += "?_ErrorUpdatePassword";
    }
  }
  /**Passing the message in the form of the URL */
  res.redirect("/user/updateProfile" + (message || "Try-Again"));
};
exports.postPasswordReset=async (req, res, next) => {
  let message = "";
  var ResetUser=req.body.ResetUser;
  user.find({username:ResetUser}).then((data)=>{
    req.data.changePassword("updatePass"); 
  })
}