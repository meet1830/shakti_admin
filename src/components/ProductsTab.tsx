"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { DataGrid, GridActionsCellItem, GridColDef, GridPaginationModel, GridRowModel } from "@mui/x-data-grid";
import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "@/lib/api";
import { uploadFilesToCloudinary } from "@/lib/cloudinary";

const CreateProductDialog = dynamic(() => import("./CreateProductDialog"), { ssr: false });

export default function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  
  const [snackbar, setSnackbar] = useState<{ show: boolean, message: string, severity: 'success' | 'error' }>({
    show: false, message: '', severity: 'success'
  });

  // Images editor dialog state
  const [imagesDialogOpen, setImagesDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingImageUris, setEditingImageUris] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/product/admin/products?page=${paginationModel.page}&limit=${paginationModel.pageSize}`);
      setProducts(response.data.products);
      setTotalCount(response.data.totalCount);
    } catch (error: any) {
      setSnackbar({ show: true, message: error.response?.data?.error || "Failed to fetch products", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [paginationModel]);

  const handleProcessRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    // Guard: Don't call API if values haven't changed
    const hasChanged = 
      newRow.name !== oldRow.name || 
      newRow.price !== oldRow.price || 
      newRow.original_price !== oldRow.original_price || 
      newRow.weight !== oldRow.weight || 
      newRow.description !== oldRow.description;

    if (!hasChanged) {
      return oldRow;
    }

    try {
      const response = await api.put(`/product/admin/products/${newRow._id}`, {
        name: newRow.name,
        price: newRow.price,
        original_price: newRow.original_price,
        weight: newRow.weight,
        description: newRow.description,
      });
      setSnackbar({ show: true, message: "Product updated successfully", severity: "success" });
      
      // Update local state to reflect changes including populated data
      const updatedProduct = { ...oldRow, ...response.data };
      setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
      
      return updatedProduct;
    } catch (error: any) {
      setSnackbar({ show: true, message: error.response?.data?.error || "Failed to update product", severity: "error" });
      return oldRow;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await api.delete(`/product/admin/products/${id}`);
      setSnackbar({ show: true, message: "Product deleted successfully", severity: "success" });
      fetchProducts();
    } catch (error: any) {
      setSnackbar({ show: true, message: error.response?.data?.error || "Failed to delete product", severity: "error" });
    }
  };

  const openImagesEditor = (row: any) => {
    setEditingProductId(row._id);
    setEditingImageUris(Array.isArray(row.image_uris) ? row.image_uris.slice() : []);
    setSelectedFiles([]);
    setSelectedPreviews([]);
    setImagesDialogOpen(true);
  };

  const openCreateDialog = () => setCreateDialogOpen(true);

  const closeCreateDialog = () => setCreateDialogOpen(false);

  const closeImagesEditor = () => {
    if (uploading) {
      if (!window.confirm('Upload in progress. Closing the dialog or refreshing the page may interrupt uploads and cause failures. Are you sure you want to close?')) return;
    }

    setImagesDialogOpen(false);
    setEditingProductId(null);
    setSelectedFiles([]);
    setSelectedPreviews([]);
    setProgressText(null);
    setUploading(false);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const maxFiles = 10;
    const maxSize = 10 * 1024 * 1024; // 10 MB

    const existingCount = editingImageUris.length + selectedFiles.length;
    const incoming = Array.from(files);

    // Accept images only
    const imageFiles = incoming.filter(f => f.type && f.type.startsWith('image/'));
    const rejected = incoming.length - imageFiles.length;
    if (rejected > 0) {
      setSnackbar({ show: true, message: `Only image files are allowed; ${rejected} file(s) were ignored.`, severity: 'error' });
    }

    if (existingCount + imageFiles.length > maxFiles) {
      setSnackbar({ show: true, message: `Max ${maxFiles} images per product`, severity: 'error' });
      return;
    }

    for (const f of imageFiles) {
      if (f.size > maxSize) {
        setSnackbar({ show: true, message: `File ${f.name} exceeds 10MB limit`, severity: 'error' });
        return;
      }
    }

    const newPreviews = imageFiles.map(f => URL.createObjectURL(f));
    setSelectedFiles(prev => [...prev, ...imageFiles]);
    setSelectedPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const removeExistingUri = async (index: number) => {
    if (!window.confirm('Are you sure you want to remove this image from the product?')) return;

    const newUris = editingImageUris.slice();
    newUris.splice(index, 1);
    setEditingImageUris(newUris);

    // persist immediately
    if (!editingProductId) return;
    try {
      await api.put(`/product/admin/products/${editingProductId}`, { image_uris: newUris });
      setSnackbar({ show: true, message: 'Image removed', severity: 'success' });
      fetchProducts();
    } catch (err: any) {
      setSnackbar({ show: true, message: err.response?.data?.error || 'Failed to remove image', severity: 'error' });
    }
  };

  const removeSelectedFile = (index: number) => {
    const newFiles = selectedFiles.slice();
    const newPreviews = selectedPreviews.slice();
    // revoke object url
    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedFiles(newFiles);
    setSelectedPreviews(newPreviews);
  };

  const handleUploadSelected = async () => {
    if (!editingProductId) return;
    if (!selectedFiles.length) {
      setSnackbar({ show: true, message: 'No files selected', severity: 'error' });
      return;
    }

    setUploading(true);
    setProgressText('Uploading...');
    try {
      const uploaded = await uploadFilesToCloudinary(selectedFiles, (completed, total) => {
        setProgressText(`Uploaded ${completed}/${total}`);
      });

      const merged = [...editingImageUris, ...uploaded];
      await api.put(`/product/admin/products/${editingProductId}`, { image_uris: merged });
      setSnackbar({ show: true, message: 'Images uploaded successfully', severity: 'success' });
      // Refresh
      fetchProducts();
      // update local state
      setEditingImageUris(merged);
      setSelectedFiles([]);
      selectedPreviews.forEach(url => URL.revokeObjectURL(url));
      setSelectedPreviews([]);
    } catch (err: any) {
      setSnackbar({ show: true, message: err.message || err.response?.data?.error || 'Upload failed', severity: 'error' });
    } finally {
      setUploading(false);
      setProgressText(null);
    }
  };

  // Warn user on page unload while uploading
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      return undefined;
    };

    if (uploading) {
      window.addEventListener('beforeunload', handler);
    }
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [uploading]);

  const columns: GridColDef[] = useMemo(() => [
    { field: "_id", headerName: "ID", width: 220 },
    {
      field: "image_uris",
      headerName: "Images",
      width: 250,
      renderCell: (params) => {
        const uris = params.value || [];
        if (uris.length === 0) return <Typography variant="body2" color="text.secondary">No images</Typography>;
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%', overflowX: 'auto' }}>
            {uris.slice(0, 5).map((uri: string, idx: number) => (
              <Box 
                key={idx} 
                sx={{ position: 'relative', height: 40, width: 40, borderRadius: 1, border: '1px solid #ddd', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => setViewImageUrl(uri)}
              >
                <Image 
                  src={uri} 
                  alt={`Product ${idx}`} 
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
            ))}
            <IconButton size="small" onClick={() => openImagesEditor(params.row)} title="Edit images">
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
    },
    { field: "name", headerName: "Name ✎", width: 200, editable: true },
    { field: "price", headerName: "Price ✎", width: 120, editable: true, type: 'number' },
    { field: "original_price", headerName: "Original Price ✎", width: 150, editable: true, type: 'number' },
    { field: "weight", headerName: "Weight ✎", width: 120, editable: true },
    { 
      field: "category", 
      headerName: "Categories", 
      width: 200,
      renderCell: (params) => {
        const categories = params.value || [];
        const names = categories.map((cat: any) => cat.name || cat).join(", ");
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
            <Tooltip title={names}>
              <Typography variant="body2" noWrap sx={{ width: '100%' }}>{names}</Typography>
            </Tooltip>
          </Box>
        );
      }
    },
    { field: "description", headerName: "Description ✎", width: 250, editable: true },
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
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 140,
      getActions: (params) => [
        <GridActionsCellItem
          key={'delete'}
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteProduct(params.row._id)}
        />
      ],
    },
  ], [products]); // Update columns if products change to ensure actions/renders are fresh

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", flexShrink: 0 }}>Products Management</Typography>
        <Button variant="contained" onClick={openCreateDialog}>Create Product</Button>
      </Box>
      <Paper sx={{ flexGrow: 1, width: "100%", minHeight: 0 }}>
        <DataGrid
          rows={products}
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
          rowHeight={60} // Slightly taller rows to accommodate images
          pageSizeOptions={[10, 25, 50]}
        />
      </Paper>

        {/* Images editor dialog */}
        <Dialog open={imagesDialogOpen} onClose={closeImagesEditor} fullWidth maxWidth="md">
          <DialogTitle>
            Edit Images
            <IconButton
              aria-label="close"
              onClick={closeImagesEditor}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {uploading && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                Upload in progress — do not close this dialog or refresh the page until upload completes.
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 1 }}>Existing images (click to view). Remove will persist immediately.</Typography>
            <ImageList cols={6} rowHeight={80} sx={{ mb: 2 }}>
              {editingImageUris.map((uri, idx) => (
                <ImageListItem key={uri + idx} sx={{ position: 'relative' }}>
                  <Image 
                    src={uri} 
                    alt={`img-${idx}`} 
                    fill 
                    style={{ objectFit: 'cover', cursor: 'pointer' }} 
                    onClick={() => setViewImageUrl(uri)} 
                  />
                  <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1 }} onClick={() => removeExistingUri(idx)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ImageListItem>
              ))}
            </ImageList>

            <Typography variant="body2" sx={{ mb: 1 }}>Add images (drag & drop or use picker). Max 10 files total, each &lt;= 10MB.</Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                minHeight: 140,
                borderStyle: 'dashed',
                borderColor: isDragOver ? 'primary.main' : 'divider',
                bgcolor: isDragOver ? 'action.hover' : 'transparent',
                transition: 'background-color 150ms, border-color 150ms',
              }}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Button variant="contained" component="label" startIcon={<AddAPhotoIcon />}>
                  Select files
                  <input hidden multiple accept="image/*" type="file" onChange={(e) => handleFilesSelected(e.target.files)} />
                </Button>
                <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={handleUploadSelected} disabled={uploading || !selectedFiles.length}>
                  {uploading ? <CircularProgress size={18} /> : 'Upload selected'}
                </Button>
                {progressText && <Typography variant="body2">{progressText}</Typography>}
              </Stack>

              {selectedPreviews.length > 0 && (
                <ImageList cols={6} rowHeight={80} sx={{ mt: 2 }}>
                  {selectedPreviews.map((src, idx) => (
                    <ImageListItem key={src + idx} sx={{ position: 'relative' }}>
                      <Image 
                        src={src} 
                        alt={`sel-${idx}`} 
                        fill 
                        style={{ objectFit: 'cover' }} 
                      />
                      <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1 }} onClick={() => removeSelectedFile(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeImagesEditor}>Close</Button>
          </DialogActions>
        </Dialog>

        <CreateProductDialog open={createDialogOpen} onClose={closeCreateDialog} onCreated={() => { fetchProducts(); }} />

        {/* Image viewer dialog */}
        <Dialog open={Boolean(viewImageUrl)} onClose={() => setViewImageUrl(null)} maxWidth="lg">
          <DialogContent sx={{ p: 1, position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {viewImageUrl && (
              <Image 
                src={viewImageUrl} 
                alt="preview" 
                fill
                style={{ objectFit: 'contain' }}
              />
            )}
          </DialogContent>
        </Dialog>

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
