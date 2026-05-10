"use client";

import React from 'react';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import PhoneIcon from "@mui/icons-material/Phone";

interface UserAddress {
  street: string;
  landmark?: string;
  area: string;
  city: string;
  zipCode: string;
}

interface OrderUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: UserAddress[];
}

interface UserDetailDialogProps {
  user: OrderUser | null;
  onClose: () => void;
  formatAddress: (addr: UserAddress) => string;
}

const UserDetailDialog: React.FC<UserDetailDialogProps> = ({ user, onClose, formatAddress }) => {
  if (!user) return null;

  const handleCall = () => {
    window.location.href = `tel:${user.phone}`;
  };

  return (
    <Dialog open={Boolean(user)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>
        User Details
      </DialogTitle>
      <DialogContent sx={{ pt: 2, mt: '25px' }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{user.name}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Email Address</Typography>
            <Typography variant="body1">{user.email}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Phone Number</Typography>
            <Stack direction="row" spacing={1}>
              <Typography variant="body1">{user.phone}</Typography>
              <Button size="small" startIcon={<PhoneIcon />} onClick={handleCall}>Call</Button>
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Saved Addresses</Typography>
            <List dense sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {user.address?.map((addr, idx) => (
                <Box key={idx}>
                  <ListItem>
                    <ListItemText 
                      primary={`Address ${idx + 1}`}
                      secondary={formatAddress(addr)}
                    />
                  </ListItem>
                  {idx < user.address.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(UserDetailDialog);
