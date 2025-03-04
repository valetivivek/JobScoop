import React, { useContext } from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import { IconButton, Tooltip } from "@mui/material";
import { AuthContext } from '../contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import '../index.css';

function Header() {
    const { logout } = useContext(AuthContext);

    return (
        <div className='container-fluid p-0 shadow-sm' style={{ background: '#3f51b5', height: '70px' }}>
            <div className="row h-100 m-0">
                <div className='col-md-4 d-flex align-items-center'>
                    <h1 style={{
                        paddingLeft: '20px',
                        color: 'white',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: '700',
                        letterSpacing: '1px'
                    }}>
                        JOBSCOOP
                    </h1>
                </div>

                <div className='col-md-8 d-flex align-items-center justify-content-end pe-4'>
                    <div className="nav-links me-4" style={{ marginRight: '40px' }}>
                        <NavLink
                            to="/home"
                            className={({ isActive }) =>
                                isActive
                                    ? "nav-item nav-active-link"
                                    : "nav-item nav-inactive"
                            }
                        >
                            HOME
                        </NavLink>

                        <NavLink
                            to="/subscribe"
                            className={({ isActive }) =>
                                isActive
                                    ? "nav-item nav-active-link"
                                    : "nav-item nav-inactive"
                            }
                        >
                            SUBSCRIBE
                        </NavLink>

                        <NavLink
                            to="/trends"
                            className={({ isActive }) =>
                                isActive
                                    ? "nav-item nav-active-link"
                                    : "nav-item nav-inactive"
                            }
                        >
                            TRENDS
                        </NavLink>
                    </div>

                    <Tooltip title="Logout">
                        <IconButton
                            data-cy='logout'
                            color="inherit"
                            onClick={logout}
                            sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.51)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.74)'
                                }
                            }}
                        >
                            <LogoutIcon sx={{ color: 'red' }} />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}

export default Header;