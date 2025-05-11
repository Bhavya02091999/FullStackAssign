
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single student
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new student
router.post('/', async (req, res) => {
  const student = new Student({
    name: req.body.name,
    class: req.body.class,
    section: req.body.section,
    rollNumber: req.body.rollNumber,
    age: req.body.age,
    gender: req.body.gender,
    vaccinations: [] 
  });

  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Import multiple students
router.post('/import', async (req, res) => {
  try {
    const studentsData = req.body;
    const insertedStudents = await Student.insertMany(
      studentsData.map(student => ({
        ...student,
        vaccinations: []
      }))
    );
    res.status(201).json(insertedStudents);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a student
router.put('/:id', async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark student as vaccinated
router.post('/:studentId/vaccinate/:driveId', async (req, res) => {
  try {
    const { studentId, driveId } = req.params;
    const { vaccineName, date } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if student is already vaccinated in this drive
    if (student.vaccinations.some(v => v.driveId === driveId)) {
      return res.status(400).json({ message: 'Student already vaccinated in this drive' });
    }
    
    student.vaccinations.push({
      driveId,
      vaccineName,
      date,
      status: 'completed'
    });
    
    const updatedStudent = await student.save();
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
