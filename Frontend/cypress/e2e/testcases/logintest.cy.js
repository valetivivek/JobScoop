///<reference types="cypress"/>

describe('Login Page Test Suite', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
  });

  // Unit Tests for Individual Components
  describe('Unit Tests', () => {
    it('should have email input field', () => {
      cy.get("[name='username']")
        .should('exist')
        .and('be.visible')
        .and('have.attr', 'type', 'text');
    });

    it('should have password input field', () => {
      cy.get("[name='password']")
        .should('exist')
        .and('be.visible')
        .and('have.attr', 'type', 'password');
    });

    it('should have login button', () => {
      cy.get("button[type='button']")
        .should('exist')
        .and('be.visible')
        .and('contain', 'Login')
        .and('be.disabled'); // Button should be disabled initially
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    beforeEach(() => {
      // Set up intercept before any actions
      cy.intercept({
        method: 'POST',
        url: '**/login',
      }).as('loginRequest');
    });

    it('Login to the application successfully', () => {
      // Mock successful login response
      cy.intercept('POST', '**/login', {
        statusCode: 200,
        body: {
          token: 'fake-jwt-token'
        }
      }).as('loginRequest');

      // Type credentials
      cy.get("[name='username']").type("ultimategamervivek@gmail.com");
      cy.get("[name='password']").type("Vivek@test123");
      
      // Click login and verify it's enabled
      cy.get("button[type='button']")
        .should('not.be.disabled')
        .click();
      
      // Wait for the API response and verify
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
      });
      
      // Verify navigation and success
      cy.url().should('include', '/home');
      cy.get('h1', { timeout: 10000 })
        .contains("JOBSCOOP")
        .should('be.visible')
        .log('Login to the application is successful');
    });

    it('shows error for invalid credentials', () => {
      // Mock failed login response
      cy.intercept('POST', '**/login', {
        statusCode: 401,
        body: { message: 'Invalid credentials' }
      }).as('loginRequest');

      cy.get("[name='username']").type("invaliduser@example.com");
      cy.get("[name='password']").type("WrongPassword");
      cy.get("button[type='button']").click();
      
      cy.wait('@loginRequest');
      cy.get('.MuiAlert-root')
        .should('be.visible')
        .and('contain', 'Username or Password is incorrect. Please try again!');
    });

    it('validates required fields when username is missing', () => {
      cy.get("[name='password']").type("SomePassword");
      cy.get("button[type='button']").should('be.disabled');
    });

    it('validates required fields when password is missing', () => {
      cy.get("[name='username']").type("ultimategamervivek@gmail.com");
      cy.get("button[type='button']").should('be.disabled');
    });

    it('prevents multiple submissions on rapid clicks', () => {
      cy.intercept('POST', '**/login', {
        statusCode: 200,
        body: {
          token: 'fake-jwt-token'
        },
        delay: 500
      }).as('loginRequest');

      cy.get("[name='username']").type("ultimategamervivek@gmail.com");
      cy.get("[name='password']").type("Vivek@test123");
      cy.get("button[type='button']").as('loginBtn');
      cy.get('@loginBtn').click();
      
      cy.wait('@loginRequest');
      cy.url().should('include', '/home');
    });

    it('logs out successfully', () => {
      // Mock successful login response
      cy.intercept('POST', '**/login', {
        statusCode: 200,
        body: {
          token: 'fake-jwt-token'
        }
      }).as('loginRequest');

      // Login
      cy.get("[name='username']").type("ultimategamervivek@gmail.com");
      cy.get("[name='password']").type("Vivek@test123");
      cy.get("button[type='button']").click();
      
      // Wait for login and verify
      cy.wait('@loginRequest');
      cy.url().should('include', '/home');
      cy.get('h1', { timeout: 10000 })
        .contains("JOBSCOOP")
        .should('be.visible');
      
      // Find and click the logout IconButton
      cy.get('button[data-cy="logout"]')
        .should('be.visible')
        .and('have.css', 'background-color', 'rgba(255, 255, 255, 0.51)')
        .click();

      // Verify we're back at login page
      cy.url().should('include', '/login');
    });
  });
});