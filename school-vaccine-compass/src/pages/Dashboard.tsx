import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import { Calendar, Users, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { VaccinationDrive } from '@/lib/types';

const Dashboard: React.FC = () => {
  const { 
    getUpcomingDrives, 
    getVaccinationStats,
    loading: contextLoading
  } = useData();
  
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, vaccinated: 0, percentage: 0 });
  const [upcomingDrives, setUpcomingDrives] = useState<VaccinationDrive[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, drivesData] = await Promise.all([
          getVaccinationStats(),
          getUpcomingDrives()
        ]);
        setStats(statsData);
        setUpcomingDrives(drivesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (!contextLoading) {
      fetchData();
    }
  }, [getUpcomingDrives, getVaccinationStats, contextLoading]);

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-medical-600" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the School Vaccination Portal. Here's an overview of your vaccination program.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats.total}</div>
            <p className="text-xs text-gray-500">Registered in the system</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Vaccinated Students</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats.vaccinated}</div>
            <p className="text-xs text-gray-500">Received at least one vaccination</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Vaccination Rate</CardTitle>
            <div className="h-4 w-4 text-medical-600 font-bold">%</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats.percentage}%</div>
            <p className="text-xs text-gray-500">Of total student population</p>
          </CardContent>
        </Card>
      </div>

      {/* Vaccination Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Vaccination Progress</CardTitle>
          <CardDescription>Overall vaccination coverage status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div 
              className="w-32 h-32 rounded-full relative flex items-center justify-center"
              style={{
                background: `conic-gradient(#0ea5e9 ${stats.percentage}%, #e2e8f0 0)`
              }}
            >
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                <span className="text-2xl font-bold">{stats.percentage}%</span>
              </div>
            </div>
            <div className="ml-6">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-medical-500 mr-2"></div>
                  <span className="text-sm">
                    {stats.vaccinated} students vaccinated
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-200 mr-2"></div>
                  <span className="text-sm">
                    {stats.total - stats.vaccinated} students unvaccinated
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Vaccination Drives */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Vaccination Drives</CardTitle>
            <CardDescription>
              Drives scheduled within the next 30 days
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            className="text-medical-600 border-medical-600 hover:bg-medical-50"
            onClick={() => navigate('/vaccination-drives')}
          >
            View All Drives
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingDrives.length > 0 ? (
            <div className="space-y-4">
              {upcomingDrives.map((drive) => (
                <div 
                  key={drive._id} 
                  className="p-4 border rounded-md bg-white flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/vaccination-drives/${drive._id}`)}
                >
                  <div className="flex items-center">
                    <div className="bg-medical-100 p-3 rounded-full">
                      <Calendar className="h-6 w-6 text-medical-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium">{drive.name}</h3>
                      <p className="text-sm text-gray-500">
                        {format(parseISO(drive.date), 'PPP')} &middot; {drive.vaccineName} &middot; {drive.targetClasses.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right">
                      <span className="font-medium">{drive.totalDoses - drive.usedDoses}</span>
                      <p className="text-xs text-gray-500">available doses</p>
                    </div>
                    <div className="ml-6">
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mb-2" />
              <h3 className="text-lg font-medium text-gray-900">No upcoming drives</h3>
              <p className="text-gray-500 mt-1 max-w-md">
                There are no vaccination drives scheduled for the next 30 days. Create a new drive to get started.
              </p>
              <Button 
                className="mt-4 bg-medical-600 hover:bg-medical-700"
                onClick={() => navigate('/vaccination-drives')}
              >
                Schedule a Drive
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
