/**
 * Converts a number to words in Nigerian English format
 * Example: 2430000 -> "Two Million, Four Hundred and Thirty Thousand Naira"
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero Naira';
  if (num < 0) return 'Negative ' + numberToWords(-num);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const scales = [
    '', 'Thousand', 'Million', 'Billion', 'Trillion'
  ];

  function convertHundreds(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one > 0 ? '-' + ones[one] : '');
    }
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return ones[hundred] + ' Hundred' + (remainder > 0 ? ' and ' + convertHundreds(remainder) : '');
  }

  function convertGroup(n: number, scaleIndex: number): string {
    if (n === 0) return '';
    const group = convertHundreds(n);
    return group + (scaleIndex > 0 ? ' ' + scales[scaleIndex] : '');
  }

  // Split number into groups of 3 digits
  const groups: number[] = [];
  let remaining = Math.floor(num);
  
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  if (groups.length === 0) return 'Zero Naira';

  // Convert each group
  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0) {
      words.push(convertGroup(groups[i], i));
    }
  }

  // Join with commas, but use 'and' before the last group if it's less than 100
  let result = words.join(', ');
  
  // Add 'and' before the last group if needed (Nigerian English style)
  const lastGroup = groups[0];
  if (lastGroup > 0 && lastGroup < 100 && groups.length > 1) {
    const lastCommaIndex = result.lastIndexOf(',');
    if (lastCommaIndex !== -1) {
      result = result.substring(0, lastCommaIndex) + ' and' + result.substring(lastCommaIndex + 1);
    }
  }

  return result + ' Naira';
}

