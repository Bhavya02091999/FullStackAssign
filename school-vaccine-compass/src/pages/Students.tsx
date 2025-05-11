
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { BaseStudent, Student, convertToUIStudent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Plus, Upload, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const Students: React.FC = () => {
  const { students, addStudent, importStudents } = useData();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<BaseStudent[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // New student form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    class: '',
    section: '',
    rollNumber: '',
    age: 0,
    gender: 'Male' as 'Male' | 'Female' | 'Other',
  });
  
  // Import CSV state
  const [csvText, setCsvText] = useState('');
  
  // Effect to filter students when search term or students array changes
  useEffect(() => {
    // Convert API students to UI format
    const uiStudents = students.map(convertToUIStudent);
    
    let results = uiStudents;
    
    // Apply text search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter((student) => 
        student.name.toLowerCase().includes(lowerSearchTerm) ||
        student.rollNumber.toLowerCase().includes(lowerSearchTerm) ||
        student.class.toLowerCase().includes(lowerSearchTerm) ||
        student.section.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply vaccination status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'vaccinated') {
        results = results.filter(student => student.vaccinations.some(v => v.status === 'completed'));
      } else if (statusFilter === 'unvaccinated') {
        results = results.filter(student => !student.vaccinations.some(v => v.status === 'completed'));
      }
    }
    
    setFilteredStudents(results);
  }, [searchTerm, students, statusFilter]);

  const handleStudentClick = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };
  
  const handleAddStudent = () => {
    // Basic validation
    if (!newStudent.name || !newStudent.class || !newStudent.section || !newStudent.rollNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    addStudent(newStudent);
    setAddDialogOpen(false);
    
    // Reset form
    setNewStudent({
      name: '',
      class: '',
      section: '',
      rollNumber: '',
      age: 0,
      gender: 'Male' as 'Male' | 'Female' | 'Other',
    });
  };
  
  const handleImportCSV = () => {
    try {
      // Parse CSV
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      
      const requiredHeaders = ['name', 'class', 'section', 'rollNumber', 'age', 'gender'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast.error(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
        return;
      }
      
      // Fix type definition to match what importStudents expects
      const students: Omit<Student, '_id' | 'id' | 'vaccinations'>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length !== headers.length) continue;
        
        const student: any = {};
        headers.forEach((header, index) => {
          if (header === 'age') {
            student[header] = parseInt(values[index]);
          } else {
            student[header] = values[index];
          }
        });
        
        students.push(student as Omit<Student, '_id' | 'id' | 'vaccinations'>);
      }
      
      if (students.length === 0) {
        toast.error('No valid students found in CSV');
        return;
      }
      
      importStudents(students);
      setImportDialogOpen(false);
      setCsvText('');
    } catch (error) {
      console.error('CSV import error:', error);
      toast.error('Error importing CSV. Please check the format and try again.');
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage student records and vaccination status</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload size={16} />
            <span>Import CSV</span>
          </Button>
          <Button 
            className="bg-medical-600 hover:bg-medical-700 flex items-center gap-2"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus size={16} />
            <span>Add Student</span>
          </Button>
        </div>
      </header>
      
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search students by name, class or roll number..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="vaccinated">Vaccinated</SelectItem>
                <SelectItem value="unvaccinated">Not Vaccinated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Vaccinations</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const vaccinationCount = student.vaccinations.filter(v => v.status === 'completed').length;
                  const isVaccinated = vaccinationCount > 0;
                  
                  return (
                    <TableRow 
                      key={student.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleStudentClick(student.id)}
                    >
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class} - {student.section}</TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>{vaccinationCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isVaccinated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {isVaccinated ? (
                              <>
                                <Check size={12} className="mr-1" />
                                Vaccinated
                              </>
                            ) : (
                              <>
                                <X size={12} className="mr-1" />
                                Not Vaccinated
                              </>
                            )}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </div>

      {/* Add Student Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Enter the student's details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                value={newStudent.name} 
                onChange={e => setNewStudent({...newStudent, name: e.target.value})} 
                placeholder="e.g. John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="class">Class *</Label>
                <Input 
                  id="class" 
                  value={newStudent.class} 
                  onChange={e => setNewStudent({...newStudent, class: e.target.value})} 
                  placeholder="e.g. 8"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="section">Section *</Label>
                <Input 
                  id="section" 
                  value={newStudent.section} 
                  onChange={e => setNewStudent({...newStudent, section: e.target.value})} 
                  placeholder="e.g. A"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rollNumber">Roll Number *</Label>
              <Input 
                id="rollNumber" 
                value={newStudent.rollNumber} 
                onChange={e => setNewStudent({...newStudent, rollNumber: e.target.value})} 
                placeholder="e.g. 2301"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input 
                  id="age" 
                  type="number" 
                  min="0" 
                  value={newStudent.age || ''} 
                  onChange={e => setNewStudent({...newStudent, age: parseInt(e.target.value) || 0})} 
                  placeholder="e.g. 13"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={newStudent.gender} 
                  onValueChange={(value) => setNewStudent({
                    ...newStudent, 
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
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button className="bg-medical-600 hover:bg-medical-700" onClick={handleAddStudent}>Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Import Students from CSV</DialogTitle>
            <DialogDescription>
              Paste your CSV data below. The first row should contain headers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="csvText">CSV Data</Label>
              <div className="text-xs text-gray-500 mb-2">
                Required headers: name, class, section, rollNumber, age, gender
              </div>
              <textarea 
                id="csvText" 
                className="min-h-[200px] p-3 border rounded-md"
                value={csvText} 
                onChange={e => setCsvText(e.target.value)} 
                placeholder="name,class,section,rollNumber,age,gender
John Smith,8,A,2301,13,Male
Emma Johnson,7,B,2201,12,Female"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button className="bg-medical-600 hover:bg-medical-700" onClick={handleImportCSV}>
              Import Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;
