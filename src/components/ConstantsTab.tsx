"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { DataGrid, GridColDef, GridRowModel } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import api from "@/lib/api";

export default function ConstantsTab() {
  const [constants, setConstants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ show: boolean, message: string, severity: 'success' | 'error' }>({
    show: false, message: '', severity: 'success'
  });

  const fetchConstants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/constants");
      setConstants(response.data.allConstants || []);
    } catch (error: any) {
      setSnackbar({ 
        show: true, 
        message: error.response?.data?.error || "Failed to fetch constants", 
        severity: "error" 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConstants();
  }, [fetchConstants]);

  const handleProcessRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    if (newRow.value === oldRow.value) {
      return oldRow;
    }

    try {
      const response = await api.put(`/constants/${newRow._id}`, {
        value: newRow.value,
      });
      setSnackbar({ show: true, message: "Constant updated successfully", severity: "success" });
      return response.data.constant;
    } catch (error: any) {
      setSnackbar({ 
        show: true, 
        message: error.response?.data?.message || "Failed to update constant", 
        severity: "error" 
      });
      return oldRow;
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    { field: "key", headerName: "Constant Key Name", width: 300, flex: 1 },
    { 
      field: "value", 
      headerName: "Value ✎", 
      width: 400, 
      flex: 2,
      editable: true,
      renderCell: (params) => {
        if (typeof params.value === 'object') {
          return JSON.stringify(params.value);
        }
        return params.value;
      }
    },
  ], []);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", flexShrink: 0 }}>Constants Management</Typography>
      <Paper sx={{ flexGrow: 1, width: "100%", minHeight: 0 }}>
        <DataGrid
          rows={constants}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          processRowUpdate={handleProcessRowUpdate}
          onProcessRowUpdateError={(err) => console.error(err)}
          disableRowSelectionOnClick
          hideFooterPagination
          sx={{
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
          }}
        />
      </Paper>

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
