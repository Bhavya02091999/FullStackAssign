
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from '@/components/ui/card';
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
import { Search, Plus, Check, X, Calendar, Clock } from 'lucide-react';
import { format, parseISO, addDays, isAfter, isPast } from 'date-fns';
import { VaccinationDrive as BaseVaccinationDrive } from '@/lib/mockData';
import { convertToUIVaccinationDrive } from '@/lib/types';
import { toast } from 'sonner';

const VaccinationDrives: React.FC = () => {
  const { vaccinationDrives, addVaccinationDrive } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [addDriveDialogOpen, setAddDriveDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredDrives, setFilteredDrives] = useState<BaseVaccinationDrive[]>([]);

  // New drive form state
  const [newDrive, setNewDrive] = useState({
    name: '',
    date: '',
    vaccineName: '',
    totalDoses: 0,
    targetClasses: [] as string[],
  });

  // All available classes
  const availableClasses = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  
  // Date validation (at least 15 days from today)
  const minDate = format(addDays(new Date(), 15), 'yyyy-MM-dd');

  // Effect to filter drives when search term or drives array changes
  useEffect(() => {
    // Convert API drives to UI format
    const uiDrives = vaccinationDrives.map(convertToUIVaccinationDrive);
    
    let results = uiDrives;
    
    // Apply text search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter((drive) => 
        drive.name.toLowerCase().includes(lowerSearchTerm) ||
        drive.vaccineName.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(drive => drive.status === statusFilter);
    }
    
    setFilteredDrives(results);
  }, [searchTerm, vaccinationDrives, statusFilter]);

  const handleDriveClick = (driveId: string) => {
    navigate(`/vaccination-drives/${driveId}`);
  };
  
  const handleAddDrive = () => {
    // Basic validation
    if (!newDrive.name || !newDrive.date || !newDrive.vaccineName || newDrive.totalDoses <= 0 || newDrive.targetClasses.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Date validation
    if (newDrive.date < minDate) {
      toast.error('Vaccination drive must be scheduled at least 15 days in advance');
      return;
    }
    
    // Check for overlapping drives on the same date
    const sameDateDrives = vaccinationDrives.filter(drive => 
      drive.date === newDrive.date
    );
    
    if (sameDateDrives.length > 0) {
      toast.error('A vaccination drive is already scheduled for this date');
      return;
    }
    
    addVaccinationDrive(newDrive);
    setAddDriveDialogOpen(false);
      
    // Reset form
    setNewDrive({
      name: '',
      date: '',
      vaccineName: '',
      totalDoses: 0,
      targetClasses: [],
    });
  };
  
  const handleClassSelectionChange = (value: string) => {
    setNewDrive(prev => {
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

  return (
    <div className="animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vaccination Drives</h1>
          <p className="text-gray-600 mt-1">Schedule and manage vaccination drives</p>
        </div>
        <Button 
          className="bg-medical-600 hover:bg-medical-700 flex items-center gap-2 md:self-start"
          onClick={() => setAddDriveDialogOpen(true)}
        >
          <Plus size={16} />
          <span>Schedule Drive</span>
        </Button>
      </header>
      
      <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search drives by name or vaccine..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drives</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredDrives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrives.map(drive => {
            const driveDate = parseISO(drive.date);
            const isPastDrive = isPast(driveDate);
            const isWithin30Days = !isPastDrive && isAfter(driveDate, new Date()) && isAfter(addDays(new Date(), 30), driveDate);
            
            let statusClass = '';
            let statusDisplay = '';
            let IconComponent = Clock;
            
            switch (drive.status) {
              case 'completed':
                statusClass = 'bg-green-100 text-green-800';
                statusDisplay = 'Completed';
                IconComponent = Check;
                break;
              case 'scheduled':
                if (isPastDrive) {
                  statusClass = 'bg-amber-100 text-amber-800';
                  statusDisplay = 'Past Due';
                } else if (isWithin30Days) {
                  statusClass = 'bg-blue-100 text-blue-800';
                  statusDisplay = 'Upcoming';
                } else {
                  statusClass = 'bg-indigo-100 text-indigo-800';
                  statusDisplay = 'Scheduled';
                }
                break;
              case 'cancelled':
                statusClass = 'bg-red-100 text-red-800';
                statusDisplay = 'Cancelled';
                IconComponent = X;
                break;
            }
            
            return (
              <Card 
                key={drive.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleDriveClick(drive.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{drive.name}</CardTitle>
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                    >
                      <IconComponent size={12} className="mr-1" />
                      {statusDisplay}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-700">{format(parseISO(drive.date), 'PPP')}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Vaccine:</div>
                      <div className="font-medium">{drive.vaccineName}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Target Classes:</div>
                      <div className="flex flex-wrap gap-1">
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
                    
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Doses:</div>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center bg-white rounded-lg border shadow-sm py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No vaccination drives found</h3>
          <p className="mt-1 text-gray-500">
            Try adjusting your search or filter to find what you're looking for.
          </p>
          <Button 
            className="mt-4 bg-medical-600 hover:bg-medical-700"
            onClick={() => setAddDriveDialogOpen(true)}
          >
            Schedule New Drive
          </Button>
        </div>
      )}

      {/* Add Drive Dialog */}
      <Dialog open={addDriveDialogOpen} onOpenChange={setAddDriveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Vaccination Drive</DialogTitle>
            <DialogDescription>
              Enter the details for the new vaccination drive. Drives must be scheduled at least 15 days in advance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Drive Name *</Label>
              <Input 
                id="name" 
                value={newDrive.name} 
                onChange={e => setNewDrive({...newDrive, name: e.target.value})} 
                placeholder="e.g. Annual MMR Vaccination"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date *</Label>
              <Input 
                id="date" 
                type="date" 
                min={minDate}
                value={newDrive.date} 
                onChange={e => setNewDrive({...newDrive, date: e.target.value})} 
              />
              <p className="text-xs text-gray-500">
                Must be at least 15 days from today.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vaccineName">Vaccine Name *</Label>
              <Input 
                id="vaccineName" 
                value={newDrive.vaccineName} 
                onChange={e => setNewDrive({...newDrive, vaccineName: e.target.value})} 
                placeholder="e.g. MMR"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="totalDoses">Number of Available Doses *</Label>
              <Input 
                id="totalDoses" 
                type="number" 
                min="1" 
                value={newDrive.totalDoses || ''} 
                onChange={e => setNewDrive({...newDrive, totalDoses: parseInt(e.target.value) || 0})} 
                placeholder="e.g. 100"
              />
            </div>
            <div className="grid gap-2">
              <Label>Target Classes *</Label>
              <div className="grid grid-cols-6 gap-2 mt-1">
                {availableClasses.map(classNum => (
                  <button
                    key={classNum}
                    type="button"
                    className={`px-3 py-2 rounded text-sm border ${
                      newDrive.targetClasses.includes(classNum)
                        ? 'bg-medical-600 text-white border-medical-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleClassSelectionChange(classNum)}
                  >
                    {classNum}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Select one or more classes
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDriveDialogOpen(false)}>Cancel</Button>
            <Button className="bg-medical-600 hover:bg-medical-700" onClick={handleAddDrive}>Schedule Drive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaccinationDrives;
