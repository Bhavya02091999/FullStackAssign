
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import Layout from "./Layout";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DataProvider>
      <Layout>{children}</Layout>
    </DataProvider>
  );
};

export default ProtectedRoute;
