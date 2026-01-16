import { NextRequest, NextResponse } from 'next/server';
import HTMLtoDOCX from 'html-to-docx';

export async function POST(req: NextRequest) {
  try {
    const { html, filename = 'document.docx' } = await req.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    // Pre-process HTML for better Word compatibility

    // 1. Convert our custom page delimiter to a CSS page break that html-to-docx understands
    // The editor uses <div class="page-break-delimiter"></div>
    // html-to-docx respects 'page-break-after: always' styling
    const cleanHtml = html.replace(
      /<div class="page-break-delimiter"><\/div>/g,
      '<div style="page-break-after: always;"></div>'
    );

    // 2. Wrap content in a standard body if not present (though html-to-docx handles valid HTML fragments well)
    // We add specific styles to ensure visual fidelity matches our "editor" look as much as possible
    const detailedHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: 'Arial', sans-serif; /* Fallback safe font */
              font-size: 12pt;
              line-height: 1.2; 
            }
            p {
              margin-bottom: 8pt; /* Match partial editor spacing */
            }
            /* Add custom font mapping hints if possible, though user needs font installed */
          </style>
        </head>
        <body>
          ${cleanHtml}
        </body>
      </html>
    `;

    const buffer = await HTMLtoDOCX(detailedHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
      margins: {
        top: 1440, // 1440 twips = 1 inch
        right: 1440,
        bottom: 1440,
        left: 1440,
      }
    });

    // Verify buffer exists
    if (!buffer) {
      throw new Error('Buffer generation failed');
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    // Use standard Response which handles Buffers/ArrayBuffers natively in modern Node/Edge runtimes
    return new Response(buffer as any, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Word generation error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
