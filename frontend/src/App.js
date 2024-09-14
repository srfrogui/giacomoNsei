import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PedidoForm from './pages/PedidoForm'; 
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/formulario" element={<PedidoForm />} />
          <Route path="/calendario" element={<CalendarPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
