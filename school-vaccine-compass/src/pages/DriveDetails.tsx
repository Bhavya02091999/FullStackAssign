import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from '@/components/ui/card';
import { 
  ArrowLeft, 
  Calendar, 
  Edit, 
  Download,
  X,
  Search,
  Check,
  User,
  Plus,
} from 'lucide-react';
import { format, parseISO, isPast, addDays } from 'date-fns';
import { toast } from 'sonner';
import { VaccinationDrive, Student } from '@/lib/types';

const DriveDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    getDriveById, 
    updateVaccinationDrive,
    getDriveVaccinatedStudents,
    markStudentVaccinated,
    students
  } = useData();
  
  const [drive, setDrive] = useState<VaccinationDrive | undefined>(getDriveById(id || ''));
  const [vaccinated, setVaccinated] = useState<Student[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addStudentsDialogOpen, setAddStudentsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    date: '',
    vaccineName: '',
    totalDoses: 0,
    targetClasses: [] as string[],
  });
  
  // Available classes
  const availableClasses = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  
  // Date validation (at least 15 days from today)
  const minDate = format(addDays(new Date(), 15), 'yyyy-MM-dd');
  
  const eligibleStudents = students.filter(student => {
    // Filter students based on:
    // 1. Their class is in the drive's target classes
    // 2. They haven't been vaccinated in this drive yet
    return (
      drive?.targetClasses.includes(student.class) &&
      !student.vaccinations.some(v => v.driveId === id && v.status === 'completed')
    );
  });

  const [filteredEligibleStudents, setFilteredEligibleStudents] = useState(eligibleStudents);

  useEffect(() => {
    const fetchedDrive = getDriveById(id || '');
    
    if (!fetchedDrive) {
      toast.error('Vaccination drive not found');
      navigate('/vaccination-drives');
      return;
    }
    
    setDrive(fetchedDrive);
    
    // Fetch vaccinated students
    const fetchVaccinatedStudents = async () => {
      try {
        const vaccinatedStudents = await getDriveVaccinatedStudents(id || '');
        setVaccinated(vaccinatedStudents);
      } catch (err) {
        console.error("Error fetching vaccinated students:", err);
        setVaccinated([]);
      }
    };
    
    fetchVaccinatedStudents();
    
    // Initialize edit form with drive data
    setEditFormData({
      name: fetchedDrive.name,
      date: fetchedDrive.date,
      vaccineName: fetchedDrive.vaccineName,
      totalDoses: fetchedDrive.totalDoses,
      targetClasses: fetchedDrive.targetClasses,
    });
  }, [id, getDriveById, getDriveVaccinatedStudents, navigate]);
  
  // Update filtered students when search term changes
  useEffect(() => {
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      setFilteredEligibleStudents(
        eligibleStudents.filter(student => 
          student.name.toLowerCase().includes(lowerSearchTerm) ||
          student.rollNumber.toLowerCase().includes(lowerSearchTerm) ||
          student.class.toLowerCase().includes(lowerSearchTerm) ||
          student.section.toLowerCase().includes(lowerSearchTerm)
        )
      );
    } else {
      setFilteredEligibleStudents(eligibleStudents);
    }
  }, [searchTerm, eligibleStudents]);

  if (!drive) {
    return null; // Already handling navigation in useEffect
  }

  const handleUpdateDrive = async () => {
    if (!drive) return;
    
    // Check if the drive is already completed
    if (drive.status === 'completed') {
      toast.error('Cannot edit a completed vaccination drive');
      return;
    }
    
    // If date is in the past, don't allow editing
    if (isPast(parseISO(drive.date))) {
      toast.error('Cannot edit a drive scheduled in the past');
      return;
    }
    
    const updatedDrive = {
      ...drive,
      name: editFormData.name,
      date: editFormData.date,
      vaccineName: editFormData.vaccineName,
      totalDoses: editFormData.totalDoses,
      targetClasses: editFormData.targetClasses,
    };
    
    const success = await updateVaccinationDrive(updatedDrive);
    
    if (success) {
      setDrive(updatedDrive);
      setEditDialogOpen(false);
    }
  };
  
  const handleMarkVaccinated = async (studentId: string) => {
    if (!drive) return;
    
    const success = await markStudentVaccinated(studentId, drive._id);
    
    if (success) {
      // Refresh data
      setDrive(getDriveById(drive._id));
      const refreshedVaccinatedStudents = await getDriveVaccinatedStudents(drive._id);
      setVaccinated(refreshedVaccinatedStudents);
    }
  };
  
  const handleClassSelectionChange = (value: string) => {
    setEditFormData(prev => {
      // Toggle class selection
      const targetClasses = prev.targetClasses.includes(value) 
        ? prev.targetClasses.filter(c => c !== value)
        : [...prev.targetClasses, value];
        
      // Sort classes numerically
      targetClasses.sort((a, b) => parseInt(a) - parseInt(b));
        
      return {
        ...prev,
        targetClasses
      };
    });
  };
  
  const downloadVaccinatedList = () => {
    if (vaccinated.length === 0) {
      toast.error('No vaccinated students to export');
      return;
    }
    
    // Create CSV content
    const headers = ['Name', 'Class', 'Section', 'Roll Number', 'Vaccination Date', 'Vaccine'];
    const rows = vaccinated.map(student => {
      const vaccination = student.vaccinations.find(v => v.driveId === drive._id);
      return [
        student.name,
        student.class,
        student.section,
        student.rollNumber,
        vaccination?.date || '',
        vaccination?.vaccineName || ''
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `${drive.name}_vaccinated_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success('Vaccinated students list downloaded');
  };

  // Calculate drive status and styling
  const driveDate = parseISO(drive.date);
  const isPastDrive = isPast(driveDate);
  const isScheduled = drive.status === 'scheduled';
  const isCompleted = drive.status === 'completed';
  const isCancelled = drive.status === 'cancelled';
  
  let statusClass = '';
  let statusText = '';
  
  if (isCompleted) {
    statusClass = 'bg-green-100 text-green-800';
    statusText = 'Completed';
  } else if (isCancelled) {
    statusClass = 'bg-red-100 text-red-800';
    statusText = 'Cancelled';
  } else if (isPastDrive) {
    statusClass = 'bg-amber-100 text-amber-800';
    statusText = 'Past Due';
  } else {
    statusClass = 'bg-blue-100 text-blue-800';
    statusText = 'Scheduled';
  }

  // Check if drive can be edited
  const canEdit = isScheduled && !isPastDrive;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4 p-0 hover:bg-transparent"
          onClick={() => navigate('/vaccination-drives')}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{drive.name}</h1>
          <div className="flex items-center mt-1 gap-2">
            <span className="text-gray-600">
              {format(parseISO(drive.date), 'PPP')}
            </span>
            <span className="mx-1">•</span>
            <span 
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
            >
              {statusText}
            </span>
          </div>
        </div>
        {canEdit && (
          <Button 
            variant="outline" 
            className="ml-auto flex items-center gap-2"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit size={16} />
            <span>Edit</span>
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Drive Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vaccine</h3>
                <p className="mt-1 font-medium">{drive.vaccineName}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {format(parseISO(drive.date), 'PPP')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Target Classes</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {drive.targetClasses.map(classNumber => (
                    <span 
                      key={classNumber}
                      className="bg-gray-100 px-2 py-0.5 rounded text-sm"
                    >
                      {classNumber}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vaccination Progress</h3>
                <div className="mt-2">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-medical-500 rounded-full"
                          style={{ width: `${(drive.usedDoses / drive.totalDoses) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="ml-3 text-sm font-medium">
                      {drive.usedDoses}/{drive.totalDoses}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {drive.usedDoses} doses administered, {drive.totalDoses - drive.usedDoses} remaining
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isScheduled && (
            <div className="mt-6 flex flex-col gap-2">
              <Button
                className="bg-medical-600 hover:bg-medical-700 flex items-center gap-2"
                onClick={() => setAddStudentsDialogOpen(true)}
                disabled={eligibleStudents.length === 0 || drive.usedDoses >= drive.totalDoses}
              >
                <Plus size={16} />
                <span>Add Vaccinated Students</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={downloadVaccinatedList}
                disabled={vaccinated.length === 0}
              >
                <Download size={16} />
                <span>Download Vaccinated List</span>
              </Button>
            </div>
          )}
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vaccinated Students</CardTitle>
              <CardDescription>
                List of students who received this vaccination
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vaccinated.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {vaccinated.map(student => (
                    <div 
                      key={student.id} 
                      className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">Class {student.class}-{student.section} • Roll Number: {student.rollNumber}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check size={10} className="mr-1" />
                          Vaccinated
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No vaccinated students</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No students have been vaccinated in this drive yet.
                  </p>
                  {isScheduled && eligibleStudents.length > 0 && drive.usedDoses < drive.totalDoses && (
                    <Button 
                      className="mt-4 bg-medical-600 hover:bg-medical-700 text-white"
                      onClick={() => setAddStudentsDialogOpen(true)}
                    >
                      Add Vaccinated Students
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Drive Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Vaccination Drive</DialogTitle>
            <DialogDescription>
              Update the vaccination drive details. Drive date must be at least 15 days in the future.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Drive Name</Label>
              <Input 
                id="name" 
                value={editFormData.name} 
                onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                min={minDate}
                value={editFormData.date} 
                onChange={e => setEditFormData({...editFormData, date: e.target.value})} 
              />
              <p className="text-xs text-gray-500">
                Must be at least 15 days from today.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vaccineName">Vaccine Name</Label>
              <Input 
                id="vaccineName" 
                value={editFormData.vaccineName} 
                onChange={e => setEditFormData({...editFormData, vaccineName: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="totalDoses">Number of Available Doses</Label>
              <Input 
                id="totalDoses" 
                type="number" 
                min={drive.usedDoses} 
                value={editFormData.totalDoses} 
                onChange={e => setEditFormData({...editFormData, totalDoses: parseInt(e.target.value)})} 
              />
              <p className="text-xs text-gray-500">
                Must be at least equal to doses already used ({drive.usedDoses}).
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Target Classes</Label>
              <div className="grid grid-cols-6 gap-2 mt-1">
                {availableClasses.map(classNum => (
                  <button
                    key={classNum}
                    type="button"
                    className={`px-3 py-2 rounded text-sm border ${
                      editFormData.targetClasses.includes(classNum)
                        ? 'bg-medical-600 text-white border-medical-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleClassSelectionChange(classNum)}
                  >
                    {classNum}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-medical-600 hover:bg-medical-700" onClick={handleUpdateDrive}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Students Dialog */}
      <Dialog open={addStudentsDialogOpen} onOpenChange={setAddStudentsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Mark Students as Vaccinated</DialogTitle>
            <DialogDescription>
              Select students to mark as having received this vaccination.
            </DialogDescription>
          </DialogHeader>
          <div className="relative mb-4 mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search students..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto flex-1 pr-2">
            {filteredEligibleStudents.length > 0 ? (
              <div className="space-y-2">
                {filteredEligibleStudents.map(student => (
                  <div 
                    key={student.id} 
                    className="flex items-center p-3 border rounded hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">
                        Class {student.class}-{student.section} • Roll Number: {student.rollNumber}
                      </p>
                    </div>
                    <Button 
                      className="ml-4 bg-medical-600 hover:bg-medical-700"
                      onClick={() => handleMarkVaccinated(student.id)}
                      disabled={drive.usedDoses >= drive.totalDoses}
                    >
                      <Check size={16} className="mr-1" />
                      Mark Vaccinated
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No eligible students</h3>
                <p className="mt-1 text-gray-500">
                  {searchTerm 
                    ? 'No students match your search criteria.' 
                    : 'All eligible students have already been vaccinated or no students are in the target classes.'}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <div className="text-sm text-gray-500">
              {drive.usedDoses >= drive.totalDoses && 
                <span className="text-amber-600 font-medium">No doses remaining. Cannot add more students.</span>
              }
              {drive.usedDoses < drive.totalDoses &&
                <span>Remaining doses: {drive.totalDoses - drive.usedDoses}</span>
              }
            </div>
            <Button variant="outline" onClick={() => setAddStudentsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriveDetails;
