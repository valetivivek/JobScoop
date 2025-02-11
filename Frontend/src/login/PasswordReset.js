import React, { useState, useEffect } from "react";
import {
    Card, CardContent, Typography, Button, TextField, Snackbar, Alert, Stepper, Step, StepLabel,
    Tooltip
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";

function PasswordReset() {
    const [activeStep, setActiveStep] = useState(0);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [disabled, setDisabled] = useState(true);
    const [valueErr, setvalueErr] = useState({ emailerr: false, passworderr: false });



    const navigate = useNavigate();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;


    const onChange = (event) => {

        event.preventDefault();
        const { name, value } = event.target;

        if (name === 'email') {
            setEmail(value);
            setvalueErr(prev => ({ ...prev, emailerr: !emailRegex.test(value) }))
        }
        if (name === 'code') {
            setCode(value);
        }
        if (name === 'newpassword') {
            setNewPassword(value);
            setvalueErr(prev => ({ ...prev, emailerr: !passwordRegex.test(value) }))

        }
        if (name === 'confirmpassword') {
            setConfirmPassword(value);
        }
        // setError(false);
    };


    const handleNext = async () => {
        if (activeStep === 0) {
            // Send email for verification
            try {
                await axios.post("http://localhost:8080/forgot-password", { "email": email });
                setActiveStep(1);
            } catch (error) {
                setEmail("")
                setErrorMessage("Error sending verification code.");
                setError(true);
            }
        } else if (activeStep === 1) {
            // Verify code
            try {
                await axios.post("http://localhost:8080/verify-code", { "email":email, "token":code });
                setActiveStep(2);
            } catch (error) {
                setErrorMessage("Invalid verification code.");
                setError(true);
            }
        } else if (activeStep === 2) {
            // Reset password
            if (newPassword !== confirmPassword) {
                setNewPassword("")
                setConfirmPassword("")
                setErrorMessage("Passwords do not match.");
                setError(true);
                return;
            }
            try {
                await axios.put("http://localhost:8080/reset-password", { "email":email, "new_password":newPassword });
                navigate("/login");
            } catch (error) {
                setErrorMessage("Failed to reset password.");
                setError(true);
            }
        }
        setDisabled(true)
    };

    useEffect(() => {
        if (activeStep === 0 && email !== "" && emailRegex.test(email)) {
            setDisabled(false)
        }
        else if (activeStep === 1 && code !== "" && code.length === 6) {
            setDisabled(false)

        }
        else if (activeStep === 2 && newPassword !== "" && confirmPassword !== "" && passwordRegex.test(newPassword)) {
            setDisabled(false)
        }
        else {
            setDisabled(true)
        }
    }, [email, code, newPassword, confirmPassword]);


    const handleClose = () => setError(false);

    return (
        <div className="bg-image d-flex justify-content-center align-items-center vh-100 bg-secondary p-4">
            <Card className="card-container row shadow-lg rounded" style={{ backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(7px)" }}>
                <CardContent style={{ marginTop: '40px' }}>
                    <Typography variant="h4" className="font-serif text-center fw-bold mb-4">
                        Reset Password
                    </Typography>

                    {/* Stepper */}
                    <Stepper activeStep={activeStep} alternativeLabel>
                        <Step><StepLabel>Enter Email</StepLabel></Step>
                        <Step><StepLabel>Verify Code</StepLabel></Step>
                        <Step><StepLabel>Reset Password</StepLabel></Step>
                    </Stepper>

                    {/* Step Content */}
                    {activeStep === 0 && (
                        <TextField
                            label="Enter Your Email"
                            variant="outlined"
                            fullWidth
                            value={email}
                            name="email"
                            id='email'
                            error={valueErr.emailerr}
                            helperText={valueErr.emailerr ? "Enter a valid Email!" : ""}
                            onChange={onChange}
                            className="mt-3"
                        />
                    )}

                    {activeStep === 1 && (
                        <TextField
                            label="Enter Verification Code"
                            variant="outlined"
                            fullWidth
                            name='code'
                            value={code}
                            type="number"
                            onChange={onChange}
                            className="mt-3"
                            helperText={"6 digit code is expected"}

                        />
                    )}

                    {activeStep === 2 && (
                        <>
                            <Tooltip title="At least one Uppercase, Lowercase, Number, and Special Character should be present" arrow>
                                <TextField
                                    label="New Password"
                                    type="password"
                                    variant="outlined"
                                    fullWidth
                                    name="newpassword"
                                    error={valueErr.passworderr}
                                    value={newPassword}
                                    onChange={onChange}
                                    className="mt-3"
                                />
                            </Tooltip>
                            <TextField
                                label="Confirm Password"
                                type="password"
                                variant="outlined"
                                fullWidth
                                name="confirmpassword"
                                value={confirmPassword}
                                onChange={onChange}
                                className="mt-3"
                            />
                        </>
                    )}

                    {/* Next Button */}
                    <Button
                        variant="contained"
                        fullWidth
                        className="btn btn-success py-2 mt-4"
                        onClick={handleNext}
                        disabled={disabled}
                    >
                        {activeStep === 2 ? "Reset Password" : "Next"}
                    </Button>
                </CardContent>
            </Card>

            {/* Error Snackbar */}
            <Snackbar open={error} autoHideDuration={2000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="error" variant="filled">
                    {errorMessage}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default PasswordReset;
