import { ZodError } from 'zod';

export interface FormError {
  field: string;
  message: string;
  id: string;
}

export interface FormErrors {
  summary: FormError[];
  byField: Record<string, FormError>;
}

export function formatZodErrors(error: ZodError): FormErrors {
  const summary: FormError[] = [];
  const byField: Record<string, FormError> = {};

  for (const issue of error.issues) {
    const field = issue.path[0]?.toString() || 'form';
    const formError: FormError = {
      field,
      message: issue.message,
      id: `${field}-error`,
    };
    summary.push(formError);
    if (!byField[field]) {
      byField[field] = formError;
    }
  }

  return { summary, byField };
}
