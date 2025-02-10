import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, TextField, Tooltip,Snackbar,Alert } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';

// import Myimage2 from '../assets/pic4.jpeg';
// import Myimage from '../assets/check2.png';
import './login.css'

function Signup() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setCpassword] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [alertmsg, setalertmsg] = useState({"open":false,"msg":"","type":""});
  
  const [error, setError] = useState({ Emailerr: false, Passworderr: false });

  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

  const onChange = (event) => {
    event.preventDefault();
    const { name, value } = event.target;

    if (name === 'name') {
      setName(value);
    }
    if (name === 'email') {
      setEmail(value);
      setError(prev => ({ ...prev, Emailerr: !emailRegex.test(value) }));
    }
    if (name === 'password') {
      setPassword(value);
      setError(prev => ({ ...prev, Passworderr: !passwordRegex.test(value) }));
    }
    if (name === 'cpassword') {
      setCpassword(value);
    }
  };

  const handleClose = () => {
    setalertmsg({"open":false,"msg":"","type":""});
};

  const fetchData = async (data) => {
    try {
      const response = await axios.post('http://localhost:8080/signup', data);
      console.log("api response signup",response);
      setalertmsg({"open":true,"msg":"USER CREATED","type":"success"});
      return response
    } catch (error) {
      console.error('Error fetching data:', error);
      setalertmsg({"open":true,"msg":"SIGNUP Failed.. Try again !!","type":"error"});
      return {status:401}

    }
  };
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


  const validateAuth = async () => {
    if (password === cpassword) {
      console.log("All necessary details entered");
      let data = { "name": name, "email": email, "password": password }
      let response = await fetchData(data)
      console.log("returned response",response)
      if(response.status===201){
        console.log("inside redirect")
        await sleep(1000);
        navigate("/login"); // Navigate to the home page after signup
      }
      else{
        setPassword("")
        setCpassword("")
      }
    } else {
      console.log("Please check your passwords");
      setPassword("")
      setCpassword("")
      setalertmsg({"open":true,"msg":"Please check your passwords!!","type":"error"});

    }
  };

  useEffect(() => {
    console.log("erroe", error)
    if (name !== "" && email !== "" && password !== "" && cpassword !== "" && !error.Emailerr && !error.Passworderr) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [name, email, password, cpassword]);

  return (
    <div className="bg-image d-flex justify-content-center align-items-center vh-100 bg-secondary p-4">
      {/* Main Card */}
      <Card className="card-container row shadow-lg rounded" style={{ backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(7px)" }}>
        {/* Left Section (Form) */}
        <div className="w-fit p-5 d-flex flex-column justify-content-center">
          <Typography variant="h4" className="text-center fw-bold mb-4">
            JOBSCOOP
          </Typography>

          {/* Name Input */}
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            id='name'
            name='name'
            value={name}
            onChange={onChange}
            className="mb-3"
          />

          {/* Email Input */}
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            id='email'
            name='email'
            value={email}
            error={email !== "" ? !emailRegex.test(email) : false}
            helperText={error.Emailerr ? "Enter a valid Email!" : ""}
            onChange={onChange}
            className="mb-3"
          />

          {/* Password Input with Tooltip */}
          <Tooltip title="At least one Uppercase, Lowercase, Number, and Special Character should be present" arrow>
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              id='password'
              name='password'
              value={password}
              fullWidth
              error={password !== "" ? !passwordRegex.test(password) : false}
              onChange={onChange}
              className="mb-3"
            />
          </Tooltip>

          {/* Confirm Password Input */}
          <TextField
            label="Confirm Password"
            type="password"
            variant="outlined"
            id='cpassword'
            name='cpassword'
            value={cpassword}
            fullWidth
            error={error.Cpassworderr}
            helperText={error.Cpassworderr ? "Passwords do not match!" : ""}
            onChange={onChange}
            className="mb-3"
          />

          {/* Signup Button */}
          <Button
            variant="contained"
            disabled={disabled}
            fullWidth
            className="btn btn-success py-2 mb-3"
            onClick={validateAuth}
          >
            Signup
          </Button>
        </div>
      </Card>

      <Snackbar open={alertmsg.open} autoHideDuration={2000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={alertmsg.type} variant="filled">
          {alertmsg.msg}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Signup;
