const express = require('express');

const router = express.Router();
const multer = require('multer');
const admin = require('../controllers/admin');
// var uploadexcel = require("../models/uploadexcel");
// const Question = require("../models/problems");
// const total=require("../models/total_questions");
// const testcaseup=require("../models/testcases");
// var total_questions=require("../models/total_questions");

// UploadFile
const {storage} = admin;
const upload = multer({storage});

/** Admin homepage displaying all the problems created till now */
router.get('/', admin.displayAllProblems);

router.get('/manage-questions/:page', admin.getManageQuestion);

/** Display page for creating a new problem */
router.get('/add', admin.getAddQuestions);

/* Display page for creating and manage tags */
router.get('/manageTags', admin.getManageTags);

/** Post:Creating new tags */
router.post('/addTags', admin.addTags);

router.post('/deleteTags/:idTags', admin.deleteTags);

/** Display page for editing the existing problem having qID = params:qID */
router.get('/edit/:qID', admin.getQuestion);

/** Display page for rasnklist contest  */
router.get('/contests/:contCode/standings', admin.rankListAdmin);

/** POST: creating a new problem */
router.post('/add', admin.addQuestion);

/** PUT: editing the problem qID */
router.put('/edit/:qID', admin.editQuestion);

/** POST: deleting the problem qID */
router.post('/dlt_prob/:qID', admin.deleteProblem);

/** POST: deleting the constest params:contCode */
router.post('/dlt_contest/:contCode', admin.deleteContest);

/** Get:create new subjects  */
router.get('/create_subjects', admin.getCreateSubjects);

/** Post:Create new subjects  */
router.post('/create_subjects', admin.postCreateSubjects);

/** Delete:Delete subjects */
router.post('/deleteSubject/:idSubjects', admin.deleteSubject);

/** Get:Edit _subjects  */
router.get('/edit_subjects/:idSubjects', admin.getEditSubjects);

/** Post:Create new subjects  */
router.post('/edit_subjects/:idSubjects', admin.postEditSubjects);

/** Get Add chapter */
router.get('/add_chapter/:idSubjects', admin.getAddChapter);
/** Post Add Chapter */
router.post('/add_chapter/:idSubjects', admin.postAddChapter);
/** Get Edit Chapter */
router.get('/edit_chapter/:idSubject/:idChapter', admin.getEditChapter);
/** Post Edit Chapter */
router.post('/edit_chapter/:idSubject/:idChapter', admin.postEditChapter);
/** Post Delete Chapter */
router.post('/dltChapter/:idSubject/:idChapter', admin.postDeleteChapter);
/** GET:new contents */
router.get('/new-contest', admin.getnewcontest);

/** POST: creating a new contest */
router.post('/new-contest', admin.createContest);

/** Display page consisting all the created contests */
router.get('/my-contests', admin.myContests);

/** Display the page for managing the admins */
router.get('/manage-admins', admin.getManageAdmins);

/** POST: adding a new admin */
router.post('/add-admin', admin.addAdmin);
/** POST: removing an admin */
router.post('/remove-admin', admin.removeAdmin);

/** POST:add a new teacher */
router.post('/add-teacher', admin.addTeacher);

/** Display page to edit the contest params:contCode */
router.get('/edit-contest/:contCode', admin.displayEditContest);

/** POST: edit the contest params:contCode */
router.post('/edit-contest/:contCode', admin.editContest);
router.post('/teacherCheck', admin.teacherCheck);

router.get('/uploadfile', admin.uploadfile);
router.post('/upload', upload.any(), admin.upload);
/// ///////////////////////////////////////////////////////////////
router.post('/upfile', admin.upfile);

// router.get('/edit_file/:idfile',admin.EditFile);

router.get('/edit_file/:idfile', admin.editFile);
router.post('/edit_file/:idfile', admin.postEditFile);
router.get('/delete_file/:idfile', admin.DeleteFile);
router.get('/viewfileadmin', admin.ViewFileAdmin);
/** API path that will upload the files */
router.post('/uploadexcel', admin.uploadexcel);

router.get('/upexcel', admin.upexcel);
module.exports = router;
