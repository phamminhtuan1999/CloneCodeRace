const mongoose = require('mongoose');
const config = require('../config/config');

const connectionString = config.database.url;
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

const initDatabase = async () => {
  try {
    await mongoose.connect(connectionString, connectionOptions);
  } catch (error) {
    throw new Error(`MongoDB connecting failed: ${error}`);
  }
};

module.exports = initDatabase;
