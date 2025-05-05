
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/';
import { Calendar as CalendarIcon, Search, Plus, CheckCircle2, Clock, Calendar, ArrowUp, ArrowDown, User, Building2 } from 'lucide-react';
import { toast } from "sonner";

// Mock tasks data
const initialTasks = [
  {
    id: 1,
    title: 'Follow up on cloud migration proposal',
    dueDate: '2025-05-15',
    status: 'pending',
    assignee: 'You',
    priority: 'high',
    company: 'Acme Corporation',
    companyId: 1,
    person: 'John Smith',
    personId: 1,
    description: 'Send a follow-up email regarding the cloud migration proposal we discussed in our last meeting.',
    createdAt: '2025-05-01',
  },
  {
    id: 2,
    title: 'Schedule quarterly business review',
    dueDate: '2025-05-20',
    status: 'in-progress',
    assignee: 'Sarah Johnson',
    priority: 'medium',
    company: 'Acme Corporation',
    companyId: 1,
    person: 'Sarah Johnson',
    personId: 2,
    description: 'Coordinate with Sarah to schedule the quarterly business review with all stakeholders.',
    createdAt: '2025-05-02',
  },
  {
    id: 3,
    title: 'Send updated pricing information',
    dueDate: '2025-05-12',
    status: 'completed',
    assignee: 'You',
    priority: 'low',
    company: 'MediHealth Systems',
    companyId: 2,
    person: 'David Rodriguez',
    personId: 5,
    description: 'Send the updated pricing information for the enterprise plan to David.',
    createdAt: '2025-05-01',
    completedAt: '2025-05-08',
  },
  {
    id: 4,
    title: 'Research new product offerings',
    dueDate: '2025-05-30',
    status: 'pending',
    assignee: 'You',
    priority: 'medium',
    company: 'GlobalManufacturing Inc',
    companyId: 3,
    person: 'Robert Taylor',
    personId: 7,
    description: 'Research and prepare a presentation on new product offerings that would benefit GlobalManufacturing.',
    createdAt: '2025-05-03',
  },
  {
    id: 5,
    title: 'Prepare contract renewal documents',
    dueDate: '2025-06-15',
    status: 'pending',
    assignee: 'Jennifer Lopez',
    priority: 'high',
    company: 'First National Bank',
    companyId: 4,
    person: 'Jennifer Lopez',
    personId: 8,
    description: 'Prepare and review all contract renewal documents for the upcoming meeting.',
    createdAt: '2025-05-05',
  },
  {
    id: 6,
    title: 'Customer satisfaction survey followup',
    dueDate: '2025-05-25',
    status: 'in-progress',
    assignee: 'You',
    priority: 'medium',
    company: 'EnergyWorks Ltd',
    companyId: 5,
    person: null,
    personId: null,
    description: 'Follow up on the customer satisfaction survey results and prepare an action plan.',
    createdAt: '2025-05-07',
  },
  {
    id: 7,
    title: 'Set up demo for new retail analytics solution',
    dueDate: '2025-06-05',
    status: 'pending',
    assignee: 'You',
    priority: 'high',
    company: 'RetailMart',
    companyId: 6,
    person: null,
    personId: null,
    description: 'Coordinate with the product team to set up a demo of our new retail analytics solution.',
    createdAt: '2025-05-10',
  },
  {
    id: 8,
    title: 'Sales pipeline review',
    dueDate: '2025-05-18',
    status: 'completed',
    assignee: 'Michael Chen',
    priority: 'high',
    company: 'Acme Corporation',
    companyId: 1,
    person: 'Michael Chen',
    personId: 3,
    description: 'Review the current sales pipeline and identify potential bottlenecks.',
    createdAt: '2025-05-01',
    completedAt: '2025-05-17',
  },
];

const companiesList = [
  { id: 0, name: 'All Companies' },
  { id: 1, name: 'Acme Corporation' },
  { id: 2, name: 'MediHealth Systems' },
  { id: 3, name: 'GlobalManufacturing Inc' },
  { id: 4, name: 'First National Bank' },
  { id: 5, name: 'EnergyWorks Ltd' },
  { id: 6, name: 'RetailMart' },
];

