// src/admin-portal/components/common/Select.jsx
import { forwardRef } from 'react';
import { ChevronDownIcon } from './Icons';

// Native <select> deliberately - full keyboard/screen-reader support for
// free, no listbox to reimplement. Options: [{ value, label }].
export const Select = forwardRef(function Select({ options, placeholder, className = '', ...props }, ref) {
  return (
    <div className={`select-wrapper ${className}`.trim()}>
      <select ref={ref} className="select" {...props}>
        {placeholder && (
          <option value="" disabled={props.required}>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={16} className="select-chevron" aria-hidden="true" />
    </div>
  );
});
