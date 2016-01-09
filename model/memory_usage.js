var mongoose = require('mongoose');

var MEMORY_USAGE = mongoose.Schema({
  Id : mongoose.Schema.Types.ObjectId,
  memory_usage : String,
});

module.exports = mongoose.model('MEMORY_USAGE', userSchema, 'MEMORY_USAGE');