const Tasks = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('0');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    status: 'pending',
    assignee: 'You',
    priority: 'medium',
    company: '',
    companyId: 0,
    person: '',
    personId: null,
    description: '',
  });

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      // Filter by search term
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (task.company && task.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (task.person && task.person.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by status (tab)
      const matchesStatus = activeTab === 'all' || 
                           (activeTab === 'pending' && task.status === 'pending') ||
                           (activeTab === 'in-progress' && task.status === 'in-progress') ||
                           (activeTab === 'completed' && task.status === 'completed');
      
      // Filter by company
      const matchesCompany = companyFilter === '0' || task.companyId === parseInt(companyFilter);
      
      // Filter by priority
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesCompany && matchesPriority;
    });
  };

  const filteredTasks = getFilteredTasks();

  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!newTask.dueDate) {
      toast.error('Due date is required');
      return;
    }

    const newTaskWithId = {
      id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      ...newTask,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTasks([newTaskWithId, ...tasks]);
    setNewTask({
      title: '',
      dueDate: '',
      status: 'pending',
      assignee: 'You',
      priority: 'medium',
      company: '',
      companyId: 0,
      person: '',
      personId: null,
      description: '',
    });
    setIsAddDialogOpen(false);
    toast.success('Task added successfully');
  };

  const handleToggleTaskStatus = (taskId: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        const updatedTask = { 
          ...task, 
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
        };
        
        if (newStatus === 'completed') {
          toast.success('Task marked as completed');
        }
        
        return updatedTask;
      }
      return task;
    }));
  };

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <ArrowUp className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <ArrowUp className="h-4 w-4 text-orange-600" />;
      case 'low':
        return <ArrowDown className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage your to-do list and action items</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-crm-blue hover:bg-blue-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  {companiesList.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search tasks..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Task Lists */}
          <TabsContent value="all" className="space-y-4">
            <TaskList 
              tasks={filteredTasks} 
              onToggleStatus={handleToggleTaskStatus} 
              getStatusClass={getStatusClass}
              getPriorityClass={getPriorityClass}
              getPriorityIcon={getPriorityIcon}
            />
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            <TaskList 
              tasks={filteredTasks} 
              onToggleStatus={handleToggleTaskStatus}
              getStatusClass={getStatusClass}
              getPriorityClass={getPriorityClass}
              getPriorityIcon={getPriorityIcon}
            />
          </TabsContent>
          
          <TabsContent value="in-progress" className="space-y-4">
            <TaskList 
              tasks={filteredTasks} 
              onToggleStatus={handleToggleTaskStatus}
              getStatusClass={getStatusClass}
              getPriorityClass={getPriorityClass}
              getPriorityIcon={getPriorityIcon}
            />
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            <TaskList 
              tasks={filteredTasks} 
              onToggleStatus={handleToggleTaskStatus}
              getStatusClass={getStatusClass}
              getPriorityClass={getPriorityClass}
              getPriorityIcon={getPriorityIcon}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task or action item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Task Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g., Follow up with client"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({...newTask, priority: value})}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium">
                  Company
                </label>
                <Select
                  value={newTask.companyId.toString()}
                  onValueChange={(value) => {
                    const companyId = parseInt(value);
                    const company = companiesList.find(c => c.id === companyId)?.name || '';
                    setNewTask({...newTask, companyId, company});
                  }}
                >
                  <SelectTrigger id="company">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companiesList.filter(c => c.id > 0).map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="assignee" className="text-sm font-medium">
                  Assignee
                </label>
                <Select
                  value={newTask.assignee}
                  onValueChange={(value) => setNewTask({...newTask, assignee: value})}
                >
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="You">Me</SelectItem>
                    <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="Michael Chen">Michael Chen</SelectItem>
                    <SelectItem value="Jennifer Lopez">Jennifer Lopez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add details about this task..."
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask} className="bg-crm-blue hover:bg-blue-600">
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for task list
const TaskList = ({ 
  tasks, 
  onToggleStatus,
  getStatusClass,
  getPriorityClass,
  getPriorityIcon
}: { 
  tasks: any[], 
  onToggleStatus: (id: number) => void,
  getStatusClass: (status: string) => string,
  getPriorityClass: (priority: string) => string,
  getPriorityIcon: (priority: string) => React.ReactNode
}) => {
  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'completed' && new Date(dueDate) < new Date();
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
        <p className="text-gray-600 mt-1">Add a new task or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className={`hover:shadow-sm transition-shadow ${task.status === 'completed' ? 'bg-gray-50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                <input 
                  type="checkbox" 
                  className="rounded text-crm-blue" 
                  checked={task.status === 'completed'}
                  onChange={() => onToggleStatus(task.id)}
                />
              </div>
              
              <div className="ml-3 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap items-center mt-1 gap-2">
                      <div className={`px-2 py-0.5 rounded-full text-xs ${getStatusClass(task.status)}`}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs flex items-center ${getPriorityClass(task.priority)}`}>
                        {getPriorityIcon(task.priority)}
                        <span className="ml-1">{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                      </div>
                      {isOverdue(task.dueDate, task.status) && (
                        <div className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                          Overdue
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 sm:mt-0">
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : ''}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      {task.status === 'completed' && task.completedAt && (
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                          <span>{new Date(task.completedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {task.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {task.description}
                  </p>
                )}
                
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1 text-gray-500" />
                    <span>{task.assignee}</span>
                  </div>
                  
                  {task.company && (
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1 text-gray-500" />
                      <a href={`/companies/${task.companyId}`} className="text-blue-600 hover:text-blue-800">
                        {task.company}
                      </a>
                    </div>
                  )}
                  
                  {task.person && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-500" />
                      <a href={`/people/${task.personId}`} className="text-blue-600 hover:text-blue-800">
                        {task.person}
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                    <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Tasks;
