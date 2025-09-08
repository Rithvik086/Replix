import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import RulesManagement from "./components/RulesManagement";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/rules" element={<RulesManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
