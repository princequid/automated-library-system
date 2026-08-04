// src/admin-portal/components/common/FormField.jsx
import { useId } from 'react';
import { ErrorIcon } from './Icons';

/**
 * Validation contract: `error` is only ever surfaced once `touched` is true
 * (blur-then-live) - callers set `touched` on blur, then keep validating on
 * every change so the error clears the moment it's fixed. This component
 * only renders what it's given; it owns none of the validation logic.
 */
export function FormField({
  label,
  error,
  touched = false,
  hint,
  required = false,
  children,
  className = '',
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const showError = touched && !!error;

  const child = children({
    id,
    'aria-invalid': showError || undefined,
    'aria-describedby': showError ? errorId : hint ? hintId : undefined,
  });

  return (
    <div className={`form-field ${showError ? 'form-field-invalid' : ''} ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="form-field-label">
          {label}
          {required && (
            <span className="form-field-required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {child}
      {hint && !showError && (
        <p id={hintId} className="form-field-hint">
          {hint}
        </p>
      )}
      {showError && (
        <p id={errorId} className="form-field-error" role="alert">
          <ErrorIcon size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
