
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus, Search, Users, Phone, MapPin, Globe } from 'lucide-react';

// Mock data
const companyData = [
  {
    id: 1,
    name: 'Acme Corporation',
    industry: 'Technology',
    description: 'Leading provider of cloud solutions',
    employees: 250,
    website: 'acmecorp.com',
    phone: '+1 (555) 123-4567',
    address: '123 Tech Blvd, San Francisco, CA',
    logoColor: 'blue',
  },
  {
    id: 2,
    name: 'MediHealth Systems',
    industry: 'Healthcare',
    description: 'Healthcare technology and services',
    employees: 480,
    website: 'medihealth.com',
    phone: '+1 (555) 987-6543',
    address: '456 Medical Dr, Boston, MA',
    logoColor: 'green',
  },
  {
    id: 3,
    name: 'GlobalManufacturing Inc',
    industry: 'Manufacturing',
    description: 'Manufacturing and distribution of industrial equipment',
    employees: 1250,
    website: 'globalmfg.com',
    phone: '+1 (555) 456-7890',
    address: '789 Industry Way, Detroit, MI',
    logoColor: 'orange',
  },
  {
    id: 4,
    name: 'First National Bank',
    industry: 'Finance',
    description: 'Banking and financial services',
    employees: 870,
    website: 'firstnational.com',
    phone: '+1 (555) 567-8901',
    address: '101 Finance St, New York, NY',
    logoColor: 'purple',
  },
  {
    id: 5,
    name: 'EnergyWorks Ltd',
    industry: 'Energy',
    description: 'Renewable energy solutions',
    employees: 320,
    website: 'energyworks.com',
    phone: '+1 (555) 234-5678',
    address: '202 Power Ave, Houston, TX',
    logoColor: 'red',
  },
  {
    id: 6,
    name: 'RetailMart',
    industry: 'Retail',
    description: 'Consumer retail products and services',
    employees: 1600,
    website: 'retailmart.com',
    phone: '+1 (555) 345-6789',
    address: '303 Shopping Blvd, Chicago, IL',
    logoColor: 'indigo',
  },
];

const industriesList = [
  'All Industries',
  'Technology',
  'Healthcare',
  'Manufacturing',
  'Finance',
  'Energy',
  'Retail',
  'Transportation',
  'Education',
];

const Companies = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All Industries');

  const filteredCompanies = companyData.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === 'All Industries' || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const handleCompanyClick = (id: number) => {
    navigate(`/companies/${id}`);
  };

  const getLogoBackground = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'orange': return 'bg-orange-500';
      case 'purple': return 'bg-purple-500';
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
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600">Manage your business relationships</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            className="bg-crm-blue hover:bg-blue-600"
            onClick={() => navigate('/companies/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search companies..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select 
            value={industryFilter} 
            onValueChange={setIndustryFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by industry" />
            </SelectTrigger>
            <SelectContent>
              {industriesList.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Company List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <Card 
            key={company.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleCompanyClick(company.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start space-x-3">
                <div className={`w-12 h-12 rounded-md ${getLogoBackground(company.logoColor)} text-white flex items-center justify-center font-bold text-xl`}>
                  {getInitials(company.name)}
                </div>
                <div>
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  <CardDescription>{company.industry}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-gray-600 line-clamp-2">{company.description}</p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{company.employees} employees</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Globe className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{company.website}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{company.phone}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="truncate">{company.address}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="ghost" 
                className="w-full text-crm-blue"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/companies/${company.id}`);
                }}
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}

        {filteredCompanies.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No companies found</h3>
            <p className="text-gray-600 mt-1">Try adjusting your search or add a new company.</p>
            <Button 
              onClick={() => navigate('/companies/new')}
              variant="outline" 
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Companies;
