import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import DashboardLayout from "../layout/DashboardLayout";
import ProtectedRoute from "../guards/ProtectedRoute";
import RoleGuard from "../guards/RoleGuard";

// Páginas
import DashboardPage from "../pages/DashboardPage";
import ProductsPage from "../pages/ProductsPage";
import MovementsPage from "../pages/MovementsPage";
import SalesPage from "../pages/SalesPage";
import CustomersPage from "../pages/CustomersPage";
import InvoicesPage from "../pages/InvoicesPage";
import UsersPage from "../pages/UsersPage";
import ReportsPage from "../pages/ReportsPage";
import SettingsPage from "../pages/SettingsPage";
import SuppliersPage from "../pages/SuppliersPage";
import PurchasesPage from "../pages/PurchasesPage";
import EmployeesPage from "../pages/EmployeesPage";
import PayrollPage from "../pages/PayrollPage";
import IntelligencePage from "../pages/IntelligencePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Rutas protegidas */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    {/* ============ ACCESO PARA TODOS ============ */}
                    <Route index element={<DashboardPage />} />

                    <Route
                        path="products"
                        element={<ProductsPage />}
                    />

                    <Route
                        path="movements"
                        element={<MovementsPage />}
                    />

                    <Route
                        path="sales"
                        element={<SalesPage />}
                    />

                    <Route
                        path="customers"
                        element={<CustomersPage />}
                    />

                    <Route
                        path="invoices"
                        element={<InvoicesPage />}
                    />

                    {/* ============ SOLO ADMINISTRADOR ============ */}
                    <Route
                        path="users"
                        element={
                            <RoleGuard allowedRoles={["ADMIN"]}>
                                <UsersPage />
                            </RoleGuard>
                        }
                    />

                    <Route
                        path="suppliers"
                        element={
                            <RoleGuard allowedRoles={["ADMIN"]}>
                                <SuppliersPage />
                            </RoleGuard>
                        }
                    />

                    <Route
                        path="purchases"
                        element={
                            <RoleGuard allowedRoles={["ADMIN"]}>
                                <PurchasesPage />
                            </RoleGuard>
                        }
                    />

                    <Route
                        path="employees"
                        element={
                            <RoleGuard allowedRoles={["ADMIN"]}>
                                <EmployeesPage />
                            </RoleGuard>
                        }
                    />

                    <Route
                        path="payroll"
                        element={
                            <RoleGuard allowedRoles={["ADMIN"]}>
                                <PayrollPage />
                            </RoleGuard>
                        }
                    />

                    <Route
                        path="reports"
                        element={
                            <RoleGuard allowedRoles={["ADMIN"]}>
                                <ReportsPage />
                            </RoleGuard>
                        }
                    />

                    <Route
                        path="intelligence"
                        element={
                            <RoleGuard allowedRoles={["ADMIN"]}>
                                <IntelligencePage />
                            </RoleGuard>
                        }
                    />

                    <Route
                        path="settings"
                        element={
                            <RoleGuard allowedRoles={["ADMIN"]}>
                                <SettingsPage />
                            </RoleGuard>
                        }
                    />
                </Route>

                {/* ============ RUTA 404 ============ */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}