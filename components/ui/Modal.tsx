import React, { useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#0a0a0a] border-2 border-[#FF006E] rounded-lg shadow-[0_0_30px_rgba(255,0,110,0.5)] max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        {title && (
          <div className="border-b border-gray-800 px-6 py-4">
            <h2 className="text-xl font-bold text-[#FF006E]">{title}</h2>
          </div>
        )}
        
        {/* Body */}
        <div className="px-6 py-4">
          {children}
        </div>
        
        {/* Close Button */}
        {showCloseButton && (
          <div className="border-t border-gray-800 px-6 py-4 flex justify-end">
            <Button onClick={onClose} variant="secondary" size="sm">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
