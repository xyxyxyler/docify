# Docify

A modern SaaS application for creating personalized documents and emails through mail merge.

## Overview

Docify allows users to:
- Upload data from Excel/CSV files
- Design document templates with a WYSIWYG editor
- Generate personalized PDFs for each record
- Send bulk emails with personalized PDF attachments

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Supabase (Auth & PostgreSQL)
- **Email**: Resend API
- **PDF Generation**: jsPDF, html2canvas
- **Data Processing**: SheetJS (xlsx)
- **Rich Text Editor**: TipTap

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Supabase account
- Resend account (for email functionality)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DocGEn
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `RESEND_API_KEY`: Your Resend API key

4. Set up Supabase database:
- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Run the SQL script from `supabase/schema.sql`

5. Run the development server:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
DocGEn/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   └── workspace/         # Workspace editor
├── components/            # React components
│   ├── ActionBar.tsx
│   ├── DataGridView.tsx
│   ├── FileUploader.tsx
│   └── RichTextEditor.tsx
├── hooks/                 # Custom React hooks
│   ├── useDataGrid.ts
│   ├── useEmailDispatch.ts
│   └── usePDFGenerator.ts
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client config
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
├── supabase/             # Database schema
└── public/               # Static assets
```

## Features

### Phase 1: Authentication ✅
- Email/password authentication
- Google OAuth
- Protected routes

### Phase 2: Data Grid 🚧
- Excel/CSV file upload
- Editable data grid
- Column management
- Email column selection

### Phase 3: Document Editor 🚧
- WYSIWYG rich text editor
- Variable insertion
- A4 page preview
- Template management

### Phase 4: PDF Generation 🚧
- Client-side PDF generation
- Bulk PDF download (zipped)
- Variable replacement

### Phase 5: Email Integration 🚧
- Bulk email dispatch
- PDF attachments
- Throttled sending
- Status tracking

### Phase 6: Polish & Persistence 🚧
- Project saving/loading
- Error handling
- UI improvements

## Development Plan

See [plan.md](plan.md) for the detailed development roadmap.

## Contributing

This is a learning project. Feel free to fork and experiment!

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.
