const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      id: { type: Number, ref: 'Product', required: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      category: { type: String, required: true }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = { Order };