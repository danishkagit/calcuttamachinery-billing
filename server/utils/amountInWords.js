function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convertLessThanThousand(n) {
    if (n === 0) return '';
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n = n % 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n = n % 10;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  }

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = num % 100;

  let words = '';

  if (crore > 0) {
    words += convertLessThanThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += ones[hundred] + ' Hundred ';
  }
  if (remainder > 0) {
    if (hundred > 0 || thousand > 0 || lakh > 0 || crore > 0) {
      words += 'and ';
    }
    words += convertLessThanThousand(remainder);
  }

  return words.trim();
}

function amountInWords(amount) {
  if (isNaN(amount) || amount < 0) return 'Zero Rupees Only';

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = '';

  if (rupees > 0) {
    result = numberToWords(rupees) + ' Rupees';
  } else {
    result = 'Zero Rupees';
  }

  if (paise > 0) {
    result += ' and ' + numberToWords(paise) + ' Paise';
  }

  result += ' Only';

  if (rupees === 0 && paise === 0) {
    return 'Zero Rupees Only';
  }

  return result;
}

module.exports = amountInWords;
