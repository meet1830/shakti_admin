"use client";

import { Box, Container, Paper, Typography, CircularProgress, Alert } from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "../../assets/icon/transparent_full.png";

export default function LoginPage() {
  const { user, loading, loginWithOAuth } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setError(null);
      await loginWithOAuth("google", credentialResponse.credential);
    } catch (err: any) {
      setError(err.message || "Failed to login with Google");
    }
  };



  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          my: 8,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 5, width: "100%", textAlign: "center", borderRadius: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Image src={logo} alt="Shakti Logo" style={{
              height: "150px",
              width: "auto"
            }} priority />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
              Admin Login
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to access the Patel Namkeen admin dashboard.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google login failed")}
            />


          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
