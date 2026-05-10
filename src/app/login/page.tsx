"use client";

import { Box, Container, Paper, Typography, CircularProgress, Alert } from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";
import AppleSignin from "react-apple-signin-auth";
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

  const handleAppleSuccess = async (response: any) => {
    try {
      setError(null);
      await loginWithOAuth("apple", response.authorization.id_token);
    } catch (err: any) {
      setError(err.message || "Failed to login with Apple");
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

            <AppleSignin
              authOptions={{
                clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || 'PLACEHOLDER_APPLE_CLIENT_ID',
                scope: 'email name',
                redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || 'https://localhost:3000',
                state: 'state',
                nonce: 'nonce',
                usePopup: true
              }}
              uiType="dark"
              className="apple-auth-btn"
              noDefaultStyle={false}
              buttonExtraChildren="Continue with Apple"
              onSuccess={handleAppleSuccess}
              onError={(error: any) => setError("Apple login failed: " + error?.error)}
              skipScript={false}
              iconProps={{ style: { marginTop: '10px' } }}
              render={(props: any) => (
                <button
                  {...props}
                  style={{
                    backgroundColor: '#000',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    width: '200px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    fontWeight: 500,
                    height: '40px'
                  }}
                >
                  <svg viewBox="0 0 384 512" width="16" height="16" style={{ marginRight: '8px' }}>
                    <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  Continue with Apple
                </button>
              )}
            />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
