///<reference types="cypress"/>

describe('Password Reset Test', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/password-reset')
    })

    it('should render password reset form correctly', () => {
        // Check initial step (Email input)
        cy.get('#email').should('be.visible')
        cy.get('button').contains('Next').should('be.visible').and('be.disabled')
        
        // Verify stepper is visible with correct steps
        cy.contains('Enter Email').should('be.visible')
        cy.contains('Verify Code').should('be.visible')
        cy.contains('Reset Password').should('be.visible')
    })

    it('should enable Next button with valid email', () => {
        cy.get('#email').type('test@example.com')
        cy.get('button').contains('Next').should('be.enabled')
    })

    it('should show error for invalid email format', () => {
        cy.get('#email').type('invalid-email')
        cy.get('button').contains('Next').should('be.disabled')
        cy.contains('Enter a valid Email!').should('be.visible')
    })

    it('should proceed to verification code step on valid email submission', () => {
        // Set up intercept before any actions
        cy.intercept('POST', '**/forgot-password', {
            statusCode: 200
        }).as('sendCode')

        cy.get('#email').type('test@example.com')
        cy.get('button').contains('Next').click()

        cy.wait('@sendCode')
        cy.contains('Enter Verification Code').should('be.visible')
        cy.get('input[name="code"]').should('be.visible')
    })

    it('should show error for invalid verification code', () => {
        // First step - email
        cy.intercept('POST', '**/forgot-password', {
            statusCode: 200
        }).as('sendCode')

        cy.get('#email').type('test@example.com')
        cy.get('button').contains('Next').click()
        cy.wait('@sendCode')

        // Second step - verification code
        cy.intercept('POST', '**/verify-code', {
            statusCode: 401,
            body: {
                message: 'Invalid verification code.'
            }
        }).as('verifyCode')

        cy.get('input[name="code"]').type('123456')
        cy.get('button').contains('Next').click()

        cy.wait('@verifyCode')
        cy.contains('Invalid verification code').should('be.visible')
    })

    it('should proceed to password reset step on valid code', () => {
        // First step - email
        cy.intercept('POST', '**/forgot-password', {
            statusCode: 200
        }).as('sendCode')

        cy.get('#email').type('test@example.com')
        cy.get('button').contains('Next').click()
        cy.wait('@sendCode')

        // Second step - verification code
        cy.intercept('POST', '**/verify-code', {
            statusCode: 200
        }).as('verifyCode')

        cy.get('input[name="code"]').type('123456')
        cy.get('button').contains('Next').click()

        cy.wait('@verifyCode')
        cy.get('input[name="newpassword"]').should('be.visible')
        cy.get('input[name="confirmpassword"]').should('be.visible')
    })

    it('should show error for password mismatch', () => {
        // Navigate through first two steps
        cy.intercept('POST', '**/forgot-password', { statusCode: 200 }).as('sendCode')
        cy.intercept('POST', '**/verify-code', { statusCode: 200 }).as('verifyCode')

        cy.get('#email').type('test@example.com')
        cy.get('button').contains('Next').click()
        cy.wait('@sendCode')

        cy.get('input[name="code"]').type('123456')
        cy.get('button').contains('Next').click()
        cy.wait('@verifyCode')

        // Test password mismatch
        cy.get('input[name="newpassword"]').type('Password123!')
        cy.get('input[name="confirmpassword"]').type('DifferentPassword123!', { force: true })
        cy.get('button').contains('Reset Password').click()

        cy.contains('Passwords do not match').should('be.visible')
        cy.get('input[name="newpassword"]').should('have.value', '')
        cy.get('input[name="confirmpassword"]').should('have.value', '')
    })

    it('should successfully reset password and redirect to login', () => {
        // Navigate through first two steps
        cy.intercept('POST', '**/forgot-password', { statusCode: 200 }).as('sendCode')
        cy.intercept('POST', '**/verify-code', { statusCode: 200 }).as('verifyCode')
        cy.intercept('PUT', '**/reset-password', { statusCode: 200 }).as('resetPassword')

        cy.get('#email').type('test@example.com')
        cy.get('button').contains('Next').click()
        cy.wait('@sendCode')

        cy.get('input[name="code"]').type('123456')
        cy.get('button').contains('Next').click()
        cy.wait('@verifyCode')

        // Test successful password reset
        cy.get('input[name="newpassword"]').type('NewPassword123!')
        cy.get('input[name="confirmpassword"]').type('NewPassword123!', { force: true })
        cy.get('button').contains('Reset Password').click()

        cy.wait('@resetPassword')
        cy.url().should('include', '/login')
    })

    it('should validate password requirements', () => {
        // Navigate to password reset step
        cy.intercept('POST', '**/forgot-password', { statusCode: 200 }).as('sendCode')
        cy.intercept('POST', '**/verify-code', { statusCode: 200 }).as('verifyCode')

        cy.get('#email').type('test@example.com')
        cy.get('button').contains('Next').click()
        cy.wait('@sendCode')

        cy.get('input[name="code"]').type('123456')
        cy.get('button').contains('Next').click()
        cy.wait('@verifyCode')

        // Test password without uppercase
        cy.get('input[name="newpassword"]').type('password123!')
        cy.get('button').contains('Reset Password').should('be.disabled')

        // Test password without lowercase
        cy.get('input[name="newpassword"]').clear().type('PASSWORD123!')
        cy.get('button').contains('Reset Password').should('be.disabled')

        // Test password without number
        cy.get('input[name="newpassword"]').clear().type('Password!')
        cy.get('button').contains('Reset Password').should('be.disabled')

        // Test password without special character
        cy.get('input[name="newpassword"]').clear().type('Password123')
        cy.get('button').contains('Reset Password').should('be.disabled')

        // Test valid password
        cy.get('input[name="newpassword"]').clear().type('Password123!')
        cy.get('input[name="confirmpassword"]').type('Password123!', { force: true })
        cy.get('button').contains('Reset Password').should('be.enabled')
    })
})
  