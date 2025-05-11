
const express = require('express');
const router = express.Router();
const VaccinationDrive = require('../models/VaccinationDrive');
const Student = require('../models/Student');

// Get all vaccination drives
router.get('/', async (req, res) => {
  try {
    const drives = await VaccinationDrive.find();
    res.status(200).json(drives);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single vaccination drive
router.get('/:id', async (req, res) => {
  try {
    const drive = await VaccinationDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Vaccination drive not found' });
    }
    res.status(200).json(drive);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new vaccination drive
router.post('/', async (req, res) => {
  const drive = new VaccinationDrive({
    name: req.body.name,
    date: req.body.date,
    vaccineName: req.body.vaccineName,
    totalDoses: req.body.totalDoses,
    targetClasses: req.body.targetClasses,
    usedDoses: 0,
    status: 'scheduled'
  });

  try {
    const newDrive = await drive.save();
    res.status(201).json(newDrive);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a vaccination drive
router.put('/:id', async (req, res) => {
  try {
    const updatedDrive = await VaccinationDrive.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDrive) {
      return res.status(404).json({ message: 'Vaccination drive not found' });
    }
    res.status(200).json(updatedDrive);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel a vaccination drive
router.put('/:id/cancel', async (req, res) => {
  try {
    const drive = await VaccinationDrive.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!drive) {
      return res.status(404).json({ message: 'Vaccination drive not found' });
    }
    res.status(200).json(drive);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete a vaccination drive
router.put('/:id/complete', async (req, res) => {
  try {
    const drive = await VaccinationDrive.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    if (!drive) {
      return res.status(404).json({ message: 'Vaccination drive not found' });
    }
    res.status(200).json(drive);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get vaccinated students for a drive
router.get('/:id/students', async (req, res) => {
  try {
    const students = await Student.find({
      'vaccinations.driveId': req.params.id
    });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a vaccinated student to a drive
router.post('/:id/vaccinate', async (req, res) => {
  try {
    const driveId = req.params.id;
    const { studentId } = req.body;
    
    // Get the drive
    const drive = await VaccinationDrive.findById(driveId);
    if (!drive) {
      return res.status(404).json({ message: 'Vaccination drive not found' });
    }
    
    // Check if there are enough doses
    if (drive.usedDoses >= drive.totalDoses) {
      return res.status(400).json({ message: 'No vaccine doses remaining' });
    }
    
    // Get the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if student is already vaccinated in this drive
    if (student.vaccinations.some(v => v.driveId === driveId)) {
      return res.status(400).json({ message: 'Student already vaccinated in this drive' });
    }
    
    // Update the student
    student.vaccinations.push({
      driveId,
      vaccineName: drive.vaccineName,
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    });
    await student.save();
    
    // Update the drive
    drive.usedDoses += 1;
    await drive.save();
    
    res.status(200).json({ student, drive });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get upcoming drives (next 30 days)
router.get('/upcoming/list', async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    const drives = await VaccinationDrive.find({
      status: 'scheduled',
      date: {
        $gte: today.toISOString().split('T')[0],
        $lte: thirtyDaysLater.toISOString().split('T')[0]
      }
    }).sort({ date: 1 });
    
    res.status(200).json(drives);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get vaccination statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const vaccinatedStudents = await Student.countDocuments({
      'vaccinations.0': { $exists: true }
    });
    
    const percentage = totalStudents > 0 
      ? Math.round((vaccinatedStudents / totalStudents) * 100) 
      : 0;
    
    res.status(200).json({
      total: totalStudents,
      vaccinated: vaccinatedStudents,
      percentage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
