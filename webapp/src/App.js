import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import Profile from './pages/Profile/Profile';
import Cuisines from './pages/Cuisines/Cuisines';
import CuisineRestaurants from './pages/Cuisines/CuisineRestaurants';
import DietaryPreferences from './pages/Dietary/DietaryPreferences';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cuisines" element={<Cuisines />} />
          <Route path="/cuisines/:cuisineTitle" element={<CuisineRestaurants />} />
          <Route path="/dietary/:preference" element={<DietaryPreferences />} />
          {/* Add other routes as needed */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
