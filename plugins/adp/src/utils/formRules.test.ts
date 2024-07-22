import { emailRegex, formRules } from './formRules';

describe('formRules', () => {
  describe('required', () => {
    it('Should be always required', () => {
      expect(formRules.required.required).toBe('This field is required');
    });
  });

  describe('maxLength', () => {
    it('Should return the correct max length configuration', () => {
      expect(formRules.maxLength(123)).toMatchObject({
        maxLength: {
          value: 123,
          message: 'Maximum length is 123 characters',
        },
      });
    });
  });

  describe('pattern', () => {
    it('Should return the correct pattern configuration', () => {
      expect(formRules.pattern(/abc/, 'Test')).toMatchObject({
        pattern: {
          value: /abc/,
          message: 'Test',
        },
      });
    });
  });
});

describe('emailRegex', () => {
  it.each([
    { input: 'test@email.com', expected: true },
    { input: 'not an email', expected: false },
  ])('Should match $input -> $expected', ({ input, expected }) => {
    expect(emailRegex.test(input)).toBe(expected);
  });
});
