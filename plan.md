# Development Plan: Docify

## Phase 1: Foundation & Authentication
* [ ] Initialize Next.js 14 project with Tailwind CSS.
* [ ] Set up Supabase project (Database + Auth).
* [ ] Implement Login/Signup page using Supabase Auth UI.
* [ ] Create a protected `Dashboard` route that redirects unauthenticated users.

## Phase 2: The Data Grid (The "Excel" View)
* [ ] Install `sheetjs` (xlsx) and a data grid component (e.g., `react-data-grid`).
* [ ] Build the file uploader component (Drag & Drop).
* [ ] Implement logic to parse uploaded Excel files into JSON state.
* [ ] Create the Editable Grid interface where users can view/modify the parsed data.
* [ ] Add "Right-Click Context Menu" to set a column as "Recipient Email."

## Phase 3: The Document Editor (The "Word" View)
* [ ] Install Rich Text Editor (TipTap or React-Quill).
* [ ] CSS Styling: Create the "A4 Page" container (White box, shadow, correct aspect ratio).
* [ ] **State Sync:** Build the logic that reads the Grid Headers and generates the "Variable Sidebar" buttons.
* [ ] Implement the "Insert Variable" function (clicking a button adds `{{Header}}` to text).

## Phase 4: PDF Generation Engine
* [ ] Install `jspdf` and `html2canvas`.
* [ ] Build the `generatePDF(row, template)` function.
* [ ] Implement the "Download All" loop:
    * Iterate through data rows.
    * Swap variables.
    * Generate PDF blobs.
    * Zip blobs using `jszip`.
    * Trigger download.

## Phase 5: Email Integration (The "Postman")
* [ ] Set up Resend account and API keys.
* [ ] Create Next.js API Route: `/api/email/send`.
* [ ] Implement the Client-Side Dispatch Loop:
    * Check for "Email Column".
    * Loop through rows with a 500ms delay (Throttling).
    * Send PDF Blob + Recipient Email to the API route.
    * Update UI with "Sent ✅" status.

## Phase 6: Polish & Persistence
* [ ] Save Project State: Connect the "Save" button to Supabase (store JSON of grid data and HTML of template).
* [ ] Error Handling: Add alerts for missing variables or empty email fields.