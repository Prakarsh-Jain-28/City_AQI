import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";

// Layouts
import PublicLayout from "./components/layouts/PublicLayout";
import AdminLayout from "./components/layouts/AdminLayout";

// Public Pages
import HomePage from "./pages/public/HomePage";
import CitiesPage from "./pages/public/CitiesPage";
import CityDetailPage from "./pages/public/CityDetailPage";
import PredictionsPage from "./pages/public/PredictionsPage";
import ComparePage from "./pages/public/ComparePage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import PublicAlertsPage from "./pages/public/PublicAlertsPage";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import AdminMonitoringPredictions from "./pages/admin/AdminMonitoringPredictions";
import Dashboard from "./pages/admin/Dashboard";
import StationsManagement from "./pages/admin/StationsManagement";
import HotspotsManagement from "./pages/admin/HotspotsManagement";
import AssignmentsManagement from "./pages/admin/AssignmentsManagement";
import AlertsManagement from "./pages/admin/AlertsManagement";
import NotificationsPage from "./pages/admin/NotificationsPage";
import ChatPage from "./pages/admin/ChatPage";
import ReportsPage from "./pages/admin/ReportsPage";
import OfficialsManagement from "./pages/admin/OfficialsManagement";
import SettingsPage from "./pages/admin/SettingsPage";
import ProfilePage from "./pages/admin/ProfilePage";

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="page-loader">
                <div className="loader-spinner"></div>
                <p>Authenticating...</p>
            </div>
        );
    }
    if (!user) return <Navigate to="/admin/login" replace />;
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <SocketProvider>
                    <AuthProvider>
                        <Routes>
                            {/* Public Routes */}
                            <Route element={<PublicLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/aqi" element={<CitiesPage />} />
                                <Route path="/city/:cityName" element={<CityDetailPage />} />
                                <Route path="/predictions" element={<PredictionsPage />} />
                                <Route path="/compare" element={<ComparePage />} />
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/alerts" element={<PublicAlertsPage />} />
                            </Route>

                            {/* Admin Login & Register */}
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route path="/admin/register" element={<AdminRegister />} />

                            {/* Admin Protected Routes */}
                            <Route path="/admin" element={
                                <ProtectedRoute>
                                    <AdminLayout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="monitoring" element={<AdminMonitoringPredictions />} />
                                <Route path="stations" element={<StationsManagement />} />
                                <Route path="hotspots" element={<HotspotsManagement />} />
                                <Route path="assignments" element={<AssignmentsManagement />} />
                                <Route path="alerts" element={<AlertsManagement />} />
                                <Route path="notifications" element={<NotificationsPage />} />
                                <Route path="chat" element={<ChatPage />} />
                                <Route path="reports" element={<ReportsPage />} />
                                <Route path="officials" element={<OfficialsManagement />} />
                                <Route path="settings" element={<SettingsPage />} />
                                <Route path="profile" element={<ProfilePage />} />
                            </Route>
                        </Routes>
                    </AuthProvider>
                </SocketProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
