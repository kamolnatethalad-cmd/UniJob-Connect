import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

// --- Auth Screens ---
import LoginScreen from './screens/auth/LoginScreen';
import EmployerRegisterScreen from './screens/auth/EmployerRegisterScreen';
import StudentRegisterScreen from './screens/auth/StudentRegisterScreen';

// --- Student Screens ---
import DashboardScreen from './screens/student/DashboardScreen';
import AppliedJobsScreen from './screens/student/AppliedJobsScreen';
import SavedJobsScreen from './screens/student/SavedJobsScreen';
import NotificationScreen from './screens/student/NotificationScreen';
import ProfileScreen from './screens/student/ProfileScreen';

// --- Employer Screens ---
import EmployerHomeScreen from './screens/employer/EmployerHomeScreen';
import ManageJobsScreen from './screens/employer/ManageJobsScreen';
import ApplicantsScreen from './screens/employer/ApplicantsScreen';
import EmployerProfileScreen from './screens/employer/EmployerProfileScreen';
import AddJobScreen from './screens/employer/AddJobScreen';

// --- Admin Screens ---
import AdminDashboard from './screens/admin/DashboardScreen';
import AdminUsers from './screens/admin/UsersScreen';
import AdminServices from './screens/admin/ServicesScreen';
import AdminReports from './screens/admin/ReportsScreen';
import AdminChat from './screens/admin/ChatScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // role จะได้จาก Firebase หลัง Login
  const [userRole, setUserRole] = useState(null);

  // หน้า Login / Register
  const [authPage, setAuthPage] = useState('login');

  // tab หน้าแรกหลัง Login
  const [activeTab, setActiveTab] = useState('home');

  // Login สำเร็จจาก LoginScreen
  const handleLoginSuccess = (status, role) => {
    if (status && role) {
      setUserRole(role);

      if (role === 'admin') {
        setActiveTab('admin-home');
      } else if (role === 'employer') {
        setActiveTab('employer-home');
      } else {
        setActiveTab('home');
      }

      setIsLoggedIn(true);
    }
  };

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setActiveTab('home');
    setAuthPage('login');
  };

  // -------------------------
  // Auth Screens
  // -------------------------
  if (!isLoggedIn) {
    if (authPage === 'login') {
      return (
        <LoginScreen
          setIsLoggedIn={handleLoginSuccess}
          goToRegister={() => setAuthPage('register-student')}
        />
      );
    }

    if (authPage === 'register-student') {
      return (
        <StudentRegisterScreen
          goToLogin={() => setAuthPage('login')}
          goToEmployerRegister={() => setAuthPage('register-employer')}
        />
      );
    }

    if (authPage === 'register-employer') {
      return (
        <EmployerRegisterScreen
          goToLogin={() => setAuthPage('login')}
          goToStudentRegister={() => setAuthPage('register-student')}
        />
      );
    }
  }

  // Props ส่งให้ทุกหน้า
  const commonProps = {
    setPage: setActiveTab,
    setIsLoggedIn: handleLogout,
    userRole: userRole,
    activeTab: activeTab,
  };

  // -------------------------
  // Main Screens
  // -------------------------
  const renderMainScreen = () => {
    // Student
    if (userRole === 'student') {
      switch (activeTab) {
        case 'home':
          return <DashboardScreen {...commonProps} />;

        case 'applied':
          return <AppliedJobsScreen {...commonProps} />;

        case 'saved':
          return <SavedJobsScreen {...commonProps} />;

        case 'notif':
          return <NotificationScreen {...commonProps} />;

        case 'profile':
          return <ProfileScreen {...commonProps} />;

        default:
          return <DashboardScreen {...commonProps} />;
      }
    }

    // Employer
    if (userRole === 'employer') {
      switch (activeTab) {
        case 'employer-home':
          return <EmployerHomeScreen {...commonProps} />;

        case 'manage-jobs':
          return <ManageJobsScreen {...commonProps} />;

        case 'applicants':
          return <ApplicantsScreen {...commonProps} />;

        case 'employer-profile':
          return <EmployerProfileScreen {...commonProps} />;

        case 'add-job':
          return <AddJobScreen {...commonProps} />;

        default:
          return <EmployerHomeScreen {...commonProps} />;
      }
    }

    // Admin
    if (userRole === 'admin') {
      switch (activeTab) {
        case 'admin-home':
          return <AdminDashboard {...commonProps} />;

        case 'admin-users':
          return <AdminUsers {...commonProps} />;

        case 'admin-services':
          return <AdminServices {...commonProps} />;

        case 'admin-reports':
          return <AdminReports {...commonProps} />;

        case 'admin-chat':
          return <AdminChat {...commonProps} />;

        default:
          return <AdminDashboard {...commonProps} />;
      }
    }

    // กัน error กรณี role หาย
    return (
      <LoginScreen
        setIsLoggedIn={handleLoginSuccess}
        goToRegister={() => setAuthPage('register-student')}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderMainScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});