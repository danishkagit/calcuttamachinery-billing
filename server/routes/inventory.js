const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../middleware/auditLog');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

/**
 * GET /api/inventory/movements
 *
 * Query params:
 *   productId    {string}  – filter by product ObjectId
 *   movementType {string}  – sale | purchase | adjustment | opening
 *   startDate    {string}  – ISO date lower bound on createdAt
 *   endDate      {string}  – ISO date upper bound on createdAt
 *   invoiceId    {string}  – filter by invoice ObjectId
 *   page         {number}  – default 1
 *   limit        {number}  – default 20, max 100
 */
router.get('/movements', protect, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = { userId: req.user._id };

    if (req.query.productId && mongoose.isValidObjectId(req.query.productId)) {
      filter.product = new mongoose.Types.ObjectId(req.query.productId);
    }

    if (
      req.query.movementType &&
      ['sale', 'purchase', 'adjustment', 'opening'].includes(req.query.movementType)
    ) {
      filter.movementType = req.query.movementType;
    }

    if (req.query.invoiceId && mongoose.isValidObjectId(req.query.invoiceId)) {
      filter.invoice = new mongoose.Types.ObjectId(req.query.invoiceId);
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('product', 'name unit hsnCode')
        .populate('invoice', 'invoiceNo invoiceDate invoiceType')
        .lean(),
      StockMovement.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: movements,
      count: movements.length,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/inventory/low-stock
 *
 * Returns all products where openingStock <= lowStockAlert.
 * Supports optional ?search= filter on product name.
 */
router.get('/low-stock', protect, async (req, res) => {
  try {
    const filter = {
      userId: req.user._id,
      $expr: { $lte: ['$openingStock', '$lowStockAlert'] }
    };

    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const products = await Product.find(filter)
      .sort({ openingStock: 1 })
      .lean();

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/inventory/adjustment
 *
 * Body:
 *   productId  {string, required} – Product ObjectId
 *   quantity   {number, required} – positive = add stock, negative = remove stock
 *   notes      {string}           – reason for adjustment
 *
 * Atomically updates Product.openingStock and creates a StockMovement record.
 */
router.post(
  '/adjustment',
  protect,
  [
    body('productId')
      .notEmpty()
      .withMessage('productId is required')
      .custom((v) => mongoose.isValidObjectId(v))
      .withMessage('productId must be a valid ObjectId'),
    body('quantity')
      .isNumeric()
      .withMessage('quantity must be a number')
      .custom((v) => v !== 0)
      .withMessage('quantity must not be zero'),
    body('notes').optional().isString().trim()
  ],
  validate,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { productId, quantity, notes } = req.body;
      const qty = Number(quantity);

      const product = await Product.findOne({
        _id: productId,
        userId: req.user._id
      }).session(session);

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      const oldStock = product.openingStock || 0;
      const newStock = oldStock + qty;

      product.openingStock = newStock;
      await product.save({ session });

      const movement = await StockMovement.create(
        [
          {
            userId:       req.user._id,
            product:      product._id,
            invoice:      null,
            movementType: 'adjustment',
            quantity:     qty,
            balanceAfter: newStock,
            notes:        notes || `Manual adjustment of ${qty > 0 ? '+' : ''}${qty} units`
          }
        ],
        { session }
      );

      await session.commitTransaction();

      // Fire-and-forget audit log
      logAudit(
        req,
        'UPDATE',
        'Product',
        product._id,
        product.name,
        `Stock adjustment: ${qty > 0 ? '+' : ''}${qty} units (${oldStock} → ${newStock})`,
        { openingStock: oldStock },
        { openingStock: newStock }
      );

      res.status(201).json({
        success: true,
        data: {
          movement: movement[0],
          product: {
            _id:          product._id,
            name:         product.name,
            openingStock: product.openingStock
          }
        }
      });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ success: false, error: error.message });
    } finally {
      session.endSession();
    }
  }
);

module.exports = router;
