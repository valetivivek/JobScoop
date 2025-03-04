import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, Typography, Button, TextField, Snackbar, Alert } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext } from "./contexts/AuthContext";
import { IconButton } from "@mui/material";
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import './landing.css'
import Header from './headers/header';


function Landing() {
    const { logout } = useContext(AuthContext);

    return (
        <div className=' container-fluid p-0 overflow-hidden '>

            <div className='row ' style={{ margin: "20px" }}>

                <div className='row '>
                    <Skeleton variant="rectangular" animation="pulse" className='skeleton-margins' width={400} height={30} />
                    <Skeleton variant="rectangular" animation="pulse" className='skeleton-margins' width={400} height={30} />
                </div>


                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
                <Skeleton variant="rectangular" animation="wave" className='skeleton-margins' width={210} height={150} />
            </div>
        </div>
    );
}

export default Landing;
