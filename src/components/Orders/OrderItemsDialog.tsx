"use client";
import React, { useState, useMemo } from 'react';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Image from "next/image";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  weight: string;
  image_uris?: string[];
  original_price?: number;
  description?: string;
}

interface OrderItemsDialogProps {
  items: OrderItem[] | null;
  onClose: () => void;
}

const OrderItemsDialog: React.FC<OrderItemsDialogProps> = ({ items, onClose }) => {
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);

  const columns: GridColDef[] = useMemo(() => [
    { 
      field: "id", 
      headerName: "S.No", 
      width: 70,
      renderCell: (params) => {
        return params.api.getAllRowIds().indexOf(params.id) + 1;
      }
    },
    { field: "name", headerName: "Product Name", width: 220 },
    { 
      field: "price", 
      headerName: "Price", 
      width: 100, 
      valueFormatter: (value: number) => value.toLocaleString() 
    },
    { 
      field: "original_price", 
      headerName: "Orig. Price", 
      width: 120, 
      valueFormatter: (value: number) => value ? value.toLocaleString() : "-" 
    },
    { field: "quantity", headerName: "Qty", width: 80, type: 'number' },
    { field: "weight", headerName: "Weight", width: 100 },
    {
      field: "image_uris",
      headerName: "Images",
      width: 200,
      renderCell: (params) => {
        const uris = params.value || [];
        if (uris.length === 0) return <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>No images</Typography>;
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%', overflowX: 'auto', py: 0.5 }}>
            {uris.map((uri: string, idx: number) => (
              <Box 
                key={idx} 
                sx={{ 
                  position: 'relative',
                  height: 40, 
                  width: 40, 
                  borderRadius: 1, 
                  border: '1px solid #ddd', 
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }} 
                onClick={(e) => {
                  e.stopPropagation();
                  setViewImageUrl(uri);
                }}
              >
                <Image 
                  src={uri} 
                  alt={`Item ${idx}`} 
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
            ))}
          </Box>
        );
      }
    },
    { 
      field: "total", 
      headerName: "Total", 
      width: 120, 
      valueGetter: (value, row) => (row.price * row.quantity),
      valueFormatter: (value: number) => value.toLocaleString()
    },
    { field: "description", headerName: "Description", width: 250 },
  ], []);

  if (!items) return null;

  return (
    <>
      <Dialog open={Boolean(items)} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>
          Order Items Details
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ height: 500 }}>
            <DataGrid
              rows={items}
              columns={columns}
              getRowId={(row) => `${row.name}-${row.weight}-${row.price}-${row.quantity}`}
              disableRowSelectionOnClick
              rowHeight={65}
              hideFooter={items.length <= 10}
              sx={{
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Image viewer dialog */}
      <Dialog open={Boolean(viewImageUrl)} onClose={() => setViewImageUrl(null)} maxWidth="lg">
        <DialogContent sx={{ p: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'black', position: 'relative', minHeight: '500px' }}>
          {viewImageUrl && (
            <Image 
              src={viewImageUrl} 
              alt="preview" 
              fill
              style={{ objectFit: 'contain' }} 
            />
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'black' }}>
          <Button onClick={() => setViewImageUrl(null)} sx={{ color: 'white' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default React.memo(OrderItemsDialog);
