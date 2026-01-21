import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  glowEffect = false 
}) => {
  const baseStyles = 'bg-[#0a0a0a] border border-gray-800 rounded-lg p-6';
  const glowStyles = glowEffect 
    ? 'shadow-[0_0_15px_rgba(255,0,110,0.3)] border-[#FF006E]' 
    : '';
  
  return (
    <div className={`${baseStyles} ${glowStyles} ${className}`}>
      {children}
    </div>
  );
};
