const mongoose = require('mongoose');
const Double = require('@mongoosejs/double');

const problem = new mongoose.Schema({
  qID: Number,
  name: String,
  isVisible: Boolean,
  description: String,
  inputFormat: String,
  outputFormat: String,
  explanation: String,
  difficulty: Number,
  difficultyAutoUpdate: {type: Number, default: 0},
  problemSetter: String,
  timeLimit: Double,
  memoryLimit: Number,
  tags: [{_id: String, tagNames: String, difficulty: Number}],
  editorial: String,
});
const Problems = mongoose.model('Problems', problem);
module.exports = Problems;
