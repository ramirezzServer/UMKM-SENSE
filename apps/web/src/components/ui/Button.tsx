import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'ghost';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ loading = false, variant = 'primary', disabled, children, className = '', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ' +
      'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ' +
      'focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
      ghost: 'text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100',
    };

    return (
      <button
        ref={ref}
        {...props}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${className}`}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
