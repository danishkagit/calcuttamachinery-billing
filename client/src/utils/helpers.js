export const formatCurrency = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹ 0.00';
  const parts = Number(num).toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  let lastThree = integerPart.slice(-3);
  let otherNumbers = integerPart.slice(0, -3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `₹ ${formatted}.${decimalPart}`;
};

export const formatINR = (num) => {
  return formatCurrency(num);
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const convertIndian = (num) => {
  if (num === 0) return '';
  if (num < 20) return ones[num] + ' ';
  if (num < 100) return tens[Math.floor(num / 10)] + ' ' + ones[num % 10] + ' ';
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + convertIndian(num % 100);
  if (num < 100000) return convertIndian(Math.floor(num / 1000)) + 'Thousand ' + convertIndian(num % 1000);
  if (num < 10000000) return convertIndian(Math.floor(num / 100000)) + 'Lakh ' + convertIndian(num % 100000);
  return convertIndian(Math.floor(num / 10000000)) + 'Crore ' + convertIndian(num % 10000000);
};

export const amountInWords = (amount) => {
  if (!amount || isNaN(amount)) return 'Zero';
  const num = Math.abs(amount);
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  let words = 'Rupees ' + convertIndian(integerPart).trim();
  if (words === 'Rupees ') words = 'Rupees Zero';
  if (decimalPart > 0) {
    words += ' And ' + convertIndian(decimalPart).trim() + ' Paise';
  }
  words += ' Only';
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const getStatusBadge = (status) => {
  const map = {
    Paid: 'bg-success',
    Unpaid: 'bg-danger',
    Partial: 'bg-warning text-dark',
  };
  return `<span class="badge ${map[status] || 'bg-secondary'}">${status || 'Unknown'}</span>`;
};

export const calculateTax = (amount, rate, type = 'gst') => {
  const taxAmount = (amount * rate) / 100;
  if (type === 'igst') {
    return { igst: taxAmount, cgst: 0, sgst: 0 };
  }
  return { cgst: taxAmount / 2, sgst: taxAmount / 2, igst: 0 };
};

export const generatePDF = () => {
  window.print();
};

export const INDIAN_STATES = [
  { code: 1, name: 'Jammu & Kashmir' },
  { code: 2, name: 'Himachal Pradesh' },
  { code: 3, name: 'Punjab' },
  { code: 4, name: 'Chandigarh' },
  { code: 5, name: 'Uttarakhand' },
  { code: 6, name: 'Haryana' },
  { code: 7, name: 'Delhi' },
  { code: 8, name: 'Rajasthan' },
  { code: 9, name: 'Uttar Pradesh' },
  { code: 10, name: 'Bihar' },
  { code: 11, name: 'Sikkim' },
  { code: 12, name: 'Arunachal Pradesh' },
  { code: 13, name: 'Nagaland' },
  { code: 14, name: 'Manipur' },
  { code: 15, name: 'Mizoram' },
  { code: 16, name: 'Tripura' },
  { code: 17, name: 'Meghalaya' },
  { code: 18, name: 'Assam' },
  { code: 19, name: 'West Bengal' },
  { code: 20, name: 'Jharkhand' },
  { code: 21, name: 'Odisha' },
  { code: 22, name: 'Chhattisgarh' },
  { code: 23, name: 'Madhya Pradesh' },
  { code: 24, name: 'Gujarat' },
  { code: 25, name: 'Daman & Diu' },
  { code: 26, name: 'Dadra & Nagar Haveli' },
  { code: 27, name: 'Maharashtra' },
  { code: 28, name: 'Andhra Pradesh (Old)' },
  { code: 29, name: 'Karnataka' },
  { code: 30, name: 'Goa' },
  { code: 31, name: 'Lakshadweep' },
  { code: 32, name: 'Kerala' },
  { code: 33, name: 'Tamil Nadu' },
  { code: 34, name: 'Puducherry' },
  { code: 35, name: 'Andaman & Nicobar' },
  { code: 36, name: 'Telangana' },
  { code: 37, name: 'Andhra Pradesh' },
  { code: 38, name: 'Ladakh' },
];

export const getStateCode = (stateName) => {
  const state = INDIAN_STATES.find(s => s.name === stateName);
  return state ? state.code : 0;
};

export const UNITS = ['Nos', 'Kgs', 'Ltrs', 'Pcs', 'Box', 'Meter', 'Sqft', 'Dozen', 'Pack', 'Set'];
export const TAX_RATES = [0, 3, 5, 12, 18, 28];
export const INVOICE_TYPES = ['Tax Invoice', 'Bill of Supply', 'Credit Note', 'Debit Note', 'Proforma Invoice', 'Quotation', 'Delivery Challan', 'Purchase Order'];
export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card', 'Others'];
export const PAYMENT_STATUS = ['Paid', 'Unpaid', 'Partial'];
