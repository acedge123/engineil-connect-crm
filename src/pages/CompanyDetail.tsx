
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/';
import {
  Building2,
  Users,
  Globe,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  ArrowLeft,
  Edit,
  Plus,
  ChevronRight,
  ListTodo,
  User,
} from 'lucide-react';

// Mock data
const companyData = {
  id: 1,
  name: 'Acme Corporation',
  industry: 'Technology',
  description: 'Acme Corporation is a leading provider of cloud solutions, specializing in enterprise software, cloud infrastructure, and digital transformation services. Founded in 2005, the company has grown to become a significant player in the technology sector, serving clients across various industries including finance, healthcare, and retail.',
  employees: 250,
  website: 'acmecorp.com',
  email: 'info@acmecorp.com',
  phone: '+1 (555) 123-4567',
  address: '123 Tech Blvd, San Francisco, CA 94105',
  founded: '2005',
  revenue: '$50M - $100M',
  headquarters: 'San Francisco, CA',
  logoColor: 'blue',
};

const contactsData = [
  {
    id: 1,
    name: 'John Smith',
    position: 'Chief Executive Officer',
    department: 'Executive',
    email: 'john.smith@acmecorp.com',
    phone: '+1 (555) 123-4567',
    avatar: 'JS',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    position: 'Chief Technology Officer',
    department: 'Technology',
    email: 'sarah.johnson@acmecorp.com',
    phone: '+1 (555) 987-6543',
    avatar: 'SJ',
  },
  {
    id: 3,
    name: 'Michael Chen',
    position: 'VP of Sales',
    department: 'Sales',
    email: 'michael.chen@acmecorp.com',
    phone: '+1 (555) 456-7890',
    avatar: 'MC',
  },
  {
    id: 4,
    name: 'Emily Wilson',
    position: 'Marketing Director',
    department: 'Marketing',
    email: 'emily.wilson@acmecorp.com',
    phone: '+1 (555) 234-5678',
    avatar: 'EW',
  },
];

const tasksData = [
  {
    id: 1,
    title: 'Follow up on cloud migration proposal',
    dueDate: '2025-05-15',
    status: 'pending',
    assignee: 'You',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Schedule quarterly business review',
    dueDate: '2025-05-20',
    status: 'in-progress',
    assignee: 'Sarah Johnson',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Send updated pricing information',
    dueDate: '2025-05-12',
    status: 'completed',
    assignee: 'You',
    priority: 'low',
  },
  {
    id: 4,
    title: 'Research new product offerings',
    dueDate: '2025-05-30',
    status: 'pending',
    assignee: 'Michael Chen',
    priority: 'medium',
  },
];

const notesData = [
  {
    id: 1,
    content: 'Discussed potential cloud migration project. They are interested in moving their on-premises infrastructure to AWS. Estimated project value: $250,000.',
    createdBy: 'You',
    createdAt: '2025-05-01T10:30:00',
  },
  {
    id: 2,
    content: 'Quarterly business review completed. Client expressed satisfaction with current services but mentioned concerns about response times for support tickets.',
    createdBy: 'Sarah Johnson',
    createdAt: '2025-04-15T14:45:00',
  },
  {
    id: 3,
    content: 'New product demo scheduled for next month. They are particularly interested in our analytics solution.',
    createdBy: 'You',
    createdAt: '2025-04-10T09:15:00',
  },
];

