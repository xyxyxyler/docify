'use client';

import { useCallback } from 'react';
import type { RowData } from '@/types';
import { replaceVariables } from '@/lib/utils';

export function useWordGenerator() {
    const generateWord = useCallback(async (
        row: RowData,
        templateHtml: string,
        filename: string = 'document.docx'
    ): Promise<void> => {
        // Replace variables in template
        const filledHtml = replaceVariables(templateHtml, row);

        try {
            const response = await fetch('/api/generate-word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    html: filledHtml,
                    filename,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate Word document');
            }

            // Convert body to blob and trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error in useWordGenerator:', error);
            alert('Failed to generate Word document. Please try again.');
        }
    }, []);

    return { generateWord };
}
