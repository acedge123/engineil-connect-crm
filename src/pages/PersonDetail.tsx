import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Edit, 
  Trash, 
  Phone, 
  Mail, 
  Linkedin, 
  MapPin,
  Calendar, 
  Building, 
  FileText, 
  User, 
  Briefcase 
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

const PersonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');

  // Mock data for demonstration
  const person = {
    id: id,
    name: 'John Doe',
    title: 'CEO',
    company: 'Acme Corp',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    linkedin: 'linkedin.com/in/johndoe',
    location: 'New York, NY',
    tasks: [
      { id: '1', title: 'Follow up email', dueDate: new Date() },
      { id: '2', title: 'Schedule meeting', dueDate: new Date() },
    ],
    notes: 'This is a very important contact. Make sure to follow up regularly.',
    createdAt: new Date(),
  };

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{person.name}</h1>
          <p className="text-gray-600">{person.title} at <Link to={`/companies/${id}`} className="text-blue-500 hover:underline">{person.company}</Link></p>
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

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p><a href={`mailto:${person.email}`} className="text-blue-500 hover:underline">{person.email}</a></p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p>{person.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">LinkedIn</p>
                  <p><a href={person.linkedin} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">linkedin.com</a></p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p>{person.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Company</p>
                  <p><Link to={`/companies/${id}`} className="text-blue-500 hover:underline">{person.company}</Link></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>More details about this contact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">Created At</p>
                <p>{format(person.createdAt, 'MMMM dd, yyyy')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>List of tasks associated with this contact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {person.tasks.length > 0 ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3">Title</th>
                        <th scope="col" className="px-6 py-3">Due Date</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {person.tasks.map(task => (
                        <tr key={task.id} className="bg-white border-b">
                          <td className="px-6 py-4">{task.title}</td>
                          <td className="px-6 py-4">{format(task.dueDate, 'MMMM dd, yyyy')}</td>
                          <td className="px-6 py-4">
                            <Button variant="outline" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No tasks associated with this contact.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Important notes about this contact</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{person.notes}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonDetail;
