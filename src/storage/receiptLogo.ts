const RECEIPT_LOGO_KEY = 'noxtiz-pos-receipt-logo';

export function getLocalReceiptLogo(): string {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return '';
  }
  try {
    return window.localStorage.getItem(RECEIPT_LOGO_KEY) || '';
  } catch (error) {
    console.warn('Gagal baca receipt logo lokal:', error);
    return '';
  }
}

export function setLocalReceiptLogo(value?: string | null): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    if (value) {
      window.localStorage.setItem(RECEIPT_LOGO_KEY, value);
    } else {
      window.localStorage.removeItem(RECEIPT_LOGO_KEY);
    }
  } catch (error) {
    console.warn('Gagal simpan receipt logo lokal:', error);
  }
}

