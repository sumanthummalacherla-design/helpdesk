import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Layout from "./pages/layout";
import Tickets from "./pages/tickets";
import Customers from "./pages/customers";
import Settings from "./pages/settings";
import Reports from "./pages/reports";
import { AuthProvider } from "./AuthContext";
import Ticket_form from "./pages/ticket-form";
import TicketDetail from "./pages/Ticketdetails";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/helpdesk">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="customers" element={<Customers />} />
            <Route path="settings" element={<Settings />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="ticket-form" element={<Ticket_form />} />
            <Route path="ticket/:id" element={<TicketDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
