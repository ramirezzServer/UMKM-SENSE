import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-warm-700">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          {...props}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={
            'w-full rounded-lg border px-3.5 py-2.5 text-sm text-warm-900 shadow-sm ' +
            'placeholder:text-warm-400 transition-colors ' +
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ' +
            (error ? 'border-red-400 bg-red-50 ' : 'border-warm-300 bg-white ') +
            className
          }
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
