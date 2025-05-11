
# School Vaccination System Backend

This is the backend API for the School Vaccination Management System. It provides a RESTful API for managing students and vaccination drives.

## Setup

1. Install dependencies:
```
npm install
```

2. Configure environment variables:
Create a `.env` file in the root directory with the following content:
```
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/vaccination_app?retryWrites=true&w=majority
PORT=5000
```

Replace `your_username`, `your_password` and `cluster0.mongodb.net` with your MongoDB Atlas credentials.

3. Run the server:
```
npm run dev
```

## API Endpoints

### Students
- GET `/api/students` - Get all students
- GET `/api/students/:id` - Get a student by ID
- POST `/api/students` - Create a new student
- PUT `/api/students/:id` - Update a student
- DELETE `/api/students/:id` - Delete a student
- POST `/api/students/import` - Import multiple students
- POST `/api/students/:studentId/vaccinate/:driveId` - Mark a student as vaccinated

### Vaccination Drives
- GET `/api/vaccination-drives` - Get all vaccination drives
- GET `/api/vaccination-drives/:id` - Get a vaccination drive by ID
- POST `/api/vaccination-drives` - Create a new vaccination drive
- PUT `/api/vaccination-drives/:id` - Update a vaccination drive
- PUT `/api/vaccination-drives/:id/cancel` - Cancel a vaccination drive
- PUT `/api/vaccination-drives/:id/complete` - Complete a vaccination drive
- GET `/api/vaccination-drives/:id/students` - Get students vaccinated in a drive
- POST `/api/vaccination-drives/:id/vaccinate` - Vaccinate a student in a drive
- GET `/api/vaccination-drives/upcoming/list` - Get upcoming vaccination drives
- GET `/api/vaccination-drives/stats/overview` - Get vaccination statistics
