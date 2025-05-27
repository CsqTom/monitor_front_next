'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { request, ApiResponse } from '@/lib/api_user'; // 假设 api_user.ts 在 lib 目录下
import { PlusCircle, RefreshCw } from 'lucide-react'; // Updated import
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface RoleConfig {
  id: number;
  role: number;
  name: string;
  key: string;
  value: boolean;
  type_str: string;
}

interface RoleRecord {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  creator_id: number;
  configs: RoleConfig[];
}

interface RolesPageData {
  records: RoleRecord[];
  current: number;
  size: number;
  total: number;
  pages: number;
}

export default function Page() {
  const [rolesData, setRolesData] = useState<RolesPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<RolesPageData>({
        url: '/user/roles_page',
        method: 'GET',
      });
      if (response.data.code === 200 && response.data.data) {
        setRolesData(response.data.data);
      } else {
        setError(response.data.msg || 'Failed to fetch roles');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching roles');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleRefresh = () => {
    fetchRoles();
  };

  const handleNew = () => {
    // TODO: Implement new role functionality
    console.log('New role clicked');
  };

  if (loading) {
    return <div>Loading...</div>; // 可以替换为 Skeleton 组件
  }

  if (error) {
    return <div>Error: {error} <Button onClick={handleRefresh}>Retry</Button></div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Role Management</h1>
        <div className="space-x-2">
          <Button onClick={handleNew} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> New Role
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead>Creator ID</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rolesData?.records.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.id}</TableCell>
              <TableCell>{role.name}</TableCell>
              <TableCell>{new Date(role.created_at).toLocaleString()}</TableCell>
              <TableCell>{new Date(role.updated_at).toLocaleString()}</TableCell>
              <TableCell>{role.creator_id}</TableCell>
              <TableCell>
                <Sheet onOpenChange={(open) => !open && setSelectedRole(null)}>
                  <SheetTrigger asChild>
                    <Button variant="outline" onClick={() => setSelectedRole(role)}>Details</Button>
                  </SheetTrigger>
                  <SheetContent className="sm:max-w-[600px] w-full overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Role Details: {selectedRole?.name}</SheetTitle>
                    </SheetHeader>
                    {selectedRole && (
                      <div className="py-4 space-y-4">
                        <p><strong>ID:</strong> {selectedRole.id}</p>
                        <p><strong>Name:</strong> {selectedRole.name}</p>
                        <p><strong>Created At:</strong> {new Date(selectedRole.created_at).toLocaleString()}</p>
                        <p><strong>Updated At:</strong> {new Date(selectedRole.updated_at).toLocaleString()}</p>
                        <p><strong>Creator ID:</strong> {selectedRole.creator_id}</p>
                        <h3 className="text-lg font-semibold mt-4">Permissions:</h3>
                        <div className="space-y-3">
                          {selectedRole.configs.map((config) => (
                            <div key={config.key} className="flex items-center justify-between p-3 border rounded-md">
                              <div>
                                <p className="font-medium">{config.name}</p>
                                <p className="text-sm text-muted-foreground">Key: {config.key}</p>
                              </div>
                              {config.type_str === 'button' || config.type_str === 'menu' ? (
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`${config.key}-${config.id}`}
                                    checked={config.value}
                                    // onCheckedChange={(checked) => handlePermissionChange(selectedRole.id, config.key, checked)}
                                    // disabled // Depending on whether these are editable here
                                  />
                                  <Label htmlFor={`${config.key}-${config.id}`}>{config.value ? 'Enabled' : 'Disabled'}</Label>
                                </div>
                              ) : (
                                <p>{String(config.value)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <SheetClose asChild>
                       {/* <Button type="submit">Save changes</Button> */}
                    </SheetClose>
                  </SheetContent>
                </Sheet>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* TODO: Add pagination if necessary based on rolesData.total and rolesData.size */}
    </div>
  );
}
