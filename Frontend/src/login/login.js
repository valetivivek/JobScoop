import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, Typography, Button, TextField, Snackbar, Alert } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
// import Myimage from '../assets/check2.png';
// import Myimage2 from '../assets/pic4.jpeg';
import './login.css'
import { AuthContext } from "../contexts/AuthContext";



function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [disabled, setDisabled] = useState(true);
    const [error, setError] = useState(false);
    const { login } = useContext(AuthContext);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    const navigate = useNavigate();

    const onChange = (event) => {
        event.preventDefault();
        const { name, value } = event.target;

        if (name === 'username') {
            setUsername(value);
        }
        if (name === 'password') {
            setPassword(value);
        }
        setError(false);
    };


    const fetchData = async (data) => {
        try {
            const response = await axios.post('http://localhost:8080/login', data);
            console.log("api response",response);
            return response
        } catch (error) {
            console.error('Error fetching data:', error);
            return {stats:401,msg:'invalid credentials'}
        }
    };

    const validateAuth = async() => {
        console.log("Validating...");
        let data = { "email": username, "password": password }
        let response = await fetchData(data)
        if (response.status===200) {
            let userData = { "username": username }
            login(response.data.token, userData)
            navigate("/home");
        } else {
            setError(true);
            setUsername("");
            setPassword("");
        }
    };

    const handleClose = () => {
        setError(false);
    };

    useEffect(() => {
        setDisabled(username === "" || password === "" || !emailRegex.test(username));
    }, [username, password]);

    useEffect(() => {
        if (localStorage.getItem('user')) {
          // If already logged in, redirect them away from the login page
          navigate('/home'); 
        }
      }, []);

    return (
        <div className="bg-image  d-flex justify-content-center  align-items-center vh-100 bg-secondary p-4">
            {/* Main Card */}
            <Card className="card-container row shadow-lg rounded" style={{ backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(7px)" }}>
                {/* Left Section */}
                <div className="w-fit p-5 d-flex flex-column justify-content-center">
                    <Typography variant="h4" className=" font-serif text-center fw-bold mb-4" >
                        JOBSCOOP
                    </Typography>

                    {/* Username Input */}
                    <TextField
                        label="Email"
                        variant="outlined"
                        fullWidth
                        id='username'
                        name='username'
                        value={username}
                        error={username!=="" && !emailRegex.test(username)}
                        helperText={username!==""&& !emailRegex.test(username) ? "Enter a valid Email!" : ""}
                        onChange={onChange}
                        className="mb-3"
                    />

                    {/* Password Input */}
                    <TextField
                        label="Password"
                        type="password"
                        variant="outlined"
                        id='password'
                        name='password'
                        value={password}
                        fullWidth
                        onChange={onChange}
                    />
                    <div className="row justify-content-center  align-items-center m-0" style={{ display: 'flex', flex: 'nowrap' ,direction:'rtl' }}>
                        <p > <Link to="/password-reset" className="fw-bold text-primary w-auto p-0" >Forgot Password</Link></p>
                    </div>

                    {/* Login Button */}
                    <Button
                        variant="contained"
                        disabled={disabled}
                        fullWidth
                        className="btn btn-success py-2 mb-3"
                        onClick={validateAuth}
                    >
                        Login
                    </Button>

                    <div className="row justify-content-center  align-items-center" style={{ display: 'flex', flex: 'nowrap' }}>
                        <p className="text-muted w-auto pr-1">Don't have an account? <Link to="/signup" className="fw-bold text-primary w-auto p-0" >Signup</Link></p>
                    </div>
                </div>

                {/* Right Section */}
                {/* <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-primary ">
                    <img
                        src={Myimage2}
                        alt="Login Illustration"
                        className="img-fluid rounded shadow-lg"
                    />
                </div> */}
            </Card>

            <Snackbar open={error} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="error" variant="filled">
                    Username or Password is incorrect. Please try again!
                </Alert>
            </Snackbar>
        </div>
    );
}

export default Login;
