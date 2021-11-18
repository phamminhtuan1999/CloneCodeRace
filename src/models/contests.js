const mongoose = require("mongoose");

const contests = new mongoose.Schema({
  code: String,
  name: String,
  date: Date,
  endDate: Date,
  duration: Number,
  visible: Boolean,
  problemsID: [String],
});

const Contests = mongoose.model("Contests", contests);

module.exports = Contests;
