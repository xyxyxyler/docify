import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    // Check if email functionality is configured
    if (!resend) {
      return NextResponse.json(
        { error: 'Email functionality is not configured. Please set RESEND_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const email = formData.get('email') as string;
    const pdf = formData.get('pdf') as Blob;
    const subject = formData.get('subject') as string || 'Your Personalized Document';
    const message = formData.get('message') as string || 'Please find your personalized document attached.';

    if (!email || !pdf) {
      return NextResponse.json(
        { error: 'Email and PDF are required' },
        { status: 400 }
      );
    }

    // Convert blob to buffer
    const arrayBuffer = await pdf.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: 'Docify <onboarding@resend.dev>', // Replace with your verified domain
      to: [email],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Your Personalized Document</h2>
          <p>${message}</p>
          <p>Please find your personalized document attached to this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent by Docify
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'document.pdf',
          content: buffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
