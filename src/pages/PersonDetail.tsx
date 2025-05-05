
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
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  ArrowLeft,
  Edit,
  Plus,
  Briefcase,
  User,
  MapPinned,
  Clock,
  Calendar as CalendarIcon,
  ListTodo,
  BarChart3,
  Twitter,
  Linkedin,
  Globe,
} from 'lucide-react';

// Mock data for a person
const personData = {
  id: 1,
  name: 'John Smith',
  position: 'Chief Executive Officer',
  company: 'Acme Corporation',
  companyId: 1,
  email: 'john.smith@acmecorp.com',
  phone: '+1 (555) 123-4567',
  mobile: '+1 (555) 987-6543',
  department: 'Executive',
  location: 'San Francisco, CA',
  address: '123 Tech Blvd, San Francisco, CA 94105',
  bio: 'John Smith is the CEO of Acme Corporation, with over 20 years of experience in the technology industry. He has led the company through significant growth and multiple successful product launches.',
  joineDate: '2010-03-15',
  linkedin: 'linkedin.com/in/johnsmith',
  twitter: '@johnsmith',
  website: 'johnsmith.com',
  avatarColor: 'blue',
  lastContacted: '2025-05-01',
  birthday: '1975-08-22',
};

// Mock interaction history
const interactionHistory = [
  {
    id: 1,
    type: 'meeting',
    title: 'Quarterly Business Review',
    date: '2025-05-01T14:00:00',
    notes: 'Discussed Q2 strategy and reviewed performance metrics. John expressed interest in expanding cloud services.',
  },
  {
    id: 2,
    type: 'call',
    title: 'Follow-up Call',
    date: '2025-04-15T10:30:00',
    notes: 'Addressed questions about new product offerings. John will share feedback after internal discussion with his team.',
  },
  {
    id: 3,
    type: 'email',
    title: 'Proposal Sent',
    date: '2025-04-10T09:15:00',
    notes: 'Sent detailed proposal for cloud migration project. Estimated value: $250,000.',
  },
  {
    id: 4,
    type: 'meeting',
    title: 'Initial Consultation',
    date: '2025-03-22T11:00:00',
    notes: 'First meeting to discuss potential projects and establish relationship.',
  },
];

// Mock tasks data
const tasksData = [
  {
    id: 1,
    title: 'Follow up on cloud migration proposal',
    dueDate: '2025-05-15',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Schedule quarterly business review',
    dueDate: '2025-07-01',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Send updated pricing information',
    dueDate: '2025-05-10',
    status: 'completed',
    priority: 'medium',
  },
];

// Mock notes data
const notesData = [
  {
    id: 1,
    content: 'John mentioned he'll be traveling to Europe for business in June. Good opportunity to schedule a meeting in London office.',
    createdAt: '2025-05-01T15:30:00',
  },
  {
    id: 2,
    content: 'Prefers morning meetings, ideally before 11am PT. Doesn't like to discuss business over lunch.',
    createdAt: '2025-04-15T11:45:00',
  },
  {
    id: 3,
    content: 'Interested in AI and machine learning applications for his business. Mentioned looking for solutions to automate customer service.',
    createdAt: '2025-04-10T10:15:00',
  },
];

const PersonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // In a real app, fetch person data based on ID
  // const person = useQuery(['person', id], () => fetchPerson(id));
  
  const person = personData; // Using mock data for now
  
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
  
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'call':
        return <Phone className="h-5 w-5 text-green-500" />;
      case 'email':
        return <Mail className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAvatarBackground = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      case 'indigo': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Header with back button */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2 p-0 h-9 w-9"
            onClick={() => navigate('/people')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{person.name}</h1>
            <p className="text-gray-600">{person.position} at {person.company}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button className="bg-crm-blue hover:bg-blue-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Info Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Contact details for {person.name}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                    <div className={`w-16 h-16 rounded-full ${getAvatarBackground(person.avatarColor)} text-white flex items-center justify-center font-bold text-xl`}>
                      {getInitials(person.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{person.name}</h3>
                      <p className="text-gray-600">{person.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <a href={`mailto:${person.email}`} className="text-blue-600 hover:text-blue-800">
                        {person.email}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Work Phone</h3>
                      <a href={`tel:${person.phone}`} className="text-gray-900">
                        {person.phone}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Mobile</h3>
                      <a href={`tel:${person.mobile}`} className="text-gray-900">
                        {person.mobile}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Company</h3>
                      <a href={`/companies/${person.companyId}`} className="text-blue-600 hover:text-blue-800">
                        {person.company}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Department</h3>
                      <p className="text-gray-900">{person.department}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Location</h3>
                      <p className="text-gray-900">{person.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPinned className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Address</h3>
                      <p className="text-gray-900">{person.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Contacted</h3>
                    <p className="text-gray-900">{new Date(person.lastContacted).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Join Date</h3>
                    <p className="text-gray-900">{new Date(person.joineDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Birthday</h3>
                    <p className="text-gray-900">{new Date(person.birthday).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Social Profiles</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Linkedin className="h-5 w-5 text-blue-600 mr-2" />
                      <a href={`https://${person.linkedin}`} className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                        {person.linkedin}
                      </a>
                    </div>
                    
                    <div className="flex items-center">
                      <Twitter className="h-5 w-5 text-blue-400 mr-2" />
                      <a href={`https://twitter.com/${person.twitter.replace('@', '')}`} className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                        {person.twitter}
                      </a>
                    </div>
                    
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-gray-500 mr-2" />
                      <a href={`https://${person.website}`} className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                        {person.website}
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>Bio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{person.bio}</p>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest interactions with {person.name.split(' ')[0]}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative border-l border-gray-200">
                {interactionHistory.slice(0, 3).map((interaction) => (
                  <li key={interaction.id} className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-8 ring-white bg-white">
                      {getInteractionIcon(interaction.type)}
                    </span>
                    <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">
                      {interaction.title}
                    </h3>
                    <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                      {new Date(interaction.date).toLocaleDateString()} at {new Date(interaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                    <p className="text-gray-700">{interaction.notes}</p>
                  </li>
                ))}
              </ol>
              
              <div className="text-center mt-4">
                <Button 
                  variant="link" 
                  className="text-crm-blue"
                  onClick={() => setActiveTab('interactions')}
                >
                  View all interactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Interaction History</h2>
            <div className="flex space-x-2">
              <Button variant="outline" className="text-crm-blue border-crm-blue">
                <Mail className="mr-2 h-4 w-4" />
                Log Email
              </Button>
              <Button variant="outline" className="text-crm-green border-crm-green">
                <Phone className="mr-2 h-4 w-4" />
                Log Call
              </Button>
              <Button className="bg-crm-blue hover:bg-blue-600">
                <Calendar className="mr-2 h-4 w-4" />
                Log Meeting
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <ol className="relative border-l border-gray-200">
                {interactionHistory.map((interaction) => (
                  <li key={interaction.id} className="mb-8 ml-6">
                    <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-8 ring-white bg-white">
                      {getInteractionIcon(interaction.type)}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">
                        {interaction.title}
                        <span className={`ml-2 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${
                          interaction.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                          interaction.type === 'call' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {interaction.type}
                        </span>
                      </h3>
                      <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                        {new Date(interaction.date).toLocaleDateString()} at {new Date(interaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <p className="text-gray-700 mt-2">{interaction.notes}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
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
                </CardContent>
              </Card>
            ))}
            
            {tasksData.length === 0 && (
              <div className="text-center py-8">
                <ListTodo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
                <p className="text-gray-600 mt-1">Create a task to keep track of follow-ups and actions.</p>
              </div>
            )}
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
                  <div className="mt-3 text-sm text-gray-600">
                    <time dateTime={note.createdAt}>
                      {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {notesData.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No notes yet</h3>
                <p className="text-gray-600 mt-1">Add a note to keep track of important information.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonDetail;
