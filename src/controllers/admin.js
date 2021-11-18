const helper = {};
const xlstojson = require('xls-to-json-lc');
const xlsxtojson = require('xlsx-to-json-lc');
const multer = require('multer');
const moment = require('moment');
const Question = require('../models/problems');
const TC = require('../models/testcases');
const total = require('../models/total_questions');
const contests = require('../models/contests');
const users = require('../models/users');
const tags = require('../models/tag');
const subjects = require('../models/subjects');
const admintration = require('../models/admintration');
const uploadsmodel = require('../models/uploadfile');
const participations = require('../models/participation');
// const {count} = require('../models/problems');
/** Admin homepage displaying all the problems created till now.
 * route: /admin
 */
helper.getAddQuestions = async (req, res, next) => {
  tags.find({}, function (error, dulieu) {
    res.render('problem_add', {data: dulieu});
  });
};
helper.getManageTags = async (req, res, next) => {
  tags.find({}, function (error, dulieu) {
    // console.log(dulieu);
    res.render('pages/manage_tags', {data: dulieu});
  });
};
helper.getManageQuestion = async (req, res, next) => {
  /** Finding all the problems sorted in descending order of the qID */
  console.log(req.body);
  const perPage = 25;
  const page = req.params.page || 1;
  try {
    await Question.find({})
      .sort({qID: -1})
      .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
      .limit(perPage)
      .then(data => {
        Question.countDocuments((err, count) => {
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
helper.displayAllProblems = async (req, res, next) => {
  /** Finding all the problems sorted in descending order of the qID */
  Question.find({})
    .sort({qID: -1})
    .limit(25)
    .then(data => {
      res.render('admin', {data});
    })
    .catch(err => {
      console.log(err);
    });
};

const files = [];
helper.ViewFileAdmin = async (req, res, next) => {
  try {
    const removed = files.splice(0);
    // sử dụng mongoose lây dữ liệu và đổ dữ liệu
    uploadsmodel.find({}, function (error, data) {
      // console.log(dulieu);
      res.render('./admin/admin_viewfile', {data});
      const removed = files.splice(0);
    });
  } catch (error) {
    console.log(error);
  }
};
helper.DeleteFile = async (req, res, next) => {
  try {
    const id_file = req.params.idfile;
    uploadsmodel.findByIdAndRemove(id_file).exec();
    res.redirect('/admin/viewfileadmin?_Success');
  } catch (error) {
    console.log(error);
  }
};
/** POST: creating a new problem
 * route: /admin/add
 */
helper.addQuestion = async function (req, res, next) {
  const {ques} = req.body; // problem statement
  const tc = req.body.testcases; // testcases
  const {qIDTags} = req.body;

  req.body.ques.problemSetter = req.user.name;
  // console.log(tc);
  // console.log("XXXXXXXXXXXXXXXXXXXXXXX");

  try {
    await total.countDocuments({}, async (err, cnt) => {
      /** If the problem is created for the very first time,
       * then 'total' collection would be empty
       */
      if (!cnt) {
        /** inserting totalProblems = 0, which increments
         * each time on inserting a new problem.
         */
        await total
          .create({totalProblems: 0})
          .then(data => {
            console.log(data);
          })
          .catch(err => {
            console.log(err);
          });
      }
    });
    // attach qID to tc and ques
    const qID = await total.findOne({}); // chú ý code qID , cần phải tạo qid để đếm số lượng bài tập
    qID.totalProblems += 1;
    await qID.save();
    ques.qID = qID.totalProblems;

    tc.qID = qID.totalProblems;

    // log them to the console
    // console.log(ques);
    console.log('xxxxxxxxxxxxxxxxXXXXXXXXXXXXXXXXXXXXXX');
    // console.log(ques.tags);
    // console.log(tc);
    console.log(`Problem submitted as qID = ${qID.totalProblems}`);
    // push to database
    await Question.create(ques);
    await TC.create(tc);

    // question successfully created
    res.send(`Problem submitted as qID = ${qID.totalProblems}`);
  } catch (error) {
    console.log("couldn't submit the question/testcase");
    console.log(error);
    res.send('Problem could not be submitted');
  }
  // res.redirect("/admin/manage_question");
};

/** POST: deleting the problem qID
 * route: /admin/dlt_prob/:qID
 *
 */
helper.deleteProblem = async (req, res, next) => {
  /** Finding question by qID */
  Question.deleteOne({qID: req.params.qID})
    .then(data => {
      /** Deleted successfully */
      res.redirect('/admin/manage_question?_Success');
    })
    .catch(err => {
      console.log(err);
    });
};

/** PUT: editing the problem qID
 * route: /admin/edit/:qID
 */
helper.editQuestion = async function (req, res, next) {
  // console.log(req.body.qID);
  // console.log(req.body.ques);
  // console.log(req.body.testcases);
  req.body.ques.problemSetter = req.user.name;
  try {
    /** Finding question and testcase by it's qID and updating */
    await Question.findOneAndUpdate({qID: req.body.qID}, req.body.ques);
    await TC.findOneAndUpdate({qID: req.body.qID}, req.body.testcases);
    res.send('Question was updated');
  } catch (error) {
    res.send("Couldn't update the question");
    console.log(error);
  }
  res.redirect('/admin/manage_question');
};

/** Display page for editing the existing problem having qID = params:qID
 * route: /admin/edit/:qID
 */
helper.getQuestion = async (req, res, next) => {
  // RECHECK
  /** Finding question and tescase using the qID */
  const ques = await Question.findOne({qID: req.params.qID});
  const t_case = await TC.findOne({qID: req.params.qID});
  const data = await tags.find({});
  res.render('problem_edit', {ques, t_case, data});
};

/** POST: creating a new contest
 * route: /admin/new-contest
 */
helper.createContest = async (req, res, next) => {
  /** Creating an object for new contest */
  const newContest = {
    creator: req.body.Creator,
    code: req.body.contestCode,
    name: req.body.contestName,
    date: `${req.body.date} ${req.body.startTime}`,
    endDate: 0,
    duration: req.body.duration,
    visible: req.body.visibility,
    problemsID: req.body.problemsID.split(',').map(qID => qID.trim()),
  };
  newContest.endDate = moment(newContest.date).add(newContest.duration, 'm').toDate();
  // console.log(newContest)

  let flag_contest = 0;
  await contests
    .findOne({code: newContest.code})
    .then(data => {
      if (data) flag_contest++;
    })
    .catch(err => {
      console.log(err);
    });

  if (flag_contest == 0) {
    await contests
      .create(newContest)
      .then(val => {
        console.log(val);
      })
      .catch(err => {
        console.log(err);
      });
    res.redirect('/admin/my-contests?status_Success');
  } else {
    // console.log("Inside flag_contest = 1")

    res.redirect('/admin/new-contest?status_False.');
  }
};

/** Display page consisting of all the created contests
 * route: /admin/my-contests
 */
helper.myContests = async (req, res, next) => {
  /** Finding all the contest in ascending order of the date */
  const {username} = req.user;
  // console.log("user:"+req.user.username);
  // console.log("admin:"+req.user.isAdmin);
  // console.log("teacher:"+req.user.isTeacher);

  // if(req.user.isAdmin == true && req.user.isTeacher==false){
  // contests.find({}).sort({ date: 1 })
  // .then((data) => {
  // /**Modifying the date format */
  // for (var i = 0; i < data.length; i++) {
  // data[i].D = moment(data[i].date).format('MMMM Do YYYY, h:mm:ss A');
  // }
  // console.log(data);
  // res.render("./admin/admin_contests", { data: data });
  // })
  // .catch((err) => {
  // console.log(err);
  // next();
  // });
  // }
  // else{
  // contests.find({creator:username}).sort({ date: 1 })
  // .then((data) => {
  // /**Modifying the date format */
  // for (var i = 0; i < data.length; i++) {
  // data[i].D = moment(data[i].date).format('MMMM Do YYYY, h:mm:ss A');
  // }
  // console.log(data);
  // res.render("./admin/admin_contests", { data: data });
  // })
  // .catch((err) => {
  // console.log(err);
  // });
  // }
  contests
    .find({})
    .sort({date: 1})
    .then(data => {
      /** Modifying the date format */
      for (let i = 0; i < data.length; i++) {
        data[i].D = moment(data[i].date).format('MMMM Do YYYY, h:mm:ss A');
      }
      console.log(data);
      res.render('./admin/admin_contests', {data});
    })
    .catch(err => {
      console.log(err);
      next();
    });
};

/** POST: deleting the constest params:contCode
 * route: /admin/dlt_contest/:contCode
 */
helper.deleteContest = async (req, res, next) => {
  /** Finding the contest by it's contCode */
  contests
    .deleteOne({code: req.params.contCode})
    .then(data => {
      res.redirect('/admin/my-contests?_Success');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/admin/my-contests?_False');
    });
};

/** Display page to edit the contest params:contCode
 * route: /admin/edit-contest/:contCode
 */
helper.displayEditContest = async (req, res, next) => {
  /** Finding the contest by it's contCode */
  Question.find({})
    .sort({qID: -1})
    .then(data1 => {
      contests
        .findOne({code: req.params.contCode})
        .then(data => {
          /** Formatting the date in order to display in the HTML */
          data.DD = moment(data.date).format('L').split('/')[1];
          data.MM = moment(data.date).format('L').split('/')[0];
          data.YY = moment(data.date).format('L').split('/')[2];
          data.TT = moment(data.date).format('HH:mm');
          res.render('edit_contest', {data, data1});
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
};
helper.getnewcontest = async (req, res, next) => {
  Question.find({})
    .sort({qID: -1})
    .then(data => {
      res.render('new_contest', {data});
    })
    .catch(err => {
      console.log(err);
    });
};

/** POST: edit the contest params:contCode
 * route: /admin/edit-contest/:contCode
 */
helper.editContest = async (req, res, next) => {
  /** Getting data from each fields in the edit contest form */
  const editContest = {
    code: req.params.contCode,
    name: req.body.contestName,
    date: `${req.body.date} ${req.body.startTime}`,
    duration: req.body.duration,
    visible: req.body.visibility,
    /** comma separated qID of the problems to be included in the contest */
    problemsID: req.body.problemsID.split(',').map(qID => qID.trim()),
  };
  editContest.endDate = moment(editContest.date).add(editContest.duration, 'm').toDate();

  await contests
    .update({code: req.params.contCode}, editContest)
    .then(val => {
      console.log(`EDITED: ${val}`);
      // res.redirect("/admin/my-contests?"+ req.params.contCode + "_success");
      res.redirect(`/admin/my-contests?${req.params.contCode}_Success`);
    })
    .catch(err => {
      console.log(err);
    });
};

/** Display the page for managing the admins
 * route: /admin/manage-admins
 */
helper.getManageAdmins = async (req, res, next) => {
  /** Finding all the users who are admins also */
  users
    .find({isAdmin: true})
    .then(data => {
      // console.log(data);
      res.render('manage_admins', {data});
    })
    .catch(err => {
      console.log(err);
    });
};

/** POST: adding a new admin
 * route: /admin/add-admin
 */
helper.addAdmin = async (req, res, next) => {
  /** Taking input from the html form */
  const adminUsername = req.body.username;
  /** Finding the entry of that username in the users collection */
  users
    .findOne({username: adminUsername})
    .then(data => {
      // console.log(data);
      /** No user found with username = adminUsername */
      if (!data) {
        return res.redirect(`/admin/manage-admins?msg=Username-${adminUsername}-does-not-exists`);
      }
      /** If the username is already the admin */
      if (data.isAdmin) {
        return res.redirect(
          `/admin/manage-admins?msg=Username-${adminUsername}-is-already-an-admin`,
        );
      }
      /** Else add that username as an admin */
      users
        .findOneAndUpdate(
          {username: adminUsername},
          {
            $set: {
              isAdmin: 1,
              isTeacher: 0,
              createProblem: 1,
              createContest: 1,
            },
          },
        )
        .then(result => {
          // console.log("ADMIN ADDED: " + result);
          return res.redirect(
            `/admin/manage-admins?msg=Username-${adminUsername}-added-successfully`,
          );
        });
    })
    .catch(err => {
      console.log(err);
    });
};
helper.addTeacher = async (req, res, next) => {
  /** Taking input from the html form */
  const adminUsername = req.body.username;
  /** Finding the entry of that username in the users collection */
  users
    .findOne({username: adminUsername})
    .then(data => {
      // console.log(data);
      /** No user found with username = adminUsername */
      if (!data) {
        return res.redirect(`/admin/manage-admins?msg=Username-${adminUsername}-does-not-exists`);
      }
      /** If the username is already the admin */
      if (data.isTeacher) {
        return res.redirect(
          `/admin/manage-admins?msg=Username-${adminUsername}-is-already-an-admin`,
        );
      }
      /** Else add that username as an admin */
      users
        .findOneAndUpdate(
          {username: adminUsername},
          {
            $set: {
              isTeacher: 1,
              isAdmin: 1,
              createProblem: 1,
              createContest: 1,
            },
          },
        )
        .then(result => {
          console.log(`TEACHER ADDED: ${result}`);
          return res.redirect(
            `/admin/manage-admins?msg=Username-${adminUsername}-added-successfully`,
          );
        });
    })
    .catch(err => {
      console.log(err);
    });
};

/** POST: removing an admin
 * route: /admin/remove-admin
 */
helper.removeAdmin = async (req, res, next) => {
  /** Taking input from the html form */
  const adminUsername = req.body.username;
  /** Finding the entry of that username in the users collection */
  users
    .findOne({username: adminUsername})
    .then(data => {
      // console.log(data);
      /** No user found with username = adminUsername */
      if (!data) {
        return res.redirect(`/admin/manage-admins?msg=Username-${adminUsername}-does-not-exists`);
      }
      /** If the username is not an admin */
      if (!data.isAdmin) {
        return res.redirect(`/admin/manage-admins?msg=Username-${adminUsername}-is-not-an-admin`);
      }
      /** Don't allow the admin to remove himself */
      if (adminUsername === res.locals.user.username) {
        return res.redirect('/admin/manage-admins?msg=You-cannot-remove-yourself');
      }
      /** Else remove that username from the admin */
      users
        .findOneAndUpdate(
          {username: adminUsername},
          {
            $set: {
              isAdmin: 0,
              isTeacher: 0,
              createProblem: 0,
              createContest: 0,
            },
          },
        )
        .then(result => {
          console.log(`REMOVED ADMIN: ${result}`);
          return res.redirect(
            `/admin/manage-admins?msg=Username-${adminUsername}-removed-successfully`,
          );
        });
    })
    .catch(err => {
      console.log(err);
    });
};
helper.addTags = async (req, res, next) => {
  try {
    tagName = req.body.tags;
    tagNameIdx = req.body.tagNameId;
    decriptionTags = req.body.decriptionTag;
    // console.log(tagName);
    tags.findOne({tagNameId: tagNameIdx}).then(data => {
      // console.log(data);
      // console.log(tagNameIdx);
      if (data != null) {
        res.redirect('/admin/manageTags?_False');
      } else {
        const tag1 = {
          tagNames: tagName,
          tagNameId: tagNameIdx,
          decriptionTag: decriptionTags,
        };
        const tagx = new tags(tag1);
        tagx.save();
        res.redirect('/admin/manageTags?_Success');
      }
      // for(var i=0;i<data.length; i++){
      //     if(data[i].tagNameId != tagNameIdx){

      //         var tag1 ={
      //             tagNames:tagName,
      //             tagNameId:tagNameIdx,
      //             decriptionTag:decriptionTags,
      //         }
      //         var tagx=new tags(tag1);
      //         tagx.save();
      //         res.redirect("/admin/manageTags?_Success");
      //     }
      //     else{
      //         res.redirect("/admin/manageTags?_False");

      //     }
      // }
    });
  } catch (error) {
    console.log(error);
    // res.redirect("/admin/manageTags?_False");
  }
};
helper.deleteTags = async (req, res, next) => {
  /** Finding question by qID */
  const idtags = req.params.idTags;
  tags
    .deleteOne({_id: idtags})
    .then(data => {
      /** Deleted successfully */
      res.redirect('/admin/manageTags?_Success');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/admin/manageTags?_False');
    });
};
helper.getCreateSubjects = async (req, res, next) => {
  if (req.user.isTeacher == false) {
    subjects.find({}, function (error, data) {
      Question.find({}, function (error, dataQuestion) {
        res.render('manage_subjects', {
          data,
          dataQuestion,
        });
      });
      // console.log(dulieu);
    });
  } else {
    return res.redirect('/admin?msg1=You-need-is-admin-to-view-page');
  }
};
helper.getEditSubjects = async (req, res, next) => {
  const idSubject = req.params.idSubjects;

  subjects
    .find({_id: idSubject})
    .then(data => {
      // ngoài view cần thêm hàm foreach.
      // console.log("dataSubjects"+data);
      res.render('edit_subjects', {data});
    })
    .catch(err => {
      console.log(err);
    });
};
helper.postEditSubjects = async (req, res, next) => {
  const idSubject = req.params.idSubjects;
  const {subjectName} = req.body;
  const chapterArray = req.body.chapter;
  const chapterqId = req.body.qId;

  // console.log("chapterArray"+chapterArray);
  // console.log("chapterArray.length"+chapterArray.length);
  const subject = {
    subjectsName: subjectName,
  };
  subjects
    .update({_id: idSubject}, subject)
    .then(val => {
      // console.log("EDITED: " + val);
      res.redirect('/admin/create_subjects?_Success');
    })
    .catch(err => {
      console.log(err);
    });
};
helper.postCreateSubjects = async function (req, res, next) {
  try {
    const {subjectName} = req.body;
    const chapterArray = req.body.chapter;
    const chapterqId = req.body.qId;
    const {chaptercount} = req.body;
    const subject = new subjects({
      subjectsName: subjectName,
    });
    subject.save();
  } catch (error) {
    console.log(error);
  }
  res.redirect('/admin/create_subjects?_Success');
};
helper.deleteSubject = async (req, res, next) => {
  /** Finding question by qID */
  const idSubject = req.params.idSubjects;
  subjects
    .deleteOne({_id: idSubject})
    .then(data => {
      res.redirect('/admin/create_subjects?_Success');
    })
    .catch(err => {
      console.log(err);
    });
};

// Add chapter
helper.getAddChapter = async (req, res, next) => {
  const idSubject = req.params.idSubjects;
  subjects.find({_id: idSubject}).then(data => {
    // console.log("Chapter"+data[0].subjectsName);

    // console.log("Chapter"+data[0].chapter);
    res.render('./admin/add_chapter', {data});
  });
};
/** Post Add Chapter */
helper.postAddChapter = async (req, res, next) => {
  try {
    const idSubject = req.params.idSubjects;
    const chapterName = req.body.chapter;
    const chapterqId = req.body.qIdChapter;
    const qidx = chapterqId.split(',').map(qId => qId.trim());
    const chapters = {
      ChapterName: chapterName,
      qId: qidx,
    };
    subjects.findOneAndUpdate(
      {_id: req.params.idSubjects},
      {$push: {chapter: chapters}},
      function (error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log(success);
        }
      },
    );
    res.redirect(`/admin/add_chapter/${req.params.idSubjects}?_Success`);
  } catch (err) {
    if (err) {
      console.log(err);
    }
    next();
  }
};

/** Edit Chapter */
helper.getEditChapter = async (req, res, next) => {
  try {
    subjects
      .find({_id: req.params.idSubject}, {chapter: {$elemMatch: {_id: req.params.idChapter}}})
      .then(data => {
        // console.log("XXNXNXNXNNX"+data);
        res.render('edit_chapter', {data});
      });
  } catch (err) {
    if (err) {
      console.log(err);
    }
    next();
  }
};

helper.postEditChapter = async (req, res, next) => {
  try {
    const chapterName = req.body.chapter;
    const chapterqId = req.body.qIdChapter;
    const qidx = chapterqId.split(',').map(qId => qId.trim());
    const chapters = {
      ChapterName: chapterName,
      qId: qidx,
    };
    subjects.updateMany(
      {_id: req.params.idSubject, 'chapter._id': req.params.idChapter},
      {$set: {'chapter.$': chapters}},
      function (err, obj) {
        if (err) {
          console.log(err);
        } else {
          console.log(`Success${obj[0]}`);
        }
      },
    );

    res.redirect(`/admin/add_chapter/${req.params.idSubject}?_Success`);
  } catch (err) {
    if (err) {
      console.log(err);
    }
    next();
  }
};

helper.postDeleteChapter = async (req, res, next) => {
  // const idChapter=req.params.idChapter;
  // const idSubject=req.params.idSubject;
  subjects.update(
    {_id: req.params.idSubject},
    {$pull: {chapter: {_id: req.params.idChapter}}},
    {safe: true, multi: true},
    function (err, obj) {},
  );
  res.redirect(`/admin/add_chapter/${req.params.idSubject}?_Success`);
};
// upload excel

const storage = multer.diskStorage({
  // multers disk storage settings
  destination(req, file, cb) {
    cb(null, './fileexcel');
  },
  filename(req, file, cb) {
    const datetimestamp = Date.now();
    cb(
      null,
      `${file.fieldname}-${datetimestamp}.${
        file.originalname.split('.')[file.originalname.split('.').length - 1]
      }`,
    );
  },
});

const uploadexcel = multer({
  // multer settings
  storage,
  fileFilter(req, file, callback) {
    // file filter
    if (
      ['xls', 'xlsx'].indexOf(
        file.originalname.split('.')[file.originalname.split('.').length - 1],
      ) === -1
    ) {
      return callback(new Error('Wrong extension type'));
    }
    callback(null, true);
  },
}).single('file');

helper.uploadexcel = async (req, res, next) => {
  let exceltojson;
  const dataArray = [];
  uploadexcel(req, res, function (err) {
    if (err) {
      res.redirect('/admin/upexcel?_filenotfound');
      return;
    }
    /** Multer gives us file info in req.file object */
    if (!req.file) {
      res.redirect('/admin/upexcel?_filenotfound');
      return;
    }
    /** Check the extension of the incoming file and
     *  use the appropriate module
     */
    if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
      exceltojson = xlsxtojson;
    } else {
      exceltojson = xlstojson;
    }
    // console.log(req.file.path);
    try {
      exceltojson(
        {
          input: req.file.path,
          output: null, // since we don't need output.json
          lowerCaseHeaders: true,
        },
        function (err, result) {
          if (err) {
            // Gửi dữ liệu lỗi về màn hình
            res.redirect('/admin/upexcel?_filenotfound');

            return res.json({error_code: 1, err_desc: err, data: null});
          }

          const data = result;
          // console.log(result);

          total.findOne({}, async function (req, res, next) {
            try {
              await total.countDocuments({}, async (err, cnt) => {
                /** If the problem is created for the very first time,
                 * then 'total' collection would be empty
                 */
                if (!cnt) {
                  /** inserting totalProblems = 0, which increments
                   * each time on inserting a new problem.
                   */
                  await total
                    .create({totalProblems: 0})
                    .then(questions => {
                      console.log(questions);
                    })
                    .catch(err => {
                      console.log(err);
                    });
                }
              });
              // attach qID to tc and ques
              const qID = await total.findOne({}); // chú ý code qID , cần phải tạo qid để đếm số lượng bài tập

              for (i = 0; i < data.length; i++) {
                const idx = (qID.totalProblems += 1); // tăng dần
                await qID.save();

                const dataTag = data[i].tags; // Chuỗi
                const dataName = data[i].name;
                const dataIsVisible = data[i].isvisible;
                const dataDescription = data[i].description;
                const dataInputFormat = data[i].inputformat;
                const dataOutputFormat = data[i].outputformat;
                const dataConstraints = data[i].constraints;
                const dataSampleInput = data[i].sampleinput;
                const dataSampleOutput = data[i].sampleoutput;
                const dataExplanation = data[i].explanation;
                const dataDifficulty = data[i].difficulty;
                const dataProblemSetter = data[i].problemsetter;
                const dataEditorial = data[i].editorial;
                const dataTimeLimitCheck = '15';
                const dataMemoryLimitCheck = '7000';
                if (dataTag == null || dataTag == '') {
                  var tag1 = '#NoTag';
                } else {
                  var tag1 = dataTag.split('|').map(item => item.trim());
                }
                if (
                  dataIsVisible == '' ||
                  dataIsVisible == null ||
                  dataIsVisible !== '1' ||
                  dataName == '' ||
                  dataName == null
                ) {
                  var dataIsVisibleCheck = '0';
                } else {
                  var dataIsVisibleCheck = '1';
                }

                if (
                  dataDifficulty == null ||
                  dataDifficulty == '' ||
                  parseFloat(dataDifficulty) < 0 ||
                  parseFloat(dataDifficulty) > 1 ||
                  Number.isFinite(parseInt(dataDifficulty)) === false
                ) {
                  var dataDifficultyCheck = '0.5';
                } else {
                  var dataDifficultyCheck = dataDifficulty;
                }
                // var tag1=tag.split(",").map(item=>{
                //     var rObj1 = {};
                //     var tag2=item.split("/",2);
                //     rObj1._id=tag2[0];
                //     rObj1.tagNames=tag2[1];
                //     return rObj1;

                //   });
                // Kiểm tra
                // var tag =data[i].tags;
                // var tagName=tag.split(",");
                // console.log("Hien Thi Tag:"+tagName);
                // var checkTagName=tags.find({tagNameId:tagName}).then((dataCheck)=>{
                //     console.log("xxxxxxxxxxxxxxxxx"+dataCheck);

                // })

                const questions = new Question({
                  qID: idx,
                  name: dataName,
                  isVisible: dataIsVisibleCheck,
                  description: dataDescription,
                  inputFormat: dataInputFormat,
                  outputFormat: dataOutputFormat,
                  constraints: dataConstraints,
                  sampleInput: dataSampleInput,
                  sampleOutput: dataSampleOutput,
                  explanation: dataExplanation,
                  difficulty: dataDifficultyCheck,
                  difficultyAutoUpdate: dataDifficultyCheck,
                  problemSetter: dataProblemSetter,
                  timeLimit: dataTimeLimitCheck,
                  memoryLimit: dataMemoryLimitCheck,
                  editorial: dataEditorial,
                  tags: tag1,
                });
                var txt = data[i].case; // Chuỗi
                if (txt == null || txt == '') {
                  var txt = 'null|null';
                  continue;
                } else {
                  var txt1 = txt.split('|').map(item => {
                    const rObj = {};
                    const txt2 = item.split(';', 2);
                    rObj.stdin = txt2[0];
                    rObj.stdout = txt2[1];
                    return rObj;
                  });
                }

                const count = txt1.length;
                // console.log(txt1);
                // console.log(count);
                const testcase = new TC({
                  qID: idx,
                  timeLimit: dataTimeLimitCheck,
                  memoryLimit: dataMemoryLimitCheck,
                  cases: txt1,
                });
                questions.save(function (error) {
                  if (error) {
                    throw error;
                  }
                });
                testcase.save(function (error) {
                  if (error) {
                    throw error;
                  }
                });
                dataArray.push(idx);
                // console.log("DataArrayXXXXXX"+dataArray);
              }
            } catch (error) {
              // console.log("couldn't submit the question/testcase");
              console.log(error);
              next();
              // New
              // res.send("couldn't submit the question/testcase");
            }
          });
          // console.log("DataArrayXXXXXX"+dataArray);
          res.redirect('/admin/upexcel?_Success');
        },
      );
    } catch (e) {
      res.json({error_code: 1, err_desc: 'Corupted excel file'});
    }
  });
};
helper.upexcel = async (req, res, next) => {
  res.render('upexcel.ejs', {title: 'Express'});
};

// upload documentfile

const file = [];
helper.uploadfile = async (req, res, next) => {
  res.render('uploadfile.ejs', {title: 'Express'});
};
helper.storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, './filedocument');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
helper.upload = async (req, res, next) => {
  // console.log(req.files[0].path);
  file.push(req.files[0].path); // đẩy dữ liệu vào mảng imgs đã khai báo ở trên

  res.status(200).send(req.files);
};
helper.upfile = async (req, res, next) => {
  try {
    const {ten} = req.body;
    const {description} = req.body;

    // console.log(ten);

    const onefile = {
      ten,
      description,
      files: file,
    };
    const dulieu = new uploadsmodel(onefile);
    dulieu.save();
    const removed = file.splice(0);
    // res.redirect("/admin/upexcel?_filenotfound");

    res.redirect('/admin/uploadfile?_Success');
  } catch (err) {
    console.log(err);
    if (err) {
      res.redirect('/admin/uploadfile?_False');
    }
    next();
  }
};
helper.editFile = async (req, res, next) => {
  const id_file = req.params.idfile;
  uploadsmodel
    .find({_id: id_file})
    .then(data => {
      res.render('edit_file.ejs', {data});
    })
    .catch(err => {
      console.log(err);
    });
};
helper.postEditFile = async (req, res, next) => {
  const id_file = req.params.idfile;
  uploadsmodel.findById(id_file, function (err, data) {
    if (err) return handleError(err);
    (data.ten = req.body.name), (data.description = req.body.description);
    // console.log(file);
    // console.log(editfile.files);
    // console.log(file.length);
    if (file.length === 0) {
      data.files = data.files;
    } else {
      const filePath = data.files[0];
      data.files = file;
    }
    data.save();
    const removed = file.splice(0);
    res.redirect('/admin/viewfileadmin');
    // files:{type:Array}
  });
};
helper.teacherCheck = async (req, res, next) => {
  const id_createProblem = req.body.createProblem;
  const id_createContest = req.body.createContest;
  console.log(`check_Problem${id_createProblem}`);
  console.log(`check_Contest${id_createContest}`);
  const updateUser = {
    createProblem: req.body.createProblem,
    createContest: req.body.createContest,
  };
  users
    .update({isTeacher: true}, updateUser)
    .then(val => {
      console.log(`EDITED: ${val}`);
      // res.redirect("/admin/manage-admins");
    })
    .catch(err => {
      console.log(err);
    });
  try {
    await admintration.countDocuments({}, async (err, cad) => {
      if (!cad) {
        await admintration
          .create({
            createProblem: req.body.createProblem,
            createContest: req.body.createContest,
          })
          .then(data => {
            console.log(data);
          })
          .catch(err => {
            console.log(err);
          });

        res.redirect('/admin/manage-admins?msg=Success');
      } else {
        admintration.update({}, updateUser).then(val => {
          console.log(`EDITED: ${val}`);
          res.redirect('/admin/manage-admins?msg=Success');
        });
      }
    });
  } catch (err) {
    console.log(err);
    next();
  }
  // users.find({isTeacher:true})
};
/*
 * Sort the participation collection based on score and render the ranklist.
 * /contests/:code/standings/
 */
helper.rankListAdmin = async (req, res, next) => {
  const contest = req.params.contCode;
  // console.log(contest);
  contests.find({code: contest}).then(data => {
    // console.log(data);
    if (data.length === 0) {
      res.render('404');
      return;
    }
    // console.log(data);
    // console.log(typeof(contest));
    participations
      .find({contestCode: contest})
      .sort({score: -1, penalty: 1})
      .then(async participations => {
        res.render('./admin/rankList_admin', {
          contest: data,
          list: participations,
        });
      });
  });
};

module.exports = helper;
