import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import SignUp from '../pages/SignUp.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Students from '../pages/Students.jsx';
import Courses from '../pages/Courses.jsx';
import Attendance from '../pages/Attendance.jsx';
import Grades from '../pages/Grades.jsx';
import Reports from '../pages/Reports.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/grades" element={<Grades />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
