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
      <div className="relative bg-black/90 border border-neon-blue/50 rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.2)] max-w-xs w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        {title && (
          <div className="border-b border-neon-blue/30 px-3 py-2">
            <h2 className="text-sm font-bold text-neon-blue font-mono uppercase tracking-wider">{title}</h2>
          </div>
        )}
        
        {/* Body */}
        <div className="px-3 py-2.5">
          {children}
        </div>
        
        {/* Close Button */}
        {showCloseButton && (
          <div className="border-t border-neon-blue/30 px-3 py-2 flex justify-end">
            <Button onClick={onClose} variant="secondary" size="sm" className="!px-3 !py-1 !text-xs">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
