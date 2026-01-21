import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[#FF006E] hover:bg-[#CC0058] text-white shadow-[0_0_10px_rgba(255,0,110,0.5)] hover:shadow-[0_0_20px_rgba(255,0,110,0.8)]',
    secondary: 'bg-transparent border-2 border-[#FF006E] text-[#FF006E] hover:bg-[#FF006E] hover:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
