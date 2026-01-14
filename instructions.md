# AI Developer Instructions

**Role:** You are a Senior Full Stack Developer building "Docify."
**Reference:** Please read `product-paper.md` for context and follow the roadmap in `plan.md`.

## Tech Stack (Strict Adherence)
* **Frontend:** Next.js 14 (App Router), Tailwind CSS, Lucide React.
* **Backend/DB:** Supabase (Auth & Postgres).
* **Email:** Resend SDK.
* **Key Libraries:**
    * `xlsx` (SheetJS) for parsing uploads.
    * `react-data-grid` (or similar lightweight grid) for the spreadsheet view.
    * `@tiptap/react` or `react-quill` for the WYSIWYG editor.
    * `jspdf` & `html2canvas` for PDF generation.
    * `jszip` for zipping downloads.

## Coding Standards
1.  **Component Modularity:** specific logic (like the Uploader or the PDF Generator) should be extracted into custom hooks (e.g., `usePDFGenerator`).
2.  **Type Safety:** Use TypeScript interfaces for the `RowData` and `Template` objects.
3.  **Client-Side Heavy:** Keep the heavy lifting (parsing, generating) in the browser to minimize server load. Only use Server Actions/API routes for database saves and email sending.

## Specific Implementation Details to Watch For:
* **The "A4" Look:** The editor component must have `min-height: 297mm` and `width: 210mm` to accurately simulate a real page.
* **Variable Tokenization:** When a user inserts a variable, wrap it visually so they know it's dynamic (e.g., `<span class="bg-blue-100">{{Name}}</span>`).
* **Image Optimization:** If the user pastes an image into the editor, resize it immediately to prevent the final PDF generation from crashing due to memory limits.
* **Email Throttling:** Do NOT loop through `await fetch()` calls instantly. Implement a `sleep(500)` utility function in the email dispatch loop.

## Immediate Task
Start by setting up the **Next.js project structure** and the **Supabase Client**. Create the `Dashboard` and basic `Workspace` layout (Split View toggle).