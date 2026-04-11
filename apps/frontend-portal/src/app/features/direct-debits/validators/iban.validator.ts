import { AbstractControl, ValidationErrors } from '@angular/forms';

/** ISO 13616 mod-97 IBAN validator for Angular forms. FEAT-017 Sprint 19 */
const SEPA_COUNTRIES = new Set([
  'AD','AT','BE','BG','CH','CY','CZ','DE','DK','EE',
  'ES','FI','FR','GB','GI','GR','HR','HU','IE','IS',
  'IT','LI','LT','LU','LV','MC','MT','NL','NO','PL',
  'PT','RO','SE','SI','SK','SM','VA'
]);

export function ibanValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value ?? '').replace(/\s/g, '').toUpperCase();
  if (!raw) return null;
  if (raw.length < 5 || raw.length > 34) return { invalidIban: 'Length invalid' };
  if (!SEPA_COUNTRIES.has(raw.substring(0, 2))) return { notSepaCountry: true };
  const rearranged = raw.substring(4) + raw.substring(0, 4);
  const numeric = rearranged.split('').map((c: string) =>
    /[A-Z]/.test(c) ? (c.charCodeAt(0) - 55).toString() : c
  ).join('');
  return mod97(numeric) === 1 ? null : { invalidIban: 'Checksum failed' };
}

function mod97(numStr: string): number {
  let remainder = 0;
  for (const ch of numStr) remainder = (remainder * 10 + parseInt(ch)) % 97;
  return remainder;
}
