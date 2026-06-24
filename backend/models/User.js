const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  displayName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('User', schema);
