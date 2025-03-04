import { Outlet } from 'react-router-dom';
import Header from './headers/header';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from "./contexts/AuthContext";

const Layout = () => {
    const { user } = useContext(AuthContext); 

    return (
        <div className=' container-fluid p-0 overflow-hidden '>
            {user ? <Header /> : null} 
            <Outlet />
        </div>
    );
};

export default Layout;
