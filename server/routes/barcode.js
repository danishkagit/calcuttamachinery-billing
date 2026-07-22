const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bwipjs = require('bwip-js');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// ─── Helpers ────────────────────────────────────────────────────────────────

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

/**
 * bwipjs bcid names for our three supported types.
 * See https://bwip-js.metafloor.com/ for the full list.
 */
const TYPE_MAP = {
  code128: 'code128',
  qrcode:  'qrcode',
  ean13:   'ean13'
};

/**
 * Generate a barcode/QR PNG buffer using bwip-js.
 *
 * @param {string} text   — data to encode
 * @param {string} type   — 'code128' | 'qrcode' | 'ean13'
 * @returns {Promise<Buffer>} PNG buffer
 */
const generateBarcode = async (text, type = 'code128') => {
  const bcid = TYPE_MAP[type] || 'code128';

  const options = {
    bcid,
    text,
    scale:       3,
    height:      10,
    includetext: true,
    textxalign:  'center'
  };

  // QR codes don't support height/includetext the same way
  if (bcid === 'qrcode') {
    delete options.height;
    delete options.includetext;
    delete options.textxalign;
    options.scale = 4;
  }

  // EAN-13 requires exactly 13 digits; pad or trim defensively
  if (bcid === 'ean13') {
    const digits = text.replace(/\D/g, '').padEnd(13, '0').slice(0, 13);
    options.text = digits;
  }

  return bwipjs.toBuffer(options);
};

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/barcode/:productId
 * Generate a Code128 barcode for a product's HSN code + name.
 * Returns JSON: { barcode: 'data:image/png;base64,...', product: { name, hsn } }
 */
router.get('/:productId', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Build meaningful barcode text: prefer HSN if present, fall back to product name
    const hsnCode = product.hsn || product.hsnCode || '';
    const barcodeText = hsnCode
      ? `${hsnCode} ${product.name}`.slice(0, 80) // Code128 handles up to ~80 printable chars
      : product.name.slice(0, 80);

    const pngBuffer = await generateBarcode(barcodeText, 'code128');
    const base64 = pngBuffer.toString('base64');

    res.json({
      success: true,
      data: {
        barcode: `data:image/png;base64,${base64}`,
        product: {
          _id:    product._id,
          name:   product.name,
          hsn:    hsnCode,
          text:   barcodeText
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/barcode/custom
 * Generate a barcode for arbitrary text.
 * Body: { text: string, type?: 'code128'|'qrcode'|'ean13' }
 * Returns JSON: { barcode: 'data:image/png;base64,...' }
 */
router.post(
  '/custom',
  protect,
  [
    body('text')
      .notEmpty().withMessage('text is required')
      .isString().withMessage('text must be a string')
      .isLength({ min: 1, max: 500 }).withMessage('text must be between 1 and 500 characters'),
    body('type')
      .optional()
      .isIn(['code128', 'qrcode', 'ean13'])
      .withMessage('type must be one of: code128, qrcode, ean13')
  ],
  validate,
  async (req, res) => {
    try {
      const { text, type = 'code128' } = req.body;

      const pngBuffer = await generateBarcode(text, type);
      const base64 = pngBuffer.toString('base64');

      res.json({
        success: true,
        data: {
          barcode: `data:image/png;base64,${base64}`,
          text,
          type
        }
      });
    } catch (error) {
      // bwip-js throws descriptive errors (e.g. "bad character in input")
      const statusCode = error.message && error.message.toLowerCase().includes('not found') ? 404 : 400;
      res.status(statusCode).json({ success: false, error: error.message });
    }
  }
);

module.exports = router;
