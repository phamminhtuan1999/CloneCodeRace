const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");

const pointSubjects = new mongoose.Schema({
  username: String,
  point: { type: Array },
});

const pointSubject = mongoose.model("pointSubjects", pointSubjects);

module.exports = pointSubject;
