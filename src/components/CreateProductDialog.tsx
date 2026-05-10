"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
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
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Image from "next/image";

import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import api from "@/lib/api";
import { uploadFilesToCloudinary } from "@/lib/cloudinary";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateProductDialog({ open, onClose, onCreated }: Props) {
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<number | ''>("");
  const [newOriginalPrice, setNewOriginalPrice] = useState<number | ''>("");
  const [newWeight, setNewWeight] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createSelectedFiles, setCreateSelectedFiles] = useState<File[]>([]);
  const [createSelectedPreviews, setCreateSelectedPreviews] = useState<string[]>([]);
  const [createUploading, setCreateUploading] = useState(false);
  const [createProgressText, setCreateProgressText] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // reset fields when dialog closed
      setNewName("");
      setNewPrice("");
      setNewOriginalPrice("");
      setNewWeight("");
      setNewDescription("");
      createSelectedPreviews.forEach(url => URL.revokeObjectURL(url));
      setCreateSelectedFiles([]);
      setCreateSelectedPreviews([]);
      setCreateUploading(false);
      setCreateProgressText(null);
    }
  }, [open]);

  const handleCreateFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const maxFiles = 10;
    const maxSize = 10 * 1024 * 1024; // 10 MB

    const existingCount = createSelectedFiles.length;
    const incoming = Array.from(files);
    const imageFiles = incoming.filter(f => f.type && f.type.startsWith('image/'));
    const rejected = incoming.length - imageFiles.length;
    if (rejected > 0) {
      // prefer a simple alert in dialog
      alert(`Only image files are allowed; ${rejected} file(s) were ignored.`);
    }

    if (existingCount + imageFiles.length > maxFiles) {
      alert(`Max ${maxFiles} images per product`);
      return;
    }

    for (const f of imageFiles) {
      if (f.size > maxSize) {
        alert(`File ${f.name} exceeds 10MB limit`);
        return;
      }
    }

    const newPreviews = imageFiles.map(f => URL.createObjectURL(f));
    setCreateSelectedFiles(prev => [...prev, ...imageFiles]);
    setCreateSelectedPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleCreateSubmit = async () => {
    if (!newName || newPrice === '' || !newWeight) {
      alert('Please provide name, price, and weight');
      return;
    }

    setCreateUploading(true);
    setCreateProgressText('Uploading...');
    try {
      let uploaded: string[] = [];
      if (createSelectedFiles.length) {
        uploaded = await uploadFilesToCloudinary(createSelectedFiles, (completed, total) => {
          setCreateProgressText(`Uploaded ${completed}/${total}`);
        });
      }

      const payload: any = {
        name: newName,
        price: Number(newPrice),
        original_price: newOriginalPrice ? Number(newOriginalPrice) : undefined,
        weight: newWeight,
        description: newDescription,
        image_uris: uploaded,
        category: [],
      };

      await api.post('/product/admin/products', payload);
      onCreated?.();
      onClose();
    } catch (err: any) {
      alert(err.message || err.response?.data?.error || 'Create failed');
    } finally {
      setCreateUploading(false);
      setCreateProgressText(null);
    }
  };

  // Warn user on page unload while uploading
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (createUploading) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      return undefined;
    };

    if (createUploading) {
      window.addEventListener('beforeunload', handler);
    }
    return () => window.removeEventListener('beforeunload', handler);
  }, [createUploading]);

  const handleRemovePreview = (idx: number) => {
    const f = createSelectedFiles.slice();
    const p = createSelectedPreviews.slice();
    URL.revokeObjectURL(p[idx]);
    f.splice(idx, 1); p.splice(idx, 1);
    setCreateSelectedFiles(f); setCreateSelectedPreviews(p);
  };

  const safeClose = () => {
    if (createUploading) {
      if (!window.confirm('Upload in progress. Closing the dialog or refreshing the page may interrupt uploads.')) return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={safeClose} fullWidth maxWidth="md">
      <DialogTitle>
        Create Product
        <IconButton aria-label="close" onClick={safeClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {createUploading && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            Upload in progress — do not close this dialog or refresh the page until upload completes.
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} fullWidth required />
          <TextField label="Price" value={newPrice} onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))} type="number" required />
          <TextField label="Original Price" value={newOriginalPrice} onChange={(e) => setNewOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))} type="number" />
          <TextField label="Weight" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} required />
          <TextField label="Description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} multiline minRows={3} />

          <Typography variant="body2">Add images (optional). Max 10 files total, each &lt;= 10MB.</Typography>
          <Paper variant="outlined" sx={{ p: 2, borderStyle: 'dashed' }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Button variant="contained" component="label" startIcon={<AddAPhotoIcon />}>
                Select files
                <input hidden multiple accept="image/*" type="file" onChange={(e) => handleCreateFilesSelected(e.target.files)} />
              </Button>
              <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={handleCreateSubmit} disabled={createUploading}>
                {createUploading ? <CircularProgress size={18} /> : 'Create product'}
              </Button>
              {createProgressText && <Typography variant="body2">{createProgressText}</Typography>}
            </Stack>

            {createSelectedPreviews.length > 0 && (
              <ImageList cols={6} rowHeight={80} sx={{ mt: 2 }}>
                {createSelectedPreviews.map((src, idx) => (
                  <ImageListItem key={src + idx} sx={{ position: 'relative' }}>
                    <Image 
                      src={src} 
                      alt={`sel-${idx}`} 
                      fill 
                      style={{ objectFit: 'cover' }} 
                    />
                    <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1 }} onClick={() => handleRemovePreview(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={safeClose}>Cancel</Button>
        <Button onClick={handleCreateSubmit} variant="contained" disabled={createUploading}>Create</Button>
      </DialogActions>
    </Dialog>
  );
}
