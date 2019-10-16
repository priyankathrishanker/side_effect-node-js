var mongoose = require('mongoose');

var MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  reaction: [{name: String, count: Number}]
});

var Medicine = mongoose.model('Medicine', MedicineSchema);

module.exports = Medicine;