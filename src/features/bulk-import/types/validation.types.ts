export type ValidationRule = {
  field: string;
  message: string;
  validate: (value: unknown) => boolean;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export type DuplicateInfo = {
  field: string;
  value: string;
  indices: number[];
};
