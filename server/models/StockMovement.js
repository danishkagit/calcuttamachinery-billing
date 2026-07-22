const mongoose = require('mongoose');

/**
 * StockMovement — immutable ledger of every stock change.
 *
 * quantity  : positive = stock IN (purchase / adjustment / opening)
 *             negative = stock OUT (sale)
 * balanceAfter : snapshot of Product.openingStock after this movement
 */
const stockMovementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null
    },
    movementType: {
      type: String,
      enum: ['sale', 'purchase', 'adjustment', 'opening'],
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true
      // positive = in, negative = out — validated at route level
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
  }
);

// Compound index for common query patterns
stockMovementSchema.index({ userId: 1, createdAt: -1 });
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ invoice: 1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
