import { FormControl } from '@angular/forms';
import { ibanValidator } from './iban.validator';

/**
 * Unit tests for ibanValidator — ISO 13616 mod-97
 * FEAT-017 Sprint 19
 */
describe('ibanValidator', () => {
  const ctrl = (val: string) => new FormControl(val);

  it('valid Spanish IBAN returns null', () => {
    expect(ibanValidator(ctrl('ES9121000418450200051332'))).toBeNull();
  });

  it('valid German IBAN returns null', () => {
    expect(ibanValidator(ctrl('DE89370400440532013000'))).toBeNull();
  });

  it('IBAN with spaces is normalised and valid', () => {
    expect(ibanValidator(ctrl('ES91 2100 0418 4502 0005 1332'))).toBeNull();
  });

  it('empty value returns null (not required)', () => {
    expect(ibanValidator(ctrl(''))).toBeNull();
  });

  it('wrong checksum returns { invalidIban }', () => {
    expect(ibanValidator(ctrl('ES00000000000000000001'))).toEqual(
      jasmine.objectContaining({ invalidIban: jasmine.anything() })
    );
  });

  it('non-SEPA country returns { notSepaCountry }', () => {
    expect(ibanValidator(ctrl('US00000000000000000001'))).toEqual(
      jasmine.objectContaining({ notSepaCountry: true })
    );
  });
});
