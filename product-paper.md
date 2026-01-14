# Product Requirements Document (PRD): Docify

## 1. Executive Summary
**Docify** is a SaaS web application that democratizes the "Mail Merge" process. It allows users to upload structured data (Excel/CSV), design rich-text document templates in a WYSIWYG editor, and automatically generate personalized PDFs or email communications for each record in the dataset.

## 2. Core Value Proposition
* **Decoupled from Desktop:** No need for Microsoft Word or local software.
* **Visual Logic:** A split-view interface (Data vs. Design) makes the connection between "Variables" and "Content" intuitive.
* **Dual Output:** Users can choose to simply **Download PDFs** (for printing) or **Dispatch Emails** (for digital communication).

## 3. User Flow
1.  **Authentication:** User signs in via Email or Google (Supabase Auth).
2.  **Dashboard:** User lands on a project directory showing saved templates.
3.  **Project Workspace:**
    * **Data Input:** User uploads an `.xlsx` file or pastes data into a web-based spreadsheet (Data Grid).
    * **Templating:** User switches to "Editor Mode" to design the letter on an A4 canvas.
    * **Variable Mapping:** Column headers from the Data Grid become draggable/clickable chips in the Editor.
4.  **Generation & Output:**
    * **Scenario A (Download):** App generates individual PDFs for each row, zips them, and downloads the bundle.
    * **Scenario B (Email):** App iterates through rows, generates the PDF, and emails it to the recipient defined in the "Email" column of the grid.

## 4. Key Features
* **Smart Ingestion:** Uses `SheetJS` to parse Excel files client-side.
* **A4 WYSIWYG Editor:** A rich-text editor (TipTap/Quill) styled to mimic physical paper dimensions (210mm x 297mm).
* **Dynamic Variable Insertion:** Real-time sync between grid headers and editor placeholders (e.g., `{{FirstName}}`).
* **Client-Side PDF Generation:** Uses `jspdf` to generate documents without heavy server costs.
* **Throttled Email Dispatch:** Uses `Resend` API with a client-side loop to prevent rate-limiting when sending bulk emails.

## 5. Technical Constraints
* **Framework:** Next.js 14 (App Router).
* **Database:** Supabase (PostgreSQL).
* **Styling:** Tailwind CSS.
* **Email Infrastructure:** Resend.