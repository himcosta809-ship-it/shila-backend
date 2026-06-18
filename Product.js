const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Crochet', 'Jewelry', 'Knitwear', 'Accessories']
  },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  inStock: { type: Boolean, default: true },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
