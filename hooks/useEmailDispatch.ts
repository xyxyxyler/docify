'use client';

import { useState, useCallback } from 'react';
import type { RowData, EmailDispatchStatus } from '@/types';
import { sleep } from '@/lib/utils';

export function useEmailDispatch() {
  const [dispatchStatus, setDispatchStatus] = useState<EmailDispatchStatus[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);

  const sendEmails = useCallback(async (
    rows: RowData[],
    templateHtml: string,
    emailColumn: string,
    pdfBlobs: Blob[]
  ) => {
    setIsDispatching(true);
    
    // Initialize status for all rows
    const initialStatus: EmailDispatchStatus[] = rows.map((row, index) => ({
      rowIndex: index,
      email: String(row[emailColumn] || ''),
      status: 'pending',
    }));
    setDispatchStatus(initialStatus);

    for (let i = 0; i < rows.length; i++) {
      const email = String(rows[i][emailColumn] || '');
      
      if (!email) {
        setDispatchStatus(prev => prev.map((status, idx) =>
          idx === i ? { ...status, status: 'error', error: 'No email address' } : status
        ));
        continue;
      }

      try {
        // Update status to sending
        setDispatchStatus(prev => prev.map((status, idx) =>
          idx === i ? { ...status, status: 'sending' } : status
        ));

        // Create FormData with PDF
        const formData = new FormData();
        formData.append('email', email);
        formData.append('pdf', pdfBlobs[i], `document-${i + 1}.pdf`);
        formData.append('subject', 'Your Personalized Document');

        // Send email
        const response = await fetch('/api/email/send', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to send email: ${response.statusText}`);
        }

        // Update status to sent
        setDispatchStatus(prev => prev.map((status, idx) =>
          idx === i ? { ...status, status: 'sent' } : status
        ));

        // Throttle to avoid rate limiting (500ms delay)
        if (i < rows.length - 1) {
          await sleep(500);
        }
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
        setDispatchStatus(prev => prev.map((status, idx) =>
          idx === i ? { 
            ...status, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } : status
        ));
      }
    }

    setIsDispatching(false);
  }, []);

  const resetStatus = useCallback(() => {
    setDispatchStatus([]);
  }, []);

  return {
    sendEmails,
    dispatchStatus,
    isDispatching,
    resetStatus,
  };
}
