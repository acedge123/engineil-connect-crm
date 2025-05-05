import React, { useState } from 'react';
import { 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Tag, 
  Search, 
  MoreHorizontal, 
  Trash, 
  Edit, 
  Copy, 
  Calendar as CalendarIcon,
  User,
  Building,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
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
  Badge,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

const Tasks = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Follow up with John Doe',
      dueDate: new Date('2024-08-15'),
      status: 'Open',
      priority: 'High',
      company: 'Acme Corp',
      contact: 'John Doe',
    },
    {
      id: 2,
      title: 'Prepare proposal for Company B',
      dueDate: new Date('2024-07-22'),
      status: 'In Progress',
      priority: 'Medium',
      company: 'Beta Industries',
      contact: 'Jane Smith',
    },
    {
      id: 3,
      title: 'Send contract to Company C',
      dueDate: new Date('2024-07-29'),
      status: 'Completed',
      priority: 'Low',
      company: 'Gamma Solutions',
      contact: 'Mike Johnson',
    },
  ]);

  const [filters, setFilters] = useState({
    status: 'All',
    priority: 'All',
  });

  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'All' && task.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'All' && task.priority !== filters.priority) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-600">Manage and track your tasks</p>
      </div>

      {/* Task Management Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 w-full">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="inProgress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        {/* All Tasks Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>All Tasks</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input type="text" placeholder="Search tasks..." className="md:w-64" />
                  <Button><Search className="h-4 w-4 mr-2" />Search</Button>
                </div>
              </div>
              <CardDescription>Overview of all tasks in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-4 flex items-center space-x-4">
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Task List */}
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Title</th>
                      <th scope="col" className="px-6 py-3">Due Date</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Priority</th>
                      <th scope="col" className="px-6 py-3">Company</th>
                      <th scope="col" className="px-6 py-3">Contact</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => (
                      <tr key={task.id} className="bg-white border-b">
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {task.title}
                        </th>
                        <td className="px-6 py-4">{format(task.dueDate, 'MM/dd/yyyy')}</td>
                        <td className="px-6 py-4">{task.status}</td>
                        <td className="px-6 py-4">{task.priority}</td>
                        <td className="px-6 py-4">{task.company}</td>
                        <td className="px-6 py-4">{task.contact}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" />Edit</Button>
                            <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50"><Trash className="h-4 w-4 mr-2" />Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Open Tasks Tab */}
        <TabsContent value="open">
          <Card>
            <CardHeader>
              <CardTitle>Open Tasks</CardTitle>
              <CardDescription>Tasks that are currently open</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content for Open Tasks tab</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* In Progress Tasks Tab */}
        <TabsContent value="inProgress">
          <Card>
            <CardHeader>
              <CardTitle>In Progress Tasks</CardTitle>
              <CardDescription>Tasks that are currently in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content for In Progress Tasks tab</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Tasks Tab */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks</CardTitle>
              <CardDescription>Tasks that have been completed</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content for Completed Tasks tab</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tasks Tab */}
        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Tasks</CardTitle>
              <CardDescription>Tasks that are overdue</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content for Overdue Tasks tab</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tasks;
