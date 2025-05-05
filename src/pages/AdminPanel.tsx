
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { toast } from "sonner";
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Settings, 
  Shield,
  Database,
  Bell,
  BarChart3,
  FileText,
  Upload,
  Save,
  RefreshCw,
  CheckCircle2,
  UserPlus,
  DownloadCloud,
} from 'lucide-react';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      toast.error('You do not have permission to access the admin panel');
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  const handleGenerateBackup = () => {
    toast.success('Backup initiated');
  };

  const handleRestoreData = () => {
    toast.success('Data restore started');
  };

  const handleImportData = () => {
    toast.success('Data import initiated');
  };

  const handleExportData = () => {
    toast.success('Data export started');
  };

  const handleAddUser = () => {
    toast.success('User invited successfully');
  };

  if (!isAdmin) {
    return null; // Return null while redirecting
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">System administration and configuration</p>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 w-full">
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Data Management
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <RefreshCw className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Save className="h-4 w-4 mr-2" />
            Backup & Restore
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">General Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="company-name" className="text-sm font-medium">Company Name</label>
                    <Input id="company-name" defaultValue="EngineIL Connect CRM" />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="timezone" className="text-sm font-medium">Default Timezone</label>
                    <Select defaultValue="America/New_York">
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="date-format" className="text-sm font-medium">Date Format</label>
                    <Select defaultValue="MM/DD/YYYY">
                      <SelectTrigger id="date-format">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="currency" className="text-sm font-medium">Default Currency</label>
                    <Select defaultValue="USD">
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                        <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                        <SelectItem value="AUD">Australian Dollar (AUD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="task-reminder" className="text-sm font-medium">Task Reminder Time</label>
                    <Select defaultValue="1">
                      <SelectTrigger id="task-reminder">
                        <SelectValue placeholder="Select reminder time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">At due time</SelectItem>
                        <SelectItem value="1">1 hour before</SelectItem>
                        <SelectItem value="2">2 hours before</SelectItem>
                        <SelectItem value="24">1 day before</SelectItem>
                        <SelectItem value="48">2 days before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email-notifications" className="text-sm font-medium">Email Notifications</label>
                    <Select defaultValue="all">
                      <SelectTrigger id="email-notifications">
                        <SelectValue placeholder="Select notification level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All notifications</SelectItem>
                        <SelectItem value="important">Important only</SelectItem>
                        <SelectItem value="digest">Daily digest</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveSettings} className="bg-crm-blue hover:bg-blue-600">
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                <Button className="mt-3 sm:mt-0 bg-crm-blue hover:bg-blue-600" onClick={handleAddUser}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">User</th>
                      <th scope="col" className="px-6 py-3">Email</th>
                      <th scope="col" className="px-6 py-3">Role</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white border-b">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        Admin User
                      </td>
                      <td className="px-6 py-4">admin@engineil.ing</td>
                      <td className="px-6 py-4">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                      </td>
                    </tr>
                    <tr className="bg-white border-b">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        Regular User
                      </td>
                      <td className="px-6 py-4">user@engineil.ing</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          User
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">Deactivate</Button>
                      </td>
                    </tr>
                    <tr className="bg-white border-b">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        Sarah Johnson
                      </td>
                      <td className="px-6 py-4">sarah.johnson@engineil.ing</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          User
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">Deactivate</Button>
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        Michael Davis
                      </td>
                      <td className="px-6 py-4">michael.davis@engineil.ing</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          User
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          Invited
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="outline" size="sm" className="mr-2">Resend</Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">Cancel</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Import, export, and manage system data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Import Data</CardTitle>
                    <CardDescription>Upload data from CSV or Excel files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Select defaultValue="companies">
                        <SelectTrigger>
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="companies">Companies</SelectItem>
                          <SelectItem value="contacts">Contacts</SelectItem>
                          <SelectItem value="industries">Industries</SelectItem>
                          <SelectItem value="tasks">Tasks</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600">
                          Drag and drop your file here, or 
                          <span className="text-blue-600 hover:text-blue-800 cursor-pointer"> browse</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Supports CSV, XLS, XLSX (max 10MB)</p>
                      </div>
                      
                      <Button className="w-full" onClick={handleImportData}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Export Data</CardTitle>
                    <CardDescription>Download data in various formats</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder="Select data to export" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Data</SelectItem>
                          <SelectItem value="companies">Companies Only</SelectItem>
                          <SelectItem value="contacts">Contacts Only</SelectItem>
                          <SelectItem value="tasks">Tasks Only</SelectItem>
                          <SelectItem value="activities">Activities Only</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select defaultValue="csv">
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <input type="checkbox" id="include-metadata" className="rounded text-crm-blue mr-2" />
                          <label htmlFor="include-metadata" className="text-sm text-gray-700">Include metadata</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="compress" className="rounded text-crm-blue mr-2" />
                          <label htmlFor="compress" className="text-sm text-gray-700">Compress (ZIP)</label>
                        </div>
                      </div>
                      
                      <Button className="w-full" onClick={handleExportData}>
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        Export Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Data Cleanup</CardTitle>
                  <CardDescription>Clean and optimize your CRM data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" className="justify-start">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        Find Duplicates
                      </Button>
                      
                      <Button variant="outline" className="justify-start">
                        <RefreshCw className="mr-2 h-4 w-4 text-orange-600" />
                        Update Stale Records
                      </Button>
                      
                      <Button variant="outline" className="justify-start text-red-600">
                        <Settings className="mr-2 h-4 w-4" />
                        Purge Inactive Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>System Integrations</CardTitle>
              <CardDescription>Connect with third-party services and data sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Email Integration</CardTitle>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">Connect your email account to track communications with contacts.</p>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">G</div>
                          <span className="ml-2 font-medium">Google Workspace</span>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white">O</div>
                          <span className="ml-2 font-medium">Microsoft 365</span>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Calendar Integration</CardTitle>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Setup Required</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">Sync your calendar with the CRM to manage meetings and events.</p>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">G</div>
                          <span className="ml-2 font-medium">Google Calendar</span>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white">O</div>
                          <span className="ml-2 font-medium">Outlook Calendar</span>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Web Intelligence</CardTitle>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Available</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">Automatically enrich contact and company data from web sources.</p>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white">Li</div>
                          <span className="ml-2 font-medium">LinkedIn Integration</span>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white">WI</div>
                          <span className="ml-2 font-medium">Web Intelligence API</span>
                        </div>
                        <Button variant="outline" size="sm">Enable</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Notification Channels</CardTitle>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">Configure where and how you receive system notifications.</p>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">E</div>
                          <span className="ml-2 font-medium">Email Notifications</span>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">S</div>
                          <span className="ml-2 font-medium">SMS Notifications</span>
                        </div>
                        <Button variant="outline" size="sm">Enable</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore Tab */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Manage system backups and data restoration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Backup System</CardTitle>
                    <CardDescription>Create backups of your CRM data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="backup-name" className="text-sm font-medium">Backup Name</label>
                        <Input id="backup-name" placeholder="e.g., Full Backup May 2025" />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Backup Options</label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input type="checkbox" id="backup-all" className="rounded text-crm-blue mr-2" defaultChecked />
                            <label htmlFor="backup-all" className="text-sm text-gray-700">All data</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="backup-files" className="rounded text-crm-blue mr-2" defaultChecked />
                            <label htmlFor="backup-files" className="text-sm text-gray-700">Include attached files</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="backup-settings" className="rounded text-crm-blue mr-2" defaultChecked />
                            <label htmlFor="backup-settings" className="text-sm text-gray-700">Include system settings</label>
                          </div>
                        </div>
                      </div>
                      
                      <Button className="w-full" onClick={handleGenerateBackup}>
                        <Save className="mr-2 h-4 w-4" />
                        Generate Backup
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Restore System</CardTitle>
                    <CardDescription>Restore from a previous backup</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="restore-source" className="text-sm font-medium">Select Backup</label>
                        <Select>
                          <SelectTrigger id="restore-source">
                            <SelectValue placeholder="Select a backup" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto-20250505">Auto Backup - May 5, 2025</SelectItem>
                            <SelectItem value="auto-20250501">Auto Backup - May 1, 2025</SelectItem>
                            <SelectItem value="manual-20250428">Manual Backup - April 28, 2025</SelectItem>
                            <SelectItem value="auto-20250425">Auto Backup - April 25, 2025</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Restore Options</label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input type="radio" id="restore-all" name="restore-option" className="rounded-full text-crm-blue mr-2" defaultChecked />
                            <label htmlFor="restore-all" className="text-sm text-gray-700">Complete restore (overwrites all data)</label>
                          </div>
                          <div className="flex items-center">
                            <input type="radio" id="restore-merge" name="restore-option" className="rounded-full text-crm-blue mr-2" />
                            <label htmlFor="restore-merge" className="text-sm text-gray-700">Merge with existing data</label>
                          </div>
                          <div className="flex items-center">
                            <input type="radio" id="restore-selective" name="restore-option" className="rounded-full text-crm-blue mr-2" />
                            <label htmlFor="restore-selective" className="text-sm text-gray-700">Selective restore (choose modules)</label>
                          </div>
                        </div>
                      </div>
                      
                      <Button className="w-full bg-yellow-600 hover:bg-yellow-700" onClick={handleRestoreData}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restore System
                      </Button>
                      
                      <p className="text-xs text-red-600 text-center">
                        Warning: Restoration will temporarily lock the system and may overwrite existing data.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Backup History</CardTitle>
                  <CardDescription>View and manage previous backups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-700">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Backup Name</th>
                          <th scope="col" className="px-6 py-3">Date</th>
                          <th scope="col" className="px-6 py-3">Size</th>
                          <th scope="col" className="px-6 py-3">Type</th>
                          <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white border-b">
                          <td className="px-6 py-4 font-medium text-gray-900">Auto Backup - May 5, 2025</td>
                          <td className="px-6 py-4">05/05/2025 03:00 AM</td>
                          <td className="px-6 py-4">42.3 MB</td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Automatic
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button variant="outline" size="sm" className="mr-2">Download</Button>
                            <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">Delete</Button>
                          </td>
                        </tr>
                        <tr className="bg-white border-b">
                          <td className="px-6 py-4 font-medium text-gray-900">Auto Backup - May 1, 2025</td>
                          <td className="px-6 py-4">05/01/2025 03:00 AM</td>
                          <td className="px-6 py-4">41.8 MB</td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Automatic
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button variant="outline" size="sm" className="mr-2">Download</Button>
                            <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">Delete</Button>
                          </td>
                        </tr>
                        <tr className="bg-white border-b">
                          <td className="px-6 py-4 font-medium text-gray-900">Manual Backup - April 28, 2025</td>
                          <td className="px-6 py-4">04/28/2025 11:25 AM</td>
                          <td className="px-6 py-4">40.5 MB</td>
                          <td className="px-6 py-4">
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                              Manual
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button variant="outline" size="sm" className="mr-2">Download</Button>
                            <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">Delete</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
