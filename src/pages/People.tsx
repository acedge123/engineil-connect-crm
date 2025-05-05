
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Plus, Search, Mail, Phone, Building2 } from 'lucide-react';

// Mock data for people
const peopleData = [
  {
    id: 1,
    name: 'John Smith',
    position: 'Chief Executive Officer',
    company: 'Acme Corporation',
    companyId: 1,
    email: 'john.smith@acmecorp.com',
    phone: '+1 (555) 123-4567',
    department: 'Executive',
    location: 'San Francisco, CA',
    avatarColor: 'blue',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    position: 'Chief Technology Officer',
    company: 'Acme Corporation',
    companyId: 1,
    email: 'sarah.johnson@acmecorp.com',
    phone: '+1 (555) 987-6543',
    department: 'Technology',
    location: 'San Francisco, CA',
    avatarColor: 'purple',
  },
  {
    id: 3,
    name: 'Michael Chen',
    position: 'VP of Sales',
    company: 'Acme Corporation',
    companyId: 1,
    email: 'michael.chen@acmecorp.com',
    phone: '+1 (555) 456-7890',
    department: 'Sales',
    location: 'New York, NY',
    avatarColor: 'green',
  },
  {
    id: 4,
    name: 'Emily Wilson',
    position: 'Marketing Director',
    company: 'Acme Corporation',
    companyId: 1,
    email: 'emily.wilson@acmecorp.com',
    phone: '+1 (555) 234-5678',
    department: 'Marketing',
    location: 'Chicago, IL',
    avatarColor: 'orange',
  },
  {
    id: 5,
    name: 'David Rodriguez',
    position: 'Chief Financial Officer',
    company: 'MediHealth Systems',
    companyId: 2,
    email: 'david.rodriguez@medihealth.com',
    phone: '+1 (555) 876-5432',
    department: 'Finance',
    location: 'Boston, MA',
    avatarColor: 'red',
  },
  {
    id: 6,
    name: 'Lisa Kim',
    position: 'Head of Research',
    company: 'MediHealth Systems',
    companyId: 2,
    email: 'lisa.kim@medihealth.com',
    phone: '+1 (555) 345-6789',
    department: 'Research',
    location: 'Boston, MA',
    avatarColor: 'indigo',
  },
  {
    id: 7,
    name: 'Robert Taylor',
    position: 'Operations Manager',
    company: 'GlobalManufacturing Inc',
    companyId: 3,
    email: 'robert.taylor@globalmfg.com',
    phone: '+1 (555) 567-8901',
    department: 'Operations',
    location: 'Detroit, MI',
    avatarColor: 'blue',
  },
  {
    id: 8,
    name: 'Jennifer Lopez',
    position: 'HR Director',
    company: 'First National Bank',
    companyId: 4,
    email: 'jennifer.lopez@firstnational.com',
    phone: '+1 (555) 678-9012',
    department: 'Human Resources',
    location: 'New York, NY',
    avatarColor: 'green',
  },
];

// Company list
const companiesList = [
  { id: 0, name: 'All Companies' },
  { id: 1, name: 'Acme Corporation' },
  { id: 2, name: 'MediHealth Systems' },
  { id: 3, name: 'GlobalManufacturing Inc' },
  { id: 4, name: 'First National Bank' },
  { id: 5, name: 'EnergyWorks Ltd' },
  { id: 6, name: 'RetailMart' },
];

const departmentsList = [
  'All Departments',
  'Executive',
  'Technology',
  'Sales',
  'Marketing',
  'Finance',
  'Operations',
  'Research',
  'Human Resources',
];

const People = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('0');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');

  const filteredPeople = peopleData.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          person.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          person.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = companyFilter === '0' || person.companyId === parseInt(companyFilter);
    const matchesDepartment = departmentFilter === 'All Departments' || person.department === departmentFilter;
    return matchesSearch && matchesCompany && matchesDepartment;
  });

  const handlePersonClick = (id: number) => {
    navigate(`/people/${id}`);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-gray-600">Manage your contacts</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            className="bg-crm-blue hover:bg-blue-600"
            onClick={() => navigate('/people/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Person
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search people..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-48">
          <Select 
            value={companyFilter} 
            onValueChange={setCompanyFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by company" />
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
        
        <div className="w-full sm:w-48">
          <Select 
            value={departmentFilter} 
            onValueChange={setDepartmentFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              {departmentsList.map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* People List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPeople.map((person) => (
          <Card 
            key={person.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handlePersonClick(person.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-full ${getAvatarBackground(person.avatarColor)} text-white flex items-center justify-center font-medium text-lg`}>
                  {getInitials(person.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{person.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{person.position}</p>
                  <p className="text-sm text-gray-600 truncate">{person.company}</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <a 
                    href={`mailto:${person.email}`} 
                    className="text-blue-600 hover:text-blue-800 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {person.email}
                  </a>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <a 
                    href={`tel:${person.phone}`} 
                    className="text-gray-900"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {person.phone}
                  </a>
                </div>
                <div className="flex items-center text-sm">
                  <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600 truncate">
                    {person.department} • {person.location}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPeople.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No people found</h3>
            <p className="text-gray-600 mt-1">Try adjusting your search or add a new person.</p>
            <Button 
              onClick={() => navigate('/people/new')}
              variant="outline" 
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default People;
