const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const GST_API_BASE = 'https://services.gst.gov.in/services/api/search';

const STATUS_MAP = {
  ACT: 'Active',
  CNL: 'Cancelled',
  SUS: 'Suspended',
};

function extractAddress(pradr) {
  if (!pradr) return null;
  const parts = [pradr.bnm, pradr.bno, pradr.st, pradr.loc, pradr.dst].filter(Boolean);
  return {
    address: parts.join(', '),
    city: pradr.loc || pradr.dst || '',
    pincode: pradr.pncd || '',
  };
}

router.get('/:gstin', protect, async (req, res) => {
  try {
    const { gstin } = req.params;

    if (!gstin || gstin.length !== 15) {
      return res.status(400).json({ success: false, error: 'Invalid GSTIN format' });
    }

    const response = await axios.get(`${GST_API_BASE}/taxpayerDetails/${gstin}`, {
      timeout: 10000,
    });

    const data = response.data;

    if (data.errorCode === 'SWEB_9035' || !data.lgnm) {
      return res.status(404).json({ success: false, error: 'GSTIN not found' });
    }

    const result = {
      gstin,
      legalName: data.lgnm,
      tradeName: data.tradeNam || null,
      status: STATUS_MAP[data.sts] || data.sts || 'Unknown',
      taxpayerType: data.dty || 'Unknown',
      constitution: data.ctb || 'Unknown',
      registrationDate: data.rgdt || null,
      stateCode: Number(gstin.substring(0, 2)),
      panNumber: gstin.substring(2, 12),
      address: extractAddress(data.pradr),
      natureOfBusiness: data.nba || [],
      lastUpdate: data.lstupdt || null,
    };

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        return res.status(404).json({ success: false, error: 'GSTIN not found' });
      }
      if (error.response.status === 429) {
        return res.status(429).json({ success: false, error: 'Rate limited. Please try again later.' });
      }
    }
    res.status(500).json({ success: false, error: 'Failed to fetch GSTIN details' });
  }
});

module.exports = router;
