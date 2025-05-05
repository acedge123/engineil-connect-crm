import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  User, 
  Calendar, 
  FileText 
} from 'lucide-react';
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
  Separator,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui';

const CompanyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');

  // Mock data for demonstration
  const company = {
    id: id,
    name: 'EngineIL',
    industry: 'Technology',
    location: 'New York, NY',
    phone: '555-123-4567',
    email: 'info@engineil.com',
    website: 'www.engineil.com',
    description: 'EngineIL is a leading technology company specializing in innovative solutions for enterprise clients.',
    employees: 150,
    founded: new Date('2010-01-01'),
    contacts: [
      { id: '1', name: 'John Doe', title: 'CEO' },
      { id: '2', name: 'Jane Smith', title: 'Marketing Manager' },
    ],
    tasks: [
      { id: '1', title: 'Follow up with John Doe', dueDate: new Date() },
      { id: '2', title: 'Prepare marketing report', dueDate: new Date() },
    ],
    documents: [
      { id: '1', name: 'Company Profile.pdf' },
      { id: '2', name: 'Financial Report.pdf' },
    ],
  };

  if (!company) {
    return <div>Company not found</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-600">
            <Link to="/companies" className="text-blue-500 hover:underline">Companies</Link> / {company.name}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive">
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Details about {company.name}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Industry</p>
              <p className="text-gray-900">{company.industry}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Location</p>
              <p className="text-gray-900">
                <MapPin className="inline-block h-4 w-4 mr-1 align-middle" />
                {company.location}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Phone</p>
              <p className="text-gray-900">
                <Phone className="inline-block h-4 w-4 mr-1 align-middle" />
                {company.phone}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-gray-900">
                <Mail className="inline-block h-4 w-4 mr-1 align-middle" />
                {company.email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Website</p>
              <p className="text-gray-900">
                <Globe className="inline-block h-4 w-4 mr-1 align-middle" />
                <a href={`http://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {company.website}
                </a>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Founded</p>
              <p className="text-gray-900">{format(company.founded, 'MMMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Employees</p>
              <p className="text-gray-900">{company.employees}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Description</p>
            <p className="text-gray-900">{company.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({company.contacts.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({company.tasks.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({company.documents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>More in-depth information</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Additional details or metrics can be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Contacts</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
              <CardDescription>Key contacts at {company.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {company.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${contact.name}`} />
                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.title}</p>
                      </div>
                    </div>
                    <div>
                      <Link to={`/people/${contact.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Tasks</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
              <CardDescription>Tasks associated with {company.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {company.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium leading-none">{task.title}</p>
                      <p className="text-sm text-muted-foreground">Due: {format(task.dueDate, 'MMMM d, yyyy')}</p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Documents</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
              <CardDescription>Documents related to {company.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {company.documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium leading-none">{document.name}</p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyDetail;
