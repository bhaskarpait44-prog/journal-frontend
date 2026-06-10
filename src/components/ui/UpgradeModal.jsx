import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export default function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      setMessage(e.detail.message || 'Upgrade your plan to access this feature.');
      setOpen(true);
    };
    window.addEventListener('show-upgrade-modal', handler);
    return () => window.removeEventListener('show-upgrade-modal', handler);
  }, []);

  const handleUpgrade = () => {
    setOpen(false);
    navigate('/pricing');
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="✨ Pro Feature">
      <div className="space-y-6 py-2 text-center">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"/>
          </svg>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-text-primary font-heading">Unlock with Pro Plan</h3>
          <p className="text-text-faint text-sm leading-relaxed max-w-xs mx-auto">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleUpgrade} className="bg-amber-600 hover:bg-amber-700 shadow-glow-amber h-11">
            View Pro Pricing
          </Button>
          <button onClick={() => setOpen(false)} className="text-xs font-bold text-text-muted uppercase tracking-widest hover:text-text-secondary transition-colors py-2">
            Maybe Later
          </button>
        </div>
      </div>
    </Modal>
  );
}
