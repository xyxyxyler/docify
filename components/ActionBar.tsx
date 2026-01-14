'use client';

import { useState } from 'react';
import { Download, Mail, Loader2 } from 'lucide-react';

interface ActionBarProps {
  onDownloadAll: () => Promise<void>;
  onSendEmails: () => Promise<void>;
  hasEmailColumn: boolean;
  dataCount: number;
}

export default function ActionBar({ 
  onDownloadAll, 
  onSendEmails, 
  hasEmailColumn,
  dataCount 
}: ActionBarProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadAll();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmails = async () => {
    if (!hasEmailColumn) {
      alert('Please set an email column first by right-clicking on a column header in the data grid.');
      return;
    }
    
    const confirmed = window.confirm(
      `This will send ${dataCount} emails. Are you sure you want to continue?`
    );
    
    if (confirmed) {
      setIsSending(true);
      try {
        await onSendEmails();
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white border-t">
      <button
        onClick={handleDownload}
        disabled={isDownloading || dataCount === 0}
        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        Download All PDFs
      </button>

      <button
        onClick={handleSendEmails}
        disabled={isSending || dataCount === 0 || !hasEmailColumn}
        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Mail className="w-5 h-5" />
        )}
        Send Emails
      </button>

      {!hasEmailColumn && dataCount > 0 && (
        <span className="text-sm text-amber-600">
          ⚠️ Set an email column to enable email sending
        </span>
      )}
    </div>
  );
}
