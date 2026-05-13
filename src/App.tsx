/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/src/contexts/AuthContext";
import Navbar from "@/src/components/Navbar";
import LandingPage from "@/src/pages/LandingPage";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
            </Routes>
          </main>
          
          <footer className="py-12 text-center text-white/30 text-sm border-t border-white/5 font-light">
            <p>© 2026 AIRRA. Your companion for mental health.</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

