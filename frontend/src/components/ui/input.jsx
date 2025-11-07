import * as React from 'react';

export const Input = React.forwardRef(function Input(
  { className = '', type = 'text', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={[
        'flex h-10 w-full rounded-md border border-input bg-background',
        'px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-input dark:bg-background dark:text-foreground dark:placeholder:text-muted-foreground',
        className,
      ].join(' ')}
      {...props}
    />
  );
});

export default Input;