// Organization Chart Data
const orgChartData = {
  id: 'ceo',
  name: 'John Smith',
  position: 'CEO',
  children: [
    {
      id: 'cto',
      name: 'Sarah Johnson',
      position: 'CTO',
      children: []
    },
    {
      id: 'vp-sales',
      name: 'Michael Chen',
      position: 'VP Sales',
      children: []
    },
    {
      id: 'marketing',
      name: 'Emily Wilson',
      position: 'Marketing Director',
      children: []
    }
  ]
};

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // In a real app, fetch company data based on ID
  // const company = useQuery(['company', id], () => fetchCompany(id));
  
  const company = companyData; // Using mock data for now
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Header with back button */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2 p-0 h-9 w-9"
            onClick={() => navigate('/companies')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600">{company.industry}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button className="bg-crm-blue hover:bg-blue-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="org-chart">Org Chart</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Company info card */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Detailed information about {company.name}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1 text-gray-900">{company.description}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Industry</h3>
                    <p className="mt-1 text-gray-900">{company.industry}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Employees</h3>
                    <p className="mt-1 text-gray-900">{company.employees}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Founded</h3>
                    <p className="mt-1 text-gray-900">{company.founded}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
                    <p className="mt-1 text-gray-900">{company.revenue}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Website</h3>
                    <a href={`https://${company.website}`} className="mt-1 text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                      {company.website}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <a href={`mailto:${company.email}`} className="mt-1 text-blue-600 hover:text-blue-800">
                      {company.email}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <a href={`tel:${company.phone}`} className="mt-1 text-gray-900">
                      {company.phone}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="mt-1 text-gray-900">{company.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Headquarters</h3>
                    <p className="mt-1 text-gray-900">{company.headquarters}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick summaries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Contacts</CardTitle>
                  <Users className="h-5 w-5 text-gray-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{contactsData.length}</p>
                <p className="text-sm text-gray-600">Key personnel</p>
                <Button 
                  variant="ghost" 
                  className="mt-4 w-full text-sm text-crm-blue justify-between"
                  onClick={() => setActiveTab('contacts')}
                >
                  View all contacts
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Tasks</CardTitle>
                  <ListTodo className="h-5 w-5 text-gray-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{tasksData.filter(t => t.status !== 'completed').length}</p>
                <p className="text-sm text-gray-600">Open tasks</p>
                <Button 
                  variant="ghost" 
                  className="mt-4 w-full text-sm text-crm-blue justify-between"
                  onClick={() => setActiveTab('tasks')}
                >
                  View all tasks
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Notes</CardTitle>
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{notesData.length}</p>
                <p className="text-sm text-gray-600">Meeting notes</p>
                <Button 
                  variant="ghost" 
                  className="mt-4 w-full text-sm text-crm-blue justify-between"
                  onClick={() => setActiveTab('notes')}
                >
                  View all notes
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contacts</h2>
            <Button className="bg-crm-blue hover:bg-blue-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactsData.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/people/${contact.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-crm-blue text-white flex items-center justify-center font-medium text-lg">
                      {contact.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-600">{contact.position}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-800 truncate" onClick={(e) => e.stopPropagation()}>
                        {contact.email}
                      </a>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <a href={`tel:${contact.phone}`} className="text-gray-900" onClick={(e) => e.stopPropagation()}>
                        {contact.phone}
                      </a>
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">{contact.department}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <Button className="bg-crm-blue hover:bg-blue-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
          
          <div className="space-y-4">
            {tasksData.map((task) => (
              <Card key={task.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start space-x-3">
                      <input type="checkbox" className="mt-1 rounded text-crm-blue" checked={task.status === 'completed'} readOnly />
                      <div>
                        <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>{task.title}</h3>
                        <div className="flex items-center mt-1 space-x-2">
                          <div className={`px-2 py-0.5 rounded-full text-xs ${getStatusClass(task.status)}`}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                          </div>
                          <div className={`px-2 py-0.5 rounded-full text-xs ${getPriorityClass(task.priority)}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    Assigned to: {task.assignee}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Notes</h2>
            <Button className="bg-crm-blue hover:bg-blue-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </div>
          
          <div className="space-y-4">
            {notesData.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <p className="text-gray-900 whitespace-pre-line">{note.content}</p>
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <span>Added by {note.createdBy}</span>
                    <span className="mx-2">•</span>
                    <time dateTime={note.createdAt}>
                      {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Org Chart Tab */}
        <TabsContent value="org-chart" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Organization Chart</h2>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Structure
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              {/* Simple org chart representation */}
              <div className="flex flex-col items-center">
                <div className="p-4 border border-crm-blue rounded-lg bg-blue-50 min-w-[200px] text-center">
                  <h3 className="font-semibold">{orgChartData.name}</h3>
                  <p className="text-sm text-gray-600">{orgChartData.position}</p>
                </div>
                
                <div className="w-px h-8 bg-gray-300"></div>
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {orgChartData.children.map((child, index) => (
                    <div key={child.id} className="flex flex-col items-center">
                      {index > 0 && <div className="hidden sm:block h-px w-8 bg-gray-300 mb-4"></div>}
                      <div className="p-4 border border-gray-300 rounded-lg min-w-[180px] text-center">
                        <h3 className="font-semibold">{child.name}</h3>
                        <p className="text-sm text-gray-600">{child.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-8 text-center text-gray-600">
                <p>This is a simplified view of the organization structure.</p>
                <Button variant="link" className="text-crm-blue" onClick={() => navigate('/people')}>
                  View all contacts for detailed information
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyDetail;
