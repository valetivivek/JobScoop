import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import PasswordReset from './login/PasswordReset';

// Mock the axios module
jest.mock('axios');

// Mock CSS imports
jest.mock('./login/login.css', () => ({}));

// Mock the useNavigate hook
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

// Helper function to render the component with necessary providers
const renderPasswordResetComponent = () => {
  return render(
    <MemoryRouter>
      <PasswordReset />
    </MemoryRouter>
  );
};

describe('PasswordReset Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders password reset form correctly', () => {
    renderPasswordResetComponent();
    
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/Enter Your Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    // Check stepper is rendered with all steps
    expect(screen.getByText('Enter Email')).toBeInTheDocument();
    expect(screen.getByText('Verify Code')).toBeInTheDocument();
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
  });

  test('email step validation', async () => {
    renderPasswordResetComponent();
    
    const emailInput = screen.getByLabelText(/Enter Your Email/i);
    const nextButton = screen.getByRole('button');
    
    // Initially button should be disabled
    expect(nextButton).toBeDisabled();
    
    // Invalid email format
    await userEvent.type(emailInput, 'invalid-email');
    expect(screen.getByText('Enter a valid Email!')).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
    
    // Valid email format
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'test@example.com');
    expect(nextButton).not.toBeDisabled();
  });

  test('successful email submission moves to verification step', async () => {
    renderPasswordResetComponent();
    
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { message: 'Verification code sent successfully' }
    });
    
    const emailInput = screen.getByLabelText(/Enter Your Email/i);
    await userEvent.type(emailInput, 'test@example.com');
    
    const nextButton = screen.getByRole('button');
    await userEvent.click(nextButton);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/forgot-password', {
        email: 'test@example.com'
      });
    }, { timeout: 5000 });

    const verificationInput = await screen.findByLabelText(/Enter Verification Code/i, {}, { timeout: 5000 });
    expect(verificationInput).toBeInTheDocument();
  });

  test('failed email submission shows error', async () => {
    renderPasswordResetComponent();
    
    // Mock failed API response with proper error structure
    axios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Error sending verification code.' }
      }
    });
    
    const emailInput = screen.getByLabelText(/Enter Your Email/i);
    await userEvent.type(emailInput, 'test@example.com');
    
    const nextButton = screen.getByRole('button');
    await userEvent.click(nextButton);
    
    // Wait for error message using findByRole for Alert
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Error sending verification code.');
    
    // Verify email field is cleared
    await waitFor(() => {
      expect(emailInput).toHaveValue('');
    });
  });

  test('verification code validation', async () => {
    renderPasswordResetComponent();
    
    // Setup: Move to verification step
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { message: 'Verification code sent successfully' }
    });
    
    const emailInput = screen.getByLabelText(/Enter Your Email/i);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button'));
    
    // Wait for verification step to load with increased timeout
    const codeInput = await screen.findByLabelText(/Enter Verification Code/i, {}, { timeout: 5000 });
    const nextButton = screen.getByRole('button');
    
    // Initially button should be disabled
    expect(nextButton).toBeDisabled();
    
    // Invalid code length
    await userEvent.type(codeInput, '12345');
    await waitFor(() => {
      expect(nextButton).toBeDisabled();
    }, { timeout: 5000 });
    
    // Clear and type valid code
    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, '123456');
    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    }, { timeout: 5000 });
  });

  test('successful code verification moves to password reset step', async () => {
    renderPasswordResetComponent();
    
    // Move to verification step
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { message: 'Verification code sent successfully' }
    });
    
    const emailInput = screen.getByLabelText(/Enter Your Email/i);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button'));
    
    // Wait for verification step and enter code
    const codeInput = await screen.findByLabelText(/Enter Verification Code/i, {}, { timeout: 5000 });
    await userEvent.type(codeInput, '123456');
    
    // Mock successful verification
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { message: 'Code verified successfully' }
    });
    
    await userEvent.click(screen.getByRole('button'));
    
    // Wait for password reset step with increased timeout
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/verify-code', {
        email: 'test@example.com',
        token: '123456'
      });
      expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('failed code verification shows error', async () => {
    renderPasswordResetComponent();
    
    // Setup: Move to verification step
    axios.post.mockResolvedValueOnce({ status: 200 });
    const emailInput = screen.getByLabelText(/Enter Your Email/i);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button'));
    
    // Wait for verification step to load
    const codeInput = await screen.findByLabelText(/Enter Verification Code/i);
    await userEvent.type(codeInput, '123456');
    
    // Mock verification failure
    axios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Invalid verification code.' }
      }
    });
    
    await userEvent.click(screen.getByRole('button'));
    
    // Wait for error message using findByRole for Alert
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Invalid verification code.');
  });

  test('password reset validation', async () => {
    renderPasswordResetComponent();
    
    // Setup: Move through email and verification steps
    axios.post.mockResolvedValueOnce({ status: 200 })
           .mockResolvedValueOnce({ status: 200 });
           
    // Step 1: Email submission
    const emailInput = screen.getByLabelText(/Enter Your Email/i);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button'));
    
    // Step 2: Code verification
    const codeInput = await screen.findByLabelText(/Enter Verification Code/i);
    await userEvent.type(codeInput, '123456');
    await userEvent.click(screen.getByRole('button'));
    
    // Step 3: Password reset form
    const newPasswordInput = await screen.findByLabelText(/New Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const resetButton = screen.getByRole('button');
    
    // Test cases for password validation
    const testCases = [
      {
        scenario: 'empty passwords',
        newPass: '',
        confirmPass: '',
        expectEnabled: false
      },
      {
        scenario: 'password without requirements',
        newPass: 'password',
        confirmPass: 'password',
        expectEnabled: false
      },
      {
        scenario: 'passwords not matching',
        newPass: 'Password123!',
        confirmPass: 'Password123@',
        expectEnabled: false,
        expectError: 'Passwords do not match.'
      },
      {
        scenario: 'valid matching passwords',
        newPass: 'Password123!',
        confirmPass: 'Password123!',
        expectEnabled: true
      }
    ];

    for (const testCase of testCases) {
      // Clear fields
      await userEvent.clear(newPasswordInput);
      await userEvent.clear(confirmPasswordInput);
      
      // Type new values
      if (testCase.newPass) await userEvent.type(newPasswordInput, testCase.newPass);
      if (testCase.confirmPass) await userEvent.type(confirmPasswordInput, testCase.confirmPass);
      
      // Check button state
      await waitFor(() => {
        if (testCase.expectEnabled) {
          expect(resetButton).not.toBeDisabled();
        } else {
          expect(resetButton).toBeDisabled();
        }
      });

      // Check for error message if expected
      if (testCase.expectError) {
        await userEvent.click(resetButton);
        const errorAlert = await screen.findByRole('alert');
        expect(errorAlert).toHaveTextContent(testCase.expectError);
      }
    }
  });

  test('successful password reset redirects to login', async () => {
    renderPasswordResetComponent();
    
    // Move to verification step
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { message: 'Verification code sent successfully' }
    });
    
    const emailInput = screen.getByLabelText(/Enter Your Email/i);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button'));
    
    // Move to password reset step
    const codeInput = await screen.findByLabelText(/Enter Verification Code/i, {}, { timeout: 5000 });
    await userEvent.type(codeInput, '123456');
    
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { message: 'Code verified successfully' }
    });
    
    await userEvent.click(screen.getByRole('button'));
    
    // Reset password with increased timeout
    const newPasswordInput = await screen.findByLabelText(/New Password/i, {}, { timeout: 5000 });
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    await userEvent.type(newPasswordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    
    // Mock successful password reset
    axios.put.mockResolvedValueOnce({
      status: 200,
      data: { message: 'Password reset successful' }
    });
    
    await userEvent.click(screen.getByRole('button'));
    
    // Wait for navigation with increased timeout
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('http://localhost:8080/reset-password', {
        email: 'test@example.com',
        new_password: 'Password123!'
      });
      expect(mockedNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 5000 });
  });

  test('failed password reset shows error', async () => {
    renderPasswordResetComponent();
    
    // Setup: Move through email and verification steps
    axios.post.mockResolvedValueOnce({ status: 200 })
           .mockResolvedValueOnce({ status: 200 });
           
    // Step 1: Email submission
    const emailInput = screen.getByLabelText(/Enter Your Email/i);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button'));
    
    // Step 2: Code verification
    const codeInput = await screen.findByLabelText(/Enter Verification Code/i);
    await userEvent.type(codeInput, '123456');
    await userEvent.click(screen.getByRole('button'));
    
    // Step 3: Password reset
    const newPasswordInput = await screen.findByLabelText(/New Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    await userEvent.type(newPasswordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    
    // Mock reset failure
    axios.put.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Failed to reset password.' }
      }
    });
    
    await userEvent.click(screen.getByRole('button'));
    
    // Wait for error message using findByRole for Alert
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Failed to reset password.');
  });
}); 