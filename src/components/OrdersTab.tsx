"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

import PhoneIcon from "@mui/icons-material/Phone";
import PersonIcon from "@mui/icons-material/Person";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import api from "@/lib/api";

// Sub-components (Lazily loaded)
const UserDetailDialog = dynamic(() => import("./Orders/UserDetailDialog"), { ssr: false });
const OrderItemsDialog = dynamic(() => import("./Orders/OrderItemsDialog"), { ssr: false });

interface OrderSummary {
  pendingTotal: number;
  pendingCount: number;
}

interface ItemSummary {
  name: string;
  image_uris: string[];
  price: number;
  weight: string;
  totalQuantity: number;
  totalPrice: number;
}

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

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  weight: string;
}

interface Order {
  _id: string;
  user: OrderUser;
  orderItems: OrderItem[];
  orderPrice: number;
  address: UserAddress;
  phone: string;
  createdAt: string;
}

export default function OrdersTab() {
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [itemsSummary, setItemsSummary] = useState<ItemSummary[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [snackbar, setSnackbar] = useState<{ show: boolean, message: string, severity: 'success' | 'error' }>({
    show: false, message: '', severity: 'success'
  });

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<OrderUser | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[] | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, itemsRes] = await Promise.all([
        api.get("/order/admin/summary"),
        api.get("/order/admin/items-summary")
      ]);
      setSummary(summaryRes.data);
      setItemsSummary(itemsRes.data.summary);
    } catch (error: any) {
      setSnackbar({
        show: true,
        message: error.response?.data?.message || "Failed to fetch summary data",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setTableLoading(true);
      const status = activeSubTab === 0 ? "Order placed" : "";
      const response = await api.get(`/order/admin/orders?page=${paginationModel.page}&limit=${paginationModel.pageSize}${status ? `&status=${status}` : ''}`);
      setOrders(response.data.orders);
      setTotalCount(response.data.totalCount);
    } catch (error: any) {
      setSnackbar({
        show: true,
        message: error.response?.data?.message || "Failed to fetch orders",
        severity: "error"
      });
    } finally {
      setTableLoading(false);
    }
  }, [paginationModel, activeSubTab]);

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 0) {
      fetchSummary();
    }
    fetchOrders();
  }, [activeSubTab, fetchSummary, fetchOrders]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveSubTab(newValue);
  };

  const formatAddress = useCallback((addr: UserAddress) => {
    if (!addr) return "N/A";
    return `${addr.street}, ${addr.landmark ? addr.landmark + ', ' : ''}${addr.area}, ${addr.city} - ${addr.zipCode}`;
  }, []);

  const handleCall = useCallback((phone: string) => {
    window.location.href = `tel:${phone}`;
  }, []);

  const columns: GridColDef[] = useMemo(() => [
    { field: "_id", headerName: "Order ID", width: 180 },
    { 
      field: "userName", 
      headerName: "User Name", 
      width: 150,
      valueGetter: (value, row) => row.user?.name || "N/A"
    },
    { 
      field: "address", 
      headerName: "Address", 
      width: 250,
      valueGetter: (value, row) => formatAddress(row.address)
    },
    { 
      field: "phone", 
      headerName: "Phone", 
      width: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          width: '100%',
          gap: 1.5
        }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{params.value}</Typography>
          <Tooltip title="Call User">
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => handleCall(params.value)}
              sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              <PhoneIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    },
    {
      field: "userDetails",
      headerName: "User Details",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<PersonIcon />}
            onClick={() => setSelectedUser(params.row.user)}
          >
            View
          </Button>
        </Box>
      )
    },
    {
      field: "orderItems",
      headerName: "Items",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<ShoppingCartIcon />}
            onClick={() => setSelectedItems(params.row.orderItems)}
          >
            {params.row.orderItems?.length || 0} Items
          </Button>
        </Box>
      )
    },
    { 
      field: "orderPrice", 
      headerName: "Price", 
      width: 120,
      valueFormatter: (value: number) => value?.toLocaleString() || 0
    },
    { 
      field: "status", 
      headerName: "Status", 
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              px: 1, 
              py: 0.5, 
              borderRadius: 1, 
              fontWeight: 'bold',
              bgcolor: params.value === 'Order placed' ? 'warning.light' : params.value === 'Delivered' ? 'success.light' : 'error.light',
              color: 'white'
            }}
          >
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: "createdAt", 
      headerName: "Placed At", 
      width: 200,
      valueGetter: (value) => value ? new Date(value).toLocaleString() : ""
    },
  ], [formatAddress, handleCall]);

  const consolidatedItemsList = useMemo(() => (
    <List dense>
      {itemsSummary.length > 0 ? itemsSummary.map((item, idx) => (
        <Box key={idx}>
          <ListItem sx={{ px: 0 }}>
            <ListItemText 
              primary={
                <Typography variant="body1" sx={{ fontWeight: '600', color: 'primary.dark' }}>
                  {item.name} ({item.weight}) x {item.totalQuantity}
                </Typography>
              }
            />
          </ListItem>
          {idx < itemsSummary.length - 1 && <Divider />}
        </Box>
      )) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No items to display
        </Typography>
      )}
    </List>
  ), [itemsSummary]);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, mt: '-10px' }}>
        <Tabs value={activeSubTab} onChange={handleTabChange} aria-label="orders sub-tabs">
          <Tab label="Current Orders" />
          <Tab label="All Orders" />
        </Tabs>
      </Box>

      {activeSubTab === 0 ? (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: 3, pr: 1 }}>
          {/* Top Cards Section using Flex for full width distribution */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <Card sx={{ 
              minWidth: { xs: '100%', md: 300 }, 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText', 
              boxShadow: 3,
              borderRadius: 2
            }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ opacity: 0.9 }}>
                  Pending Summary
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1.5 }}>
                  {summary?.pendingCount || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Orders to Deliver
                </Typography>
                <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Typography variant="h5" sx={{ fontWeight: 'medium' }}>
                  Total Cost: {summary?.pendingTotal?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ 
              flexGrow: 1, 
              maxHeight: 240, 
              display: 'flex', 
              flexDirection: 'column', 
              boxShadow: 3,
              borderRadius: 2,
              width: '100%'
            }}>
              <CardContent sx={{ pb: 1, bgcolor: 'grey.50' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Consolidated Items List</Typography>
              </CardContent>
              <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
                {consolidatedItemsList}
              </Box>
            </Card>
          </Box>

          {/* Orders Table Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, px: 0.5 }}>Detailed Pending Orders</Typography>
            <Paper sx={{ width: "100%", borderRadius: 2, overflow: 'hidden', minHeight: 400 }}>
              <DataGrid
                rows={orders}
                columns={columns}
                getRowId={(row) => row._id}
                rowCount={totalCount}
                loading={tableLoading}
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                rowHeight={65}
                autoHeight
                sx={{
                  '& .MuiDataGrid-cell:focus': { outline: 'none' },
                  '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
                }}
              />
            </Paper>
          </Box>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, px: 0.5 }}>All Orders History</Typography>
          <Paper sx={{ flexGrow: 1, width: "100%", minHeight: 0, borderRadius: 2, overflow: 'hidden' }}>
            <DataGrid
              rows={orders}
              columns={columns}
              getRowId={(row) => row._id}
              rowCount={totalCount}
              loading={tableLoading}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              rowHeight={65}
              sx={{
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
                '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
              }}
            />
          </Paper>
        </Box>
      )}

      {/* Optimized External Dialogs */}
      {selectedUser && (
        <UserDetailDialog 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          formatAddress={formatAddress} 
        />
      )}
      
      {selectedItems && (
        <OrderItemsDialog 
          items={selectedItems} 
          onClose={() => setSelectedItems(null)} 
        />
      )}

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
