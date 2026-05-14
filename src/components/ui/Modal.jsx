import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './Icons';

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full md:w-[90vw] md:max-w-[480px] bg-card md:rounded-3xl rounded-t-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] animate-slide-up md:animate-scale-in overflow-hidden">
        {/* Handle for mobile */}
        <div className="md:hidden flex justify-center py-3">
          <div className="w-10 h-1 bg-border-strong rounded-full cursor-grab active:cursor-grabbing" />
        </div>

        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border">
          <h3 className="text-xl font-bold font-heading text-text-primary">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-card-alt text-text-muted transition-colors tap-none"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto no-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-5 border-t border-border bg-card-alt/50 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
