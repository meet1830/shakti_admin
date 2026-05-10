"use client";

import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UsersTab from "@/components/UsersTab";
import ProductsTab from "@/components/ProductsTab";
import OrdersTab from "@/components/OrdersTab";
import ConstantsTab from "@/components/ConstantsTab";
import Image from "next/image";
import logo from "../assets/icon/transparent_full.png";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ width: '100%', flexGrow: 1, display: value === index ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden' }}
    >
      {value === index && (
        <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(2);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.role.includes("admin")) {
        router.push("/login"); // or a 'not authorized' page
      }
    }
  }, [user, loading, router]);

  if (loading || !user || !user.role.includes("admin")) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          px: { xs: 2, md: 4 }, 
          p: 1 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Image src={logo} alt="Shakti Logo" priority style={{height: "50px", width: "auto"}} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Admin
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Welcome, {user.name}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ cursor: 'pointer', color: 'error.main', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}
              onClick={logout}
            >
              Logout
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ px: { xs: 0, md: 2 } }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="admin dashboard tabs"
          >
            <Tab label="Users" />
            <Tab label="Products" />
            <Tab label="Orders" />
            <Tab label="Constants" />
          </Tabs>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5', overflow: 'hidden' }}>
        <CustomTabPanel value={tabValue} index={0}>
          <UsersTab />
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={1}>
          <ProductsTab />
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={2}>
          <OrdersTab />
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={3}>
          <ConstantsTab />
        </CustomTabPanel>
      </Box>
    </Box>
  );
}
