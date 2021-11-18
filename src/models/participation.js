const mongoose = require("mongoose");

const parti = new mongoose.Schema({
  parID: Number,
  username: String,
  startTime: Date,
  endTime: Date,
  isVirtual: Boolean,
  isICPC: Boolean,
  contestCode: String,
  submissions: [Number],
  solved_qID: [Number],
  score: Number,
  penalty: Number,
});

const Participation = mongoose.model("Participation", parti);
module.exports = Participation;
