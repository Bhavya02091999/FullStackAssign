
import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { Download, FileText, Calendar, ArrowLeft, ArrowRight, Smartphone } from 'lucide-react';
import { Student, VaccinationDrive } from '@/lib/mockData';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const Reports: React.FC = () => {
  const { students, vaccinationDrives } = useData();
  const isMobile = useIsMobile();
  
  const [reportType, setReportType] = useState<string>('monthly');
  const [vaccineName, setVaccineName] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [exportLoading, setExportLoading] = useState(false);
  
  // Get unique vaccine names from all drives
  const uniqueVaccines = ['all', ...new Set(vaccinationDrives.map(drive => drive.vaccineName))];
  
  // Format month display
  const formattedMonth = format(selectedMonth, 'MMMM yyyy');

  // Filter drives based on report type and vaccine name
  const filteredDrives = React.useMemo(() => {
    // Start with all drives that are completed
    let filtered = vaccinationDrives.filter(drive => drive.status === 'completed');
    
    // Apply vaccine name filter if not 'all'
    if (vaccineName !== 'all') {
      filtered = filtered.filter(drive => drive.vaccineName === vaccineName);
    }
    
    // Apply date filter if monthly report
    if (reportType === 'monthly') {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      filtered = filtered.filter(drive => {
        const driveDate = parseISO(drive.date);
        return driveDate >= monthStart && driveDate <= monthEnd;
      });
    }
    
    return filtered;
  }, [reportType, vaccineName, selectedMonth, vaccinationDrives]);
  
  // Get all students vaccinated in the filtered drives
  const vaccinatedStudents = React.useMemo(() => {
    const driveIds = filteredDrives.map(drive => drive.id);
    
    return students.filter(student => 
      student.vaccinations.some(v => 
        driveIds.includes(v.driveId) && v.status === 'completed'
      )
    );
  }, [filteredDrives, students]);
  
  // Group vaccinated students by class for chart
  const classCounts = React.useMemo(() => {
    const countByClass: Record<string, number> = {};
    
    vaccinatedStudents.forEach(student => {
      countByClass[student.class] = (countByClass[student.class] || 0) + 1;
    });
    
    // Convert to array and sort by class number
    return Object.entries(countByClass)
      .map(([classNum, count]) => ({ name: `Class ${classNum}`, count }))
      .sort((a, b) => {
        const numA = parseInt(a.name.replace('Class ', ''));
        const numB = parseInt(b.name.replace('Class ', ''));
        return numA - numB;
      });
  }, [vaccinatedStudents]);
  
  // Calculate vaccination coverage by vaccine
  const vaccineCoverage = React.useMemo(() => {
    const vaccineData: Record<string, { count: number; color: string }> = {};
    const colors = ['#0ea5e9', '#f97316', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    
    let colorIndex = 0;
    
    // Count vaccinations by vaccine type
    students.forEach(student => {
      student.vaccinations.forEach(vacc => {
        if (vacc.status === 'completed') {
          if (!vaccineData[vacc.vaccineName]) {
            vaccineData[vacc.vaccineName] = { 
              count: 0, 
              color: colors[colorIndex % colors.length] 
            };
            colorIndex++;
          }
          vaccineData[vacc.vaccineName].count++;
        }
      });
    });
    
    // Convert to array format for chart
    return Object.entries(vaccineData).map(([name, data]) => ({
      name,
      value: data.count,
      color: data.color
    }));
  }, [students]);
  
  // Handle month navigation
  const prevMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };
  
  const nextMonth = () => {
    const nextMonthDate = addMonths(selectedMonth, 1);
    if (nextMonthDate <= new Date()) {
      setSelectedMonth(nextMonthDate);
    }
  };
  
  // Export report as CSV
  const exportReport = () => {
    setExportLoading(true);
    
    try {
      // Create headers
      const headers = ['Name', 'Class', 'Section', 'Roll Number', 'Vaccine Name', 'Vaccination Date'];
      
      // Create rows
      const rows: string[][] = [];
      
      vaccinatedStudents.forEach(student => {
        student.vaccinations
          .filter(v => 
            filteredDrives.some(drive => drive.id === v.driveId) && 
            v.status === 'completed'
          )
          .forEach(v => {
            rows.push([
              student.name,
              student.class,
              student.section,
              student.rollNumber,
              v.vaccineName,
              v.date
            ]);
          });
      });
      
      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = reportType === 'monthly' 
        ? `Vaccination_Report_${format(selectedMonth, 'MMM_yyyy')}.csv`
        : 'Vaccination_Report_All_Time.csv';
        
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vaccination Reports</h1>
        <p className="text-gray-600 mt-1">
          Generate and download reports on vaccination drives and student vaccination status
        </p>
      </header>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Settings</CardTitle>
          <CardDescription>Configure the report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="all">All-Time Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {reportType === 'monthly' && (
              <div className="space-y-2">
                <Label>Month</Label>
                <div className="flex items-center">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10"
                    onClick={prevMonth}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center font-medium px-2">
                    {formattedMonth}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10"
                    onClick={nextMonth}
                    disabled={addMonths(selectedMonth, 1) > new Date()}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="vaccineName">Vaccine</Label>
              <Select value={vaccineName} onValueChange={setVaccineName}>
                <SelectTrigger id="vaccineName">
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueVaccines.map(vaccine => (
                    <SelectItem key={vaccine} value={vaccine}>
                      {vaccine === 'all' ? 'All Vaccines' : vaccine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={exportReport} 
              disabled={exportLoading || vaccinatedStudents.length === 0}
              className="flex items-center gap-2 bg-medical-600 hover:bg-medical-700"
            >
              <Download size={16} />
              <span>{exportLoading ? 'Exporting...' : 'Export Report'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students Vaccinated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vaccinatedStudents.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {reportType === 'monthly' 
                ? `During ${formattedMonth}`
                : 'All time'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vaccination Drives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredDrives.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {reportType === 'monthly' 
                ? `During ${formattedMonth}`
                : 'All time'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Doses Administered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredDrives.reduce((sum, drive) => sum + drive.usedDoses, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {reportType === 'monthly' 
                ? `During ${formattedMonth}`
                : 'All time'
              }
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vaccinations by Class</CardTitle>
            <CardDescription>
              Number of students vaccinated per class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classCounts.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classCounts}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center">
                <Calendar className="h-12 w-12 text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-900">No data available</h3>
                <p className="text-gray-500 mt-1 text-center max-w-xs">
                  {reportType === 'monthly'
                    ? `No vaccination data available for ${formattedMonth}`
                    : 'No vaccination data available'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Vaccine Distribution</CardTitle>
            <CardDescription>
              Distribution of vaccines administered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vaccineCoverage.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vaccineCoverage}
                      cx="50%"
                      cy="50%"
                      labelLine={!isMobile}
                      label={!isMobile ? (entry) => entry.name : undefined}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {vaccineCoverage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {isMobile && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {vaccineCoverage.map((entry, index) => (
                      <div key={index} className="flex items-center">
                        <div 
                          className="w-3 h-3 mr-1" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center">
                <FileText className="h-12 w-12 text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-900">No data available</h3>
                <p className="text-gray-500 mt-1 text-center max-w-xs">
                  No vaccination distribution data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vaccinated Students</CardTitle>
            <CardDescription>
              List of students vaccinated
              {reportType === 'monthly' ? ` in ${formattedMonth}` : ''}
              {vaccineName !== 'all' ? ` with ${vaccineName}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vaccinatedStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vaccinatedStudents.slice(0, 10).map((student) => {
                      const relevantVaccinations = student.vaccinations.filter(v => 
                        filteredDrives.some(drive => drive.id === v.driveId) && 
                        v.status === 'completed' &&
                        (vaccineName === 'all' || v.vaccineName === vaccineName)
                      );
                      
                      return relevantVaccinations.map((v, i) => (
                        <tr key={`${student.id}-${i}`} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{student.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{student.class}-{student.section}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{student.rollNumber}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{v.vaccineName}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{format(parseISO(v.date), 'PP')}</td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
                
                {vaccinatedStudents.length > 10 && (
                  <div className="py-3 px-4 text-center text-sm text-gray-500">
                    Showing 10 of {vaccinatedStudents.length} students. Export the report to view all data.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No students found</h3>
                <p className="mt-1 text-gray-500">
                  No vaccination records match your selected filters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
