/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/src/context/AuthContext";
import Navbar from "@/src/components/Navbar";
import LandingPage from "@/src/pages/LandingPage";
import Login from "@/src/pages/Login";
import Dashboard from "@/src/pages/Dashboard";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import Onboarding from "@/src/pages/Onboarding";
import Pricing from "@/src/pages/Pricing";
import Consultation from "@/src/pages/Consultation";
import AnalyticsPage from "@/src/pages/Analytics";
import Community from "@/src/pages/Community";
import JournalHistory from "@/src/pages/JournalHistory";
import WellnessPage from "@/src/pages/Wellness";
import AppLayout from "@/src/components/AppLayout";
import DiagnosticScreen from "@/src/pages/DiagnosticScreen";
import SavedSessions from "@/src/pages/SavedSessions";
import Profile from "@/src/pages/Profile";
import WorkspacePortal from "@/src/pages/WorkspacePortal";
import AdminBeta from "@/src/pages/AdminBeta";
import BlogList from "@/src/pages/BlogList";
import BlogPost from "@/src/pages/BlogPost";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen atmosphere-bg">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute checkOnboarding={false}>
                    <Onboarding />
                  </ProtectedRoute>
                } 
              />
              
              {/* App Shell Routes */}
              <Route 
                path="/consultation" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Consultation /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/journals" 
                element={
                  <ProtectedRoute>
                    <AppLayout><JournalHistory /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <AppLayout><AnalyticsPage /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/community" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Community /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/experience" 
                element={
                  <ProtectedRoute>
                    <AppLayout><WellnessPage /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Dashboard /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/diagnostic" 
                element={
                  <ProtectedRoute>
                    <AppLayout><DiagnosticScreen /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/saved" 
                element={
                  <ProtectedRoute>
                    <AppLayout><SavedSessions /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/workspace" 
                element={
                  <ProtectedRoute>
                    <AppLayout><WorkspacePortal /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <AppLayout><Profile /></AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-beta" 
                element={
                  <ProtectedRoute>
                    <AppLayout><AdminBeta /></AppLayout>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

