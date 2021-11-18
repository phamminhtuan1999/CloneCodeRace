const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");

const passportLocalMongoose = require("passport-local-mongoose");

const user = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  questionAccess: { type: Array, default: 0 },
  skill: { type: Array },
  gpaSuccess: { type: Number, default: 0 },
  isAdmin: Boolean,
  isTeacher: { type: Boolean, default: 0 },
});

user.plugin(passportLocalMongoose);

module.exports = mongoose.model("user", user);
