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


function Landing() {
    const { logout } = useContext(AuthContext);
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return (
        <div className=' container-fluid p-0 overflow-hidden '>
            <div className='container-fluid p-0  overflow-hidden' style={{ background: '#909692' }}>
                <div className="row">
                    <div className='col-6'>
                        <h1 style={{ paddingLeft: '15px', marginLeft: '15px' }}>JOBSCOOP</h1>
                    </div>
                    <div className='col-6 align-items-center' style={{ direction: 'rtl', paddingRight: '25px' }}>
                        <IconButton color="error" style={{ padding: '0px', marginTop: '12px' }} onClick={logout}>
                            <LogoutIcon />
                        </IconButton>
                    </div>
                </div>

            </div>
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
