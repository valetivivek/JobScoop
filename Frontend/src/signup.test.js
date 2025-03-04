import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Signup from './login/signup';

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
const renderSignupComponent = () => {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Signup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders signup form correctly', () => {
    renderSignupComponent();
    
    expect(screen.getByText('JOBSCOOP')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i, { selector: '#password' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i, { selector: '#cpassword' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Signup/i })).toBeInTheDocument();
  });

  test('signup button should be disabled initially', () => {
    renderSignupComponent();
    
    const signupButton = screen.getByRole('button', { name: /Signup/i });
    expect(signupButton).toBeDisabled();
  });

  test('shows error message for invalid email format', async () => {
    renderSignupComponent();
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.type(emailInput, 'invalid-email');
    
    expect(screen.getByText('Enter a valid Email!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Signup/i })).toBeDisabled();
  });

  // test('shows password requirements tooltip', async () => {
  //   renderSignupComponent();
    
  //   const passwordInput = screen.getByLabelText(/^Password/i);
  //   fireEvent.focus(passwordInput);
    
  //   expect(screen.getByText('At least one Uppercase, Lowercase, Number, and Special Character should be present')).toBeInTheDocument();
  // });

  test('shows error for password mismatch', async () => {
    renderSignupComponent();
    
    // Fill in signup form with mismatched passwords
    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'DifferentPassword123!');
    
    // Submit form
    const signupButton = screen.getByRole('button', { name: /Signup/i });
    await userEvent.click(signupButton);

    // Wait for error message and cleared fields
    await waitFor(() => {
      expect(screen.getByText('Please check your passwords!!')).toBeInTheDocument();
      expect(passwordInput).toHaveValue('');
      expect(confirmPasswordInput).toHaveValue('');
    }, { timeout: 3000 });
  });

  test('enables signup button with valid inputs', async () => {
    renderSignupComponent();
    
    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');

    expect(screen.getByRole('button', { name: /Signup/i })).not.toBeDisabled();
  });

  test('successful signup redirects to login page', async () => {
    renderSignupComponent();
    
    // Mock successful API response with proper structure
    axios.post.mockResolvedValueOnce({
      status: 201,
      data: { 
        message: 'USER CREATED',
        token: 'fake-token'
      }
    });
    
    // Fill in signup form
    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    
    // Submit form
    const signupButton = screen.getByRole('button', { name: /Signup/i });
    await userEvent.click(signupButton);

    // Wait for success alert and navigation with increased timeout
    const successAlert = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(successAlert).toHaveTextContent('USER CREATED');
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/signup', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });
      expect(mockedNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 5000 });
  });

  test('shows error alert for failed signup', async () => {
    renderSignupComponent();
    
    // Mock failed API response with proper error structure
    axios.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'SIGNUP Failed.. Try again !!' }
      }
    });
    
    // Fill in signup form
    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    
    // Submit form
    const signupButton = screen.getByRole('button', { name: /Signup/i });
    await userEvent.click(signupButton);

    // Wait for error message with increased timeout
    const errorAlert = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(errorAlert).toHaveTextContent('SIGNUP Failed.. Try again !!');
    
    // Verify password fields are cleared with increased timeout
    await waitFor(() => {
      expect(passwordInput).toHaveValue('');
      expect(confirmPasswordInput).toHaveValue('');
    }, { timeout: 5000 });
  });

  // test('validates password requirements', async () => {
  //   renderSignupComponent();
    
  //   // Get form elements
  //   const nameInput = screen.getByLabelText(/Name/i);
  //   const emailInput = screen.getByLabelText(/Email/i);
  //   const passwordInput = screen.getByLabelText(/^Password/i);
  //   const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
  //   const signupButton = screen.getByRole('button', { name: /Signup/i });

  //   // Fill in constant fields
  //   await userEvent.type(nameInput, 'Test User');
  //   await userEvent.type(emailInput, 'test@example.com');

  //   // Test cases for password validation
  //   const testCases = [
  //     {
  //       password: 'password123!',
  //       description: 'without uppercase',
  //       shouldBeEnabled: false
  //     },
  //     {
  //       password: 'PASSWORD123!',
  //       description: 'without lowercase',
  //       shouldBeEnabled: false
  //     },
  //     {
  //       password: 'Password!',
  //       description: 'without number',
  //       shouldBeEnabled: false
  //     },
  //     {
  //       password: 'Password123',
  //       description: 'without special character',
  //       shouldBeEnabled: false
  //     },
  //     {
  //       password: 'Password123!',
  //       description: 'with all requirements',
  //       shouldBeEnabled: true
  //     }
  //   ];

  //   // Test each password case
  //   for (const testCase of testCases) {
  //     // Clear password fields
  //     await userEvent.clear(passwordInput);
  //     await userEvent.clear(confirmPasswordInput);

  //     // Type the test password in both fields
  //     await userEvent.type(passwordInput, testCase.password);
  //     await userEvent.type(confirmPasswordInput, testCase.password);

  //     // Check button state with increased timeout
  //     await waitFor(() => {
  //       if (testCase.shouldBeEnabled) {
  //         expect(signupButton).not.toBeDisabled();
  //       } else {
  //         expect(signupButton).toBeDisabled();
  //       }
  //     }, { timeout: 5000 });
  //   }
  // });
}); 