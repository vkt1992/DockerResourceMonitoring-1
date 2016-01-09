var mongoose = require('mongoose');

var CPU_USAGE = mongoose.Schema({
  Id : mongoose.Schema.Types.ObjectId,
  cpu_usage : String,
});

module.exports = mongoose.model('CPU_USAGE', userSchema, 'CPU_USAGE');
