const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  provider:     { type: String, enum: ['esewa', 'khalti'], required: true },
  amount:       { type: Number, required: true }, // in NPR (rupees, not paisa)
  status:       { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  // eSewa specific
  transactionUuid: { type: String }, // our generated unique ref for eSewa
  // Khalti specific
  pidx:         { type: String }, // Khalti's payment identifier
  // Raw provider reference once confirmed
  providerRefId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
