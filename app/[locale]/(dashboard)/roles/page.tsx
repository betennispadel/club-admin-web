'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import {
  getClubCollection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from '@/lib/firebase/firestore';
import { Role, Permissions, defaultPermissions } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Loader2,
  ChevronRight,
  Users,
  Settings,
  Save,
} from 'lucide-react';

export default function RolesPage() {
  const t = useTranslations('roles');
  const tPerms = useTranslations('roles.permissionLabels');
  const { selectedClub } = useClubStore();
  const { hasPermission } = useAuthStore();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPermissions, setFormPermissions] = useState<Permissions>({ ...defaultPermissions });
  const [formPriceMultiplier, setFormPriceMultiplier] = useState('1.0');
  const [saving, setSaving] = useState(false);

  // Check permission
  const canManageRoles = hasPermission('roles');

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      if (!selectedClub) return;

      try {
        const rolesRef = getClubCollection(selectedClub.id, 'roles');
        const snapshot = await getDocs(rolesRef);

        const rolesData: Role[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.id,
          permissions: { ...defaultPermissions, ...doc.data().permissions },
          iconName: doc.data().iconName || 'person',
          priceMultiplier: doc.data().priceMultiplier || 1.0,
        }));

        setRoles(rolesData);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error('Failed to load roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [selectedClub]);

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormName(role.name);
    setFormPermissions({ ...role.permissions });
    setFormPriceMultiplier((role.priceMultiplier || 1.0).toString());
    setIsEditModalOpen(true);
  };

  const openAddModal = () => {
    setFormName('');
    setFormPermissions({ ...defaultPermissions });
    setFormPriceMultiplier('1.0');
    setIsAddModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedClub || !selectedRole) return;

    setSaving(true);
    try {
      const rolesRef = getClubCollection(selectedClub.id, 'roles');
      const roleRef = doc(rolesRef, selectedRole.id);

      await updateDoc(roleRef, {
        permissions: formPermissions,
        priceMultiplier: parseFloat(formPriceMultiplier) || 1.0,
      });

      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id
            ? {
                ...r,
                permissions: formPermissions,
                priceMultiplier: parseFloat(formPriceMultiplier) || 1.0,
              }
            : r
        )
      );

      toast.success('Role updated successfully');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedClub || !formName.trim()) return;

    // Check if role already exists
    if (roles.some((r) => r.id.toLowerCase() === formName.toLowerCase())) {
      toast.error('Role already exists');
      return;
    }

    setSaving(true);
    try {
      const rolesRef = getClubCollection(selectedClub.id, 'roles');
      const roleRef = doc(rolesRef, formName);

      await setDoc(roleRef, {
        permissions: formPermissions,
        priceMultiplier: parseFloat(formPriceMultiplier) || 1.0,
        iconName: 'person',
      });

      setRoles((prev) => [
        ...prev,
        {
          id: formName,
          name: formName,
          permissions: formPermissions,
          priceMultiplier: parseFloat(formPriceMultiplier) || 1.0,
        },
      ]);

      toast.success('Role created successfully');
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedClub || !roleToDelete) return;

    setSaving(true);
    try {
      const rolesRef = getClubCollection(selectedClub.id, 'roles');
      const roleRef = doc(rolesRef, roleToDelete.id);

      await deleteDoc(roleRef);

      setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
      toast.success('Role deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    } finally {
      setSaving(false);
      setRoleToDelete(null);
    }
  };

  const togglePermission = (key: keyof Permissions) => {
    setFormPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Group permissions by category
  const permissionGroups = {
    management: [
      'usersManagement',
      'reservationsManagement',
      'courtManagements',
      'roles',
      'myClubManager',
    ],
    sports: [
      'tournamentsManagement',
      'privateLessonArea',
      'teamManagement',
      'teamPerformance',
      'gameCenter',
      'trainingPool',
    ],
    finance: [
      'financialManagements',
      'walletManagements',
      'employeeSalaryManagement',
      'mealCardManagement',
      'payManagement',
      'discountManagement',
    ],
    content: [
      'restaurantManagement',
      'storeManagement',
      'magazineManagement',
      'sliderManagement',
      'notificationsManagement',
      'adsManagement',
      'problemManagement',
    ],
    settings: [
      'localeSettings',
      'apiManagement',
      'occupancyManagement',
    ],
    userAccess: [
      'uyeler',
      'reservationPage',
      'tournamentPage',
      'transferAccess',
      'addBalanceAccess',
      'payAccess',
      'memberMessage',
      'aiChatAssistant',
    ],
  };

  const PermissionsForm = () => (
    <ScrollArea className="h-[60vh] pr-4">
      <div className="space-y-6">
        {/* Role Name (only for add) */}
        {isAddModalOpen && (
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name</Label>
            <Input
              id="roleName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter role name"
            />
          </div>
        )}

        {/* Price Multiplier */}
        <div className="space-y-2">
          <Label htmlFor="priceMultiplier">{t('priceMultiplier')}</Label>
          <Input
            id="priceMultiplier"
            type="number"
            step="0.1"
            min="0"
            value={formPriceMultiplier}
            onChange={(e) => setFormPriceMultiplier(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            1.0 = normal price, 1.2 = +20%, 0.8 = -20%
          </p>
        </div>

        <Separator />

        {/* Permissions */}
        <div>
          <h4 className="font-semibold mb-4">{t('permissions')}</h4>

          {Object.entries(permissionGroups).map(([group, permissions]) => (
            <div key={group} className="mb-6">
              <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {group}
              </h5>
              <div className="space-y-3">
                {permissions.map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center justify-between py-2"
                  >
                    <Label
                      htmlFor={perm}
                      className="cursor-pointer flex-1"
                    >
                      {tPerms(perm as any)}
                    </Label>
                    <Switch
                      id={perm}
                      checked={formPermissions[perm as keyof Permissions] || false}
                      onCheckedChange={() => togglePermission(perm as keyof Permissions)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );

  if (!canManageRoles) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">
            You don't have permission to view this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            Manage user roles and permissions
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addRole')}
        </Button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No roles found. Create your first role.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg capitalize">
                            {role.name}
                          </CardTitle>
                          {role.priceMultiplier !== 1 && (
                            <CardDescription className="text-xs">
                              Price: {role.priceMultiplier}x
                            </CardDescription>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(role);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleToDelete(role);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {Object.values(role.permissions).filter(Boolean).length} permissions enabled
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full mt-3 justify-between"
                      onClick={() => openEditModal(role)}
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Edit Permissions
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Role Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('editRole')}: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Configure permissions for this role
            </DialogDescription>
          </DialogHeader>

          <PermissionsForm />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('addRole')}</DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions
            </DialogDescription>
          </DialogHeader>

          <PermissionsForm />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRole}
              disabled={saving || !formName.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{roleToDelete?.name}" role?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
