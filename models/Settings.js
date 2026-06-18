const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  // Typography
  headingFontSize: { type: Number, default: 40 },   // px, hero title size
  bodyFontSize:    { type: Number, default: 16 },    // px, base body text
  // Images
  productImageHeight: { type: Number, default: 220 }, // px, product card image height
  // Social / contact links
  instagramUrl: { type: String, default: '' },
  facebookUrl:  { type: String, default: '' },
  whatsappNumber: { type: String, default: '' }, // digits only, e.g. 9779765352818
  phoneNumber:  { type: String, default: '' },   // display format, e.g. +977 976-5352818
  email:        { type: String, default: '' },
  address:      { type: String, default: '' }
}, { timestamps: true });

// Always operate on a single settings document
SettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('Settings', SettingsSchema);
