'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface PhoneNumberDisplayProps {
  phoneNumber: string | null;
  formattedNumber: string;
  isPending?: boolean;
}

export default function PhoneNumberDisplay({ phoneNumber, formattedNumber, isPending }: PhoneNumberDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!phoneNumber || isPending) return;
    
    try {
      // Use the raw phone number (E.164 format) for copying
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isPending) {
    return (
      <div className="text-2xl font-bold" style={{ color: '#0B1F3B' }}>
        {formattedNumber}
      </div>
    );
  }

  if (!phoneNumber) {
    return (
      <div className="text-2xl font-bold" style={{ color: '#0B1F3B' }}>
        {formattedNumber}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-2xl font-bold" style={{ color: '#0B1F3B' }}>
        {formattedNumber}
      </div>
      <button
        onClick={handleCopy}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        style={{ color: '#4A5D73' }}
        title="Copy phone number"
      >
        {copied ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <Copy className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

