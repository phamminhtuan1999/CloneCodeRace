const mongoose = require("mongoose");

const subject = new mongoose.Schema({
  subjectsName: String,
  chapter: [{ ChapterName: String, qId: [String] }],
});

const Subjects = mongoose.model("Subjects", subject);

module.exports = Subjects;
