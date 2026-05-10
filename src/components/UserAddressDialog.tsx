import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect } from "react";

interface UserAddressDialogProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onSave: (userId: string, addresses: any[]) => void;
}

export default function UserAddressDialog({ open, onClose, user, onSave }: UserAddressDialogProps) {
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      // Create a deep copy of addresses so we don't mutate original state directly
      setAddresses(JSON.parse(JSON.stringify(user.address || [])));
    }
  }, [user]);

  const handleChange = (index: number, field: string, value: string) => {
    const newAddresses = [...addresses];
    newAddresses[index][field] = value;
    setAddresses(newAddresses);
  };

  const handleAdd = () => {
    setAddresses([...addresses, { street: '', landmark: '', area: '', city: '', zipCode: '' }]);
  };

  const handleRemove = (index: number) => {
    const newAddresses = addresses.filter((_, i) => i !== index);
    setAddresses(newAddresses);
  };

  const handleSave = () => {
    onSave(user._id, addresses);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Addresses for {user?.name}</DialogTitle>
      <DialogContent dividers>
        {addresses.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>No addresses found.</Typography>
        ) : (
          addresses.map((addr, index) => (
            <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 2, position: 'relative', bgcolor: '#fafafa' }}>
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => handleRemove(index)}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                <DeleteIcon />
              </IconButton>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>ADDRESS {index + 1}</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField 
                  fullWidth size="small" label="Street" required 
                  value={addr.street || ''} 
                  onChange={(e) => handleChange(index, 'street', e.target.value)} 
                />
                <TextField 
                  fullWidth size="small" label="Landmark" 
                  value={addr.landmark || ''} 
                  onChange={(e) => handleChange(index, 'landmark', e.target.value)} 
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                  fullWidth size="small" label="Area" required 
                  value={addr.area || ''} 
                  onChange={(e) => handleChange(index, 'area', e.target.value)} 
                />
                <TextField 
                  fullWidth size="small" label="City" required 
                  value={addr.city || ''} 
                  onChange={(e) => handleChange(index, 'city', e.target.value)} 
                />
                <TextField 
                  fullWidth size="small" label="Zip Code" required 
                  value={addr.zipCode || ''} 
                  onChange={(e) => handleChange(index, 'zipCode', e.target.value)} 
                />
              </Box>
            </Box>
          ))
        )}
        <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAdd} sx={{ mt: 1 }}>
          Add New Address
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSave} color="primary">Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
}
