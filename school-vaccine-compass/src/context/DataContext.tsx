import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Student, VaccinationDrive } from '@/lib/types';
import { mockStudents, mockVaccinationDrives } from '@/lib/mockData';
import { studentApi, vaccinationDriveApi } from '@/services/api';
import { addDays, parseISO, isAfter, isPast } from 'date-fns';

interface DataContextType {
  students: Student[];
  vaccinationDrives: VaccinationDrive[];
  loading: boolean;
  error: string | null;
  addStudent: (student: Omit<Student, '_id' | 'id' | 'vaccinations'>) => Promise<void>;
  updateStudent: (student: Student) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<void>;
  getStudentById: (id: string) => Student | undefined;
  addVaccinationDrive: (drive: Omit<VaccinationDrive, '_id' | 'id' | 'usedDoses' | 'status'>) => Promise<void>;
  updateVaccinationDrive: (drive: VaccinationDrive) => Promise<boolean>;
  cancelVaccinationDrive: (id: string) => Promise<void>;
  completeVaccinationDrive: (id: string) => Promise<void>;
  getDriveById: (id: string) => VaccinationDrive | undefined;
  getDriveVaccinatedStudents: (driveId: string) => Promise<Student[]>;
  markStudentVaccinated: (studentId: string, driveId: string) => Promise<boolean>;
  getUpcomingDrives: () => Promise<VaccinationDrive[]>;
  getVaccinationStats: () => Promise<{ total: number; vaccinated: number; percentage: number }>;
  importStudents: (studentsData: Omit<Student, '_id' | 'id' | 'vaccinations'>[]) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [vaccinationDrives, setVaccinationDrives] = useState<VaccinationDrive[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch all data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, drivesData] = await Promise.all([
        studentApi.getAll(),
        vaccinationDriveApi.getAll()
      ]);
      setStudents(studentsData);
      setVaccinationDrives(drivesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
      // Fallback to mock data if API fails
      setStudents(mockStudents as unknown as Student[]);
      setVaccinationDrives(mockVaccinationDrives as unknown as VaccinationDrive[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addStudent = async (student: Omit<Student, '_id' | 'id' | 'vaccinations'>) => {
    try {
      const newStudent = await studentApi.create(student);
      setStudents(prev => [...prev, newStudent]);
      toast.success(`${student.name} added successfully!`);
    } catch (err) {
      console.error('Error adding student:', err);
      throw err;
    }
  };
  
  const updateStudent = async (student: Student): Promise<boolean> => {
    try {
      const updatedStudent = await studentApi.update(student);
      setStudents(prev => prev.map(s => (s._id === updatedStudent._id ? updatedStudent : s)));
      toast.success(`${student.name} updated successfully!`);
      return true;
    } catch (err) {
      console.error('Error updating student:', err);
      return false;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await studentApi.delete(id);
      setStudents(prev => prev.filter(student => student._id !== id));
      toast.success('Student deleted successfully!');
    } catch (err) {
      console.error('Error deleting student:', err);
      throw err;
    }
  };

  const getStudentById = (id: string): Student | undefined => {
    return students.find(student => student._id === id || student.id === id);
  };

  const addVaccinationDrive = async (drive: Omit<VaccinationDrive, '_id' | 'id' | 'usedDoses' | 'status'>) => {
    try {
      const newDrive = await vaccinationDriveApi.create(drive);
      setVaccinationDrives(prev => [...prev, newDrive]);
      toast.success(`${drive.name} added successfully!`);
    } catch (err) {
      console.error('Error adding vaccination drive:', err);
      throw err;
    }
  };
  
  const updateVaccinationDrive = async (drive: VaccinationDrive): Promise<boolean> => {
    try {
      const updatedDrive = await vaccinationDriveApi.update(drive);
      setVaccinationDrives(prev => prev.map(d => (d._id === updatedDrive._id ? updatedDrive : d)));
      toast.success(`${drive.name} updated successfully!`);
      return true;
    } catch (err) {
      console.error('Error updating vaccination drive:', err);
      return false;
    }
  };

  const cancelVaccinationDrive = async (id: string) => {
    try {
      const updatedDrive = await vaccinationDriveApi.cancel(id);
      setVaccinationDrives(prev => prev.map(drive => (drive._id === id ? updatedDrive : drive)));
      toast.success('Vaccination drive cancelled successfully!');
    } catch (err) {
      console.error('Error cancelling vaccination drive:', err);
      throw err;
    }
  };
  
  const completeVaccinationDrive = async (id: string) => {
    try {
      const updatedDrive = await vaccinationDriveApi.complete(id);
      setVaccinationDrives(prev => prev.map(drive => (drive._id === id ? updatedDrive : drive)));
      toast.success('Vaccination drive completed successfully!');
    } catch (err) {
      console.error('Error completing vaccination drive:', err);
      throw err;
    }
  };

  const getDriveById = (id: string): VaccinationDrive | undefined => {
    return vaccinationDrives.find(drive => drive._id === id || drive.id === id);
  };
  
  const getDriveVaccinatedStudents = async (driveId: string): Promise<Student[]> => {
    try {
      return await vaccinationDriveApi.getVaccinatedStudents(driveId);
    } catch (err) {
      console.error('Error getting vaccinated students:', err);
      return students.filter(student => student.vaccinations.some(v => v.driveId === driveId));
    }
  };
  
  const markStudentVaccinated = async (studentId: string, driveId: string): Promise<boolean> => {
    try {
      const result = await vaccinationDriveApi.markStudentVaccinated(driveId, studentId);
      
      // Update local state with new data
      setStudents(prev => prev.map(s => (s._id === result.student._id ? result.student : s)));
      setVaccinationDrives(prev => prev.map(d => (d._id === result.drive._id ? result.drive : d)));
      
      toast.success(`Student marked as vaccinated!`);
      return true;
    } catch (err) {
      console.error('Error marking student as vaccinated:', err);
      return false;
    }
  };

  // Function to get upcoming vaccination drives (within the next 30 days)
  const getUpcomingDrives = async (): Promise<VaccinationDrive[]> => {
    try {
      return await vaccinationDriveApi.getUpcoming();
    } catch (err) {
      console.error('Error getting upcoming drives:', err);
      
      // Fallback to client-side filtering if API fails
      const today = new Date();
      const thirtyDaysFromNow = addDays(today, 30);
      
      return vaccinationDrives
        .filter(drive => {
          const driveDate = parseISO(drive.date);
          return (
            drive.status === 'scheduled' &&
            !isPast(driveDate) && 
            isAfter(driveDate, today) && 
            isAfter(thirtyDaysFromNow, driveDate)
          );
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  };

  // Function to get vaccination statistics
  const getVaccinationStats = async () => {
    try {
      return await vaccinationDriveApi.getStats();
    } catch (err) {
      console.error('Error getting vaccination stats:', err);
      
      // Fallback to client-side calculation if API fails
      const total = students.length;
      const vaccinated = students.filter(student => 
        student.vaccinations.some(v => v.status === 'completed')
      ).length;
      
      const percentage = total > 0 ? Math.round((vaccinated / total) * 100) : 0;
      
      return {
        total,
        vaccinated,
        percentage
      };
    }
  };

  // Updated importStudents method with the correct parameter type
  const importStudents = async (studentsData: Omit<Student, '_id' | 'id' | 'vaccinations'>[]) => {
    try {
      const newStudents = await studentApi.importStudents(studentsData);
      setStudents(prev => [...prev, ...newStudents]);
      toast.success(`${newStudents.length} students imported successfully!`);
    } catch (err) {
      console.error('Error importing students:', err);
      throw err;
    }
  };

  // Function to refresh all data
  const refreshData = async () => {
    await fetchData();
  };

  const value: DataContextType = {
    students,
    vaccinationDrives,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    addVaccinationDrive,
    updateVaccinationDrive,
    cancelVaccinationDrive,
    completeVaccinationDrive,
    getDriveById,
    getDriveVaccinatedStudents,
    markStudentVaccinated,
    getUpcomingDrives,
    getVaccinationStats,
    importStudents,
    refreshData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
