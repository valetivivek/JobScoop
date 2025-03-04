import logo from './logo.svg';
import './App.css';
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import router from './Routes/routes';



function App() {
    const { user } = useContext(AuthContext);
  
  return (
    <RouterProvider router={router}>
    </RouterProvider>
  );
}

export default App;
