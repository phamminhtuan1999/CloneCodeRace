const mongoose = require('mongoose');

const tags = new mongoose.Schema({
  tagNames: String,
  decriptionTag: String,
});

const Tags = mongoose.model('Tags', tags);

module.exports = Tags;
