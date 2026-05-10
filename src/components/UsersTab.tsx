"use client";

import { useEffect, useState } from "react";
import { DataGrid, GridColDef, GridRowModel, GridActionsCellItem, GridPaginationModel } from "@mui/x-data-grid";
import { Box, Typography, Paper, Alert, Snackbar, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddModeratorIcon from "@mui/icons-material/AddModerator";
import RemoveModeratorIcon from "@mui/icons-material/RemoveModerator";
import api from "@/lib/api";
import UserAddressDialog from "./UserAddressDialog";

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  
  const [snackbar, setSnackbar] = useState<{ show: boolean, message: string, severity: 'success' | 'error' }>({
    show: false, message: '', severity: 'success'
  });

  const [addressDialog, setAddressDialog] = useState<{ open: boolean, user: any }>({ open: false, user: null });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/user/admin/users?page=${paginationModel.page}&limit=${paginationModel.pageSize}`);
      setUsers(response.data.users);
      setTotalCount(response.data.totalCount);
    } catch (error: any) {
      setSnackbar({ show: true, message: error.response?.data?.error || "Failed to fetch users", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [paginationModel]);

  const handleProcessRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    // Guard: Don't call API if values haven't changed
    if (newRow.name === oldRow.name && newRow.phone === oldRow.phone) {
      return oldRow;
    }

    try {
      const response = await api.put(`/user/admin/users/${newRow._id}`, {
        name: newRow.name,
        phone: newRow.phone,
      });
      setSnackbar({ show: true, message: "User updated successfully", severity: "success" });
      return response.data;
    } catch (error: any) {
      setSnackbar({ show: true, message: error.response?.data?.error || "Failed to update user", severity: "error" });
      return oldRow;
    }
  };

  const handleSaveAddresses = async (userId: string, newAddresses: any[]) => {
    try {
      await api.put(`/user/admin/users/${userId}`, { address: newAddresses });
      setSnackbar({ show: true, message: "Addresses updated successfully", severity: "success" });
      setAddressDialog({ open: false, user: null });
      fetchUsers();
    } catch (error: any) {
      setSnackbar({ show: true, message: error.response?.data?.error || "Failed to update addresses", severity: "error" });
    }
  };

  const handlePromoteToAdmin = async (id: string) => {
    const user = users.find(u => u._id === id);
    if (!user) return;
    
    const userRoles = user.role || [];
    if (userRoles.includes("admin")) {
      setSnackbar({ show: true, message: "User is already an admin", severity: "error" });
      return;
    }

    const newRole = [...userRoles, "admin"];
    
    try {
      await api.put(`/user/admin/users/${id}`, { role: newRole });
      setSnackbar({ show: true, message: "User promoted to admin", severity: "success" });
      fetchUsers();
    } catch (error: any) {
      setSnackbar({ show: true, message: error.response?.data?.error || "Failed to promote user", severity: "error" });
    }
  };

  const handleRevokeAdmin = async (id: string) => {
    const user = users.find(u => u._id === id);
    if (!user) return;
    
    const userRoles = user.role || [];
    if (!userRoles.includes("admin")) {
      return;
    }

    const newRole = userRoles.filter((r: string) => r !== "admin");
    
    try {
      await api.put(`/user/admin/users/${id}`, { role: newRole });
      setSnackbar({ show: true, message: "Admin role removed successfully", severity: "success" });
      fetchUsers();
    } catch (error: any) {
      setSnackbar({ show: true, message: error.response?.data?.error || "Failed to remove admin role", severity: "error" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await api.delete(`/user/admin/users/${id}`);
      setSnackbar({ show: true, message: "User deleted successfully", severity: "success" });
      fetchUsers();
    } catch (error: any) {
      setSnackbar({ show: true, message: error.response?.data?.error || "Failed to delete user", severity: "error" });
    }
  };

  const columns: GridColDef[] = [
    { field: "_id", headerName: "ID", width: 220 },
    { field: "name", headerName: "Name ✎", width: 200, editable: true },
    { field: "email", headerName: "Email", width: 250 },
    { field: "phone", headerName: "Phone ✎", width: 150, editable: true },
    { 
      field: "role", 
      headerName: "Roles", 
      width: 150,
      valueGetter: (value: string[]) => value ? value.join(", ") : ""
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 200,
      valueGetter: (value: string) => value ? new Date(value).toLocaleString() : ""
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      width: 200,
      valueGetter: (value: string) => value ? new Date(value).toLocaleString() : ""
    },
    {
      field: "addressAction",
      headerName: "Address ✎",
      width: 150,
      renderCell: (params) => (
        <Button size="small" variant="outlined" onClick={() => setAddressDialog({ open: true, user: params.row })}>
          View/Edit
        </Button>
      )
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 150,
      getActions: (params) => {
        const isAdmin = (params.row.role || []).includes("admin");
        return [
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => handleDeleteUser(params.row._id)}
          />,
          !isAdmin ? (
            <GridActionsCellItem
              icon={<AddModeratorIcon color="primary" />}
              label="Promote to Admin"
              onClick={() => handlePromoteToAdmin(params.row._id)}
            />
          ) : (
            <GridActionsCellItem
              icon={<RemoveModeratorIcon color="error" />}
              label="Remove Admin Role"
              onClick={() => handleRevokeAdmin(params.row._id)}
            />
          )
        ];
      },
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", flexShrink: 0 }}>Users Management</Typography>
      <Paper sx={{ flexGrow: 1, width: "100%", minHeight: 0 }}>
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row._id}
          rowCount={totalCount}
          loading={loading}
          paginationModel={paginationModel}
          paginationMode="server"
          onPaginationModelChange={setPaginationModel}
          processRowUpdate={handleProcessRowUpdate}
          onProcessRowUpdateError={(err) => console.error(err)}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
        />
      </Paper>

      <UserAddressDialog 
        open={addressDialog.open} 
        onClose={() => setAddressDialog({ open: false, user: null })} 
        user={addressDialog.user} 
        onSave={handleSaveAddresses} 
      />

      <Snackbar 
        open={snackbar.show} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, show: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
