import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './contexts/AuthContext';
import Login from './login/login';

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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Helper function to render the component with necessary providers
const renderLoginComponent = (authContextValue = { login: jest.fn() }) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authContextValue}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<div>Home Page</div>} />
          <Route path="/signup" element={<div>Signup Page</div>} />
          <Route path="/password-reset" element={<div>Password Reset Page</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockedNavigate.mockClear();
  });

  test('renders login form correctly', () => {
    renderLoginComponent();
    
    expect(screen.getByText('JOBSCOOP')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
  });

  test('login button should be disabled initially', () => {
    renderLoginComponent();
    
    const loginButton = screen.getByRole('button', { name: /Login/i });
    expect(loginButton).toBeDisabled();
  });

  test('login button should be enabled when valid email and password are entered', async () => {
    renderLoginComponent();
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    expect(loginButton).not.toBeDisabled();
  });

  test('shows error message for invalid email format', async () => {
    renderLoginComponent();
    
    const emailInput = screen.getByLabelText(/Email/i);
    
    await userEvent.type(emailInput, 'invalid-email');
    
    expect(screen.getByText('Enter a valid Email!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeDisabled();
  });

  test('successful login redirects to home page', async () => {
    const mockLogin = jest.fn();
    renderLoginComponent({ login: mockLogin });
    
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { token: 'fake-token' },
    });
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockLogin).toHaveBeenCalledWith('fake-token', { username: 'test@example.com' });
      expect(mockedNavigate).toHaveBeenCalledWith('/home');
    });
  });

  test('shows error alert for failed login', async () => {
    renderLoginComponent();
    
    // Mock failed API response with proper error structure
    axios.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Username or Password is incorrect. Please try again!' }
      }
    });
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(loginButton);
    
    // Wait for error alert using MUI's Alert component
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Username or Password is incorrect. Please try again!');
    
    // Verify fields are cleared
    await waitFor(() => {
      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    }, { timeout: 3000 });
  });

  test('navigates to sign up page when sign up link is clicked', async () => {
    renderLoginComponent();
    
    const signupLink = screen.getByText('Signup');
    fireEvent.click(signupLink);
    
    expect(mockedNavigate).toHaveBeenCalledWith('/signup');
  });

  test('navigates to password reset page when forgot password link is clicked', async () => {
    renderLoginComponent();
    
    const forgotPasswordLink = screen.getByText('Forgot Password');
    fireEvent.click(forgotPasswordLink);
    
    expect(mockedNavigate).toHaveBeenCalledWith('/password-reset');
  });

  test('redirects to home page if user is already logged in', async () => {
    // Mock localStorage with both token and user
    const mockUser = { username: 'test@example.com' };
    const mockToken = 'fake-token';
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUser);
      if (key === 'token') return mockToken;
      return null;
    });

    // Mock AuthContext with proper initial state
    const mockAuthContext = {
      login: jest.fn(),
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
      logout: jest.fn()
    };

    // Render with mocked context
    renderLoginComponent(mockAuthContext);

    // Wait for navigation with increased timeout
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/home');
    }, { timeout: 5000 });
  });

  test('error snackbar closes when close button is clicked', async () => {
    renderLoginComponent();
    
    // Mock failed API response with proper error structure
    axios.post.mockRejectedValueOnce({
      response: { 
        status: 401,
        data: { message: 'Username or Password is incorrect. Please try again!' }
      }
    });
    
    // Fill in login form
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    
    // Submit form
    const loginButton = screen.getByRole('button', { name: /Login/i });
    await userEvent.click(loginButton);
    
    // Wait for error message with increased timeout
    const errorAlert = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(errorAlert).toBeInTheDocument();
    
    // Find and click close button using MUI's close button
    const closeButton = await screen.findByTestId('CloseIcon', {}, { timeout: 5000 });
    await userEvent.click(closeButton);
    
    // Verify error message is gone with increased timeout
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });
});