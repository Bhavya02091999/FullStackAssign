# School Vaccination Portal

The system enables school coordinators to manage student vaccinations through a centralized portal with features such as student record management, vaccination drive scheduling, vaccination status tracking, and report generation.


# Features Implemented (User Stories)

User Story 1.1: Login & Dashboard
- Simulated login system (hardcoded token-based).
- On successful login, coordinator is redirected to a dashboard.
- Dashboard displays:
  - Total number of students
  - Percentage vaccinated
  - Upcoming vaccination drives (within next 30 days)
  - Message like “No upcoming drives” if none are scheduled.

---

User Story 1.2: Add/Manage Student Details
- Navigate to Student Management from the dashboard.
- Features:
  - Form to add students individually.
  - Bulk CSV upload of student data.
  - List, search, and filter students by name, class, ID, or vaccination status.

---

User Story 1.3: Generate Vaccination Reports
- Navigate to Reports from the menu.
- Select filters (vaccine name, date range, status).
- View student details in a paginated table:
  - Name, Class, Vaccine Name, Date, Status.
- Option to export reports as:
  - CSV
  - Excel (XLSX)
  - PDF

---

User Story 1.4: Book a Vaccination Drive
- Navigate to Vaccination Drives and click “Add Drive”.
- Input:
  - Vaccine name
  - Date (must be at least 15 days in the future)
  - Number of available doses
  - Applicable classes (e.g., Grades 5–7)
- Validations:
  - No overlapping drives allowed.

---

User Story 1.5: View & Modify Upcoming Drives
- View all upcoming vaccination drives.
- Drives scheduled in the future can be:
  - Edited (date and number of doses).
- Past drives are shown as read-only (editing disabled).

---

## 🛠️ Tech Stack
- **Frontend**: React, React Router, Axios, TailwindCSS / Bootstrap
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **File Uploads**: Multer, Papaparse
- **Authentication**: Simulated (hardcoded)
- **Exporting**: SheetJS, PDFKit

---

## 🗂️ Folder Structure

