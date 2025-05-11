
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Calendar, 
  Check, 
  Edit,
  User,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStudentById, updateStudent, vaccinationDrives, markStudentVaccinated } = useData();
  
  const [student, setStudent] = useState(getStudentById(id || ''));
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [markVaccinatedDialogOpen, setMarkVaccinatedDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    class: '',
    section: '',
    rollNumber: '',
    age: 0,
    gender: 'Male' as 'Male' | 'Female' | 'Other',
  });
  const [selectedDriveId, setSelectedDriveId] = useState('');
  
  // Eligible drives (drives that student hasn't been vaccinated in yet)
  const eligibleDrives = vaccinationDrives.filter(drive => {
    // Only include drives where:
    // 1. Student's class is in target classes
    // 2. Student hasn't been vaccinated in this drive yet
    // 3. Drive has available doses
    // 4. Drive is not completed or cancelled
    return (
      drive.targetClasses.includes(student?.class || '') &&
      !student?.vaccinations.some(v => v.driveId === drive.id && v.status === 'completed') &&
      drive.usedDoses < drive.totalDoses &&
      drive.status === 'scheduled'
    );
  });

  useEffect(() => {
    const fetchedStudent = getStudentById(id || '');
    
    if (!fetchedStudent) {
      toast.error('Student not found');
      navigate('/students');
      return;
    }
    
    setStudent(fetchedStudent);
    
    // Initialize edit form with student data
    setEditFormData({
      name: fetchedStudent.name,
      class: fetchedStudent.class,
      section: fetchedStudent.section,
      rollNumber: fetchedStudent.rollNumber,
      age: fetchedStudent.age,
      gender: fetchedStudent.gender,
    });
  }, [id, getStudentById, navigate]);

  if (!student) {
    return null; // Already handling navigation in useEffect
  }

  const handleEditStudent = () => {
    if (!student) return;
    
    const updatedStudent = {
      ...student,
      ...editFormData,
    };
    
    updateStudent(updatedStudent);
    setStudent(updatedStudent);
    setEditDialogOpen(false);
  };
  
  const handleMarkVaccinated = () => {
    if (!student || !selectedDriveId) return;
    
    const success = markStudentVaccinated(student.id, selectedDriveId);
    
    if (success) {
      // Refresh student data
      setStudent(getStudentById(student.id));
      setMarkVaccinatedDialogOpen(false);
      setSelectedDriveId('');
    }
  };

  // Get a list of completed vaccinations
  const completedVaccinations = student.vaccinations.filter(v => v.status === 'completed');
  // Get a list of upcoming vaccinations
  const upcomingVaccinations = student.vaccinations.filter(v => v.status === 'scheduled');

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4 p-0 hover:bg-transparent"
          onClick={() => navigate('/students')}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-gray-600 mt-1">
            Class {student.class}-{student.section} • Roll Number: {student.rollNumber}
          </p>
        </div>
        <Button 
          variant="outline" 
          className="ml-auto flex items-center gap-2"
          onClick={() => setEditDialogOpen(true)}
        >
          <Edit size={16} />
          <span>Edit</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <User size={36} className="text-gray-400" />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1">{student.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Class</h3>
                  <p className="mt-1">{student.class}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Section</h3>
                  <p className="mt-1">{student.section}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Roll Number</h3>
                <p className="mt-1">{student.rollNumber}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Age</h3>
                  <p className="mt-1">{student.age}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                  <p className="mt-1">{student.gender}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vaccination Status</h3>
                <div className="mt-1">
                  <span 
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      completedVaccinations.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {completedVaccinations.length > 0 ? (
                      <>
                        <Check size={12} className="mr-1" />
                        Vaccinated
                      </>
                    ) : (
                      'Not Vaccinated'
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {eligibleDrives.length > 0 && (
            <div className="mt-6">
              <Button 
                className="w-full bg-medical-600 hover:bg-medical-700"
                onClick={() => setMarkVaccinatedDialogOpen(true)}
              >
                Mark as Vaccinated
              </Button>
            </div>
          )}
        </div>
        
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Vaccination History</CardTitle>
              <CardDescription>Record of all vaccinations received by this student</CardDescription>
            </CardHeader>
            <CardContent>
              {completedVaccinations.length > 0 ? (
                <div className="space-y-4">
                  {completedVaccinations.map((vaccination, index) => {
                    const drive = vaccinationDrives.find(d => d.id === vaccination.driveId);
                    if (!drive) return null;
                    
                    return (
                      <div key={`${vaccination.driveId}-${index}`} className="flex items-start border-b pb-4 last:border-0 last:pb-0">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">{vaccination.vaccineName}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-0.5 gap-3">
                            <span className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              {format(parseISO(vaccination.date), 'PPP')}
                            </span>
                            <span>•</span>
                            <span>{drive.name}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-2 text-gray-900 font-medium">No vaccination history</h3>
                  <p className="text-gray-500 mt-1">
                    This student hasn't received any vaccinations yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Vaccinations</CardTitle>
              <CardDescription>Scheduled vaccinations for this student</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingVaccinations.length > 0 ? (
                <div className="space-y-4">
                  {upcomingVaccinations.map((vaccination, index) => {
                    const drive = vaccinationDrives.find(d => d.id === vaccination.driveId);
                    if (!drive) return null;
                    
                    return (
                      <div key={`${vaccination.driveId}-${index}`} className="flex items-start border-b pb-4 last:border-0 last:pb-0">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">{vaccination.vaccineName}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-0.5 gap-3">
                            <span className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              {format(parseISO(vaccination.date), 'PPP')}
                            </span>
                            <span>•</span>
                            <span>{drive.name}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-2 text-gray-900 font-medium">No upcoming vaccinations</h3>
                  <p className="text-gray-500 mt-1">
                    This student doesn't have any scheduled vaccinations.
                  </p>
                  {eligibleDrives.length > 0 && (
                    <Button 
                      className="mt-4 bg-medical-600 hover:bg-medical-700"
                      onClick={() => setMarkVaccinatedDialogOpen(true)}
                    >
                      Schedule Vaccination
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update the student's information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={editFormData.name} 
                onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="class">Class</Label>
                <Input 
                  id="class" 
                  value={editFormData.class} 
                  onChange={e => setEditFormData({...editFormData, class: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="section">Section</Label>
                <Input 
                  id="section" 
                  value={editFormData.section} 
                  onChange={e => setEditFormData({...editFormData, section: e.target.value})} 
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input 
                id="rollNumber" 
                value={editFormData.rollNumber} 
                onChange={e => setEditFormData({...editFormData, rollNumber: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input 
                  id="age" 
                  type="number" 
                  min="0" 
                  value={editFormData.age || ''} 
                  onChange={e => setEditFormData({...editFormData, age: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={editFormData.gender} 
                  onValueChange={(value) => setEditFormData({
                    ...editFormData, 
                    gender: value as 'Male' | 'Female' | 'Other'
                  })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-medical-600 hover:bg-medical-700" onClick={handleEditStudent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Vaccinated Dialog */}
      <Dialog open={markVaccinatedDialogOpen} onOpenChange={setMarkVaccinatedDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mark Student as Vaccinated</DialogTitle>
            <DialogDescription>
              Select a vaccination drive to mark this student as vaccinated.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="drive">Vaccination Drive</Label>
              <Select value={selectedDriveId} onValueChange={setSelectedDriveId}>
                <SelectTrigger id="drive">
                  <SelectValue placeholder="Select a vaccination drive" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleDrives.map(drive => (
                    <SelectItem key={drive.id} value={drive.id}>
                      {drive.name} - {format(parseISO(drive.date), 'PP')} - {drive.vaccineName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setMarkVaccinatedDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-medical-600 hover:bg-medical-700" 
              onClick={handleMarkVaccinated}
              disabled={!selectedDriveId}
            >
              Mark as Vaccinated
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDetails;
