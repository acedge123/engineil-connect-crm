
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Users, 
  Building2, 
  ListTodo, 
  CheckCircle2,
  Clock 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Mock data
const industryData = [
  { name: 'Technology', value: 35 },
  { name: 'Manufacturing', value: 25 },
  { name: 'Healthcare', value: 20 },
  { name: 'Finance', value: 15 },
  { name: 'Energy', value: 5 }
];

const taskStatusData = [
  { name: 'Completed', value: 42 },
  { name: 'In Progress', value: 28 },
  { name: 'Pending', value: 30 }
];

const weeklyActivityData = [
  { day: 'Mon', tasks: 5, meetings: 2 },
  { day: 'Tue', tasks: 8, meetings: 3 },
  { day: 'Wed', tasks: 12, meetings: 5 },
  { day: 'Thu', tasks: 7, meetings: 4 },
  { day: 'Fri', tasks: 10, meetings: 6 },
  { day: 'Sat', tasks: 3, meetings: 1 },
  { day: 'Sun', tasks: 1, meetings: 0 }
];

const upcomingTasks = [
  { id: 1, title: 'Follow up with Acme Corp', dueDate: '2025-05-06', company: 'Acme Corporation', priority: 'high' },
  { id: 2, title: 'Send proposal to TechStar', dueDate: '2025-05-08', company: 'TechStar Industries', priority: 'medium' },
  { id: 3, title: 'Schedule meeting with CFO', dueDate: '2025-05-07', company: 'MegaCorp Ltd', priority: 'high' },
  { id: 4, title: 'Research industry trends', dueDate: '2025-05-10', company: 'Internal', priority: 'low' },
];

const recentContacts = [
  { id: 1, name: 'John Smith', company: 'Acme Corporation', position: 'CEO', lastContact: '2025-05-01' },
  { id: 2, name: 'Sarah Johnson', company: 'TechStar Industries', position: 'CTO', lastContact: '2025-05-02' },
  { id: 3, name: 'Michael Davis', company: 'MegaCorp Ltd', position: 'CFO', lastContact: '2025-05-03' },
  { id: 4, name: 'Emily Wilson', company: 'GlobeTech', position: 'VP Sales', lastContact: '2025-05-04' },
];

const COLORS = ['#0EA5E9', '#8B5CF6', '#F97316', '#10B981', '#EF4444'];
const TASK_COLORS = ['#10B981', '#F97316', '#EF4444'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || user?.email}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <p className="text-gray-600 text-sm">
            Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Building2 className="h-6 w-6 text-crm-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Companies</p>
              <h3 className="text-2xl font-bold text-gray-900">36</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-full bg-purple-100 p-3">
              <Users className="h-6 w-6 text-crm-purple" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Contacts</p>
              <h3 className="text-2xl font-bold text-gray-900">248</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-full bg-orange-100 p-3">
              <ListTodo className="h-6 w-6 text-crm-orange" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tasks</p>
              <h3 className="text-2xl font-bold text-gray-900">42</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-6 w-6 text-crm-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <h3 className="text-2xl font-bold text-gray-900">158</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Companies by Industry</CardTitle>
            <CardDescription>Distribution of companies by sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={industryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {industryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} companies`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Activity</CardTitle>
            <CardDescription>Tasks and meetings by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyActivityData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#0EA5E9" name="Tasks" />
                  <Bar dataKey="meetings" fill="#8B5CF6" name="Meetings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks and Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
            <CardDescription>Your upcoming tasks and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div 
                  key={task.id}
                  className="rounded-md border p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate('/tasks')}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.company}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button 
                className="text-sm text-crm-blue hover:text-blue-700"
                onClick={() => navigate('/tasks')}
              >
                View all tasks →
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Recent Contacts</CardTitle>
            <CardDescription>Recently contacted people</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContacts.map((contact) => (
                <div 
                  key={contact.id}
                  className="rounded-md border p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/people/${contact.id}`)}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900">{contact.name}</h4>
                      <p className="text-sm text-gray-600">{contact.position} at {contact.company}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Last contacted: {new Date(contact.lastContact).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button 
                className="text-sm text-crm-blue hover:text-blue-700"
                onClick={() => navigate('/people')}
              >
                View all contacts →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
