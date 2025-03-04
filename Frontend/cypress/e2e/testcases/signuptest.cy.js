///<reference types="cypress"/>

describe('Signup Test', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/signup')
        cy.intercept('POST', '**/signup').as('signupRequest')
    })

    it('should render signup form correctly', () => {
        cy.get('#name').should('be.visible')
        cy.get('#email').should('be.visible')
        cy.get('#password').should('be.visible')
        cy.get('#cpassword').should('be.visible')
        cy.get('button').contains('Signup').should('be.visible').and('be.disabled')
    })

    it('should enable signup button with valid inputs', () => {
        cy.get('#name').type('Test User')
        cy.get('#email').type('test@example.com')
        cy.get('#password').type('Password123!')
        cy.get('#cpassword').type('Password123!', { force: true })
        cy.get('button').contains('Signup').should('be.enabled')
    })

    it('should show error for invalid email format', () => {
        cy.get('#name').type('Test User')
        cy.get('#email').type('invalid-email')
        cy.get('#password').type('Password123!')
        cy.get('#cpassword').type('Password123!', { force: true })
        cy.get('button').contains('Signup').should('be.disabled')
        cy.contains('Enter a valid Email!').should('be.visible')
    })

    it('should validate password requirements', () => {
        cy.get('#name').type('Test User')
        cy.get('#email').type('test@example.com')

        // Test password without uppercase
        cy.get('#password').type('password123!')
        cy.get('#cpassword').type('password123!', { force: true })
        cy.get('button').contains('Signup').should('be.disabled')
        cy.get('#password').clear()
        cy.get('#cpassword').clear({ force: true })

        // Test password without lowercase
        cy.get('#password').type('PASSWORD123!')
        cy.get('#cpassword').type('PASSWORD123!', { force: true })
        cy.get('button').contains('Signup').should('be.disabled')
        cy.get('#password').clear()
        cy.get('#cpassword').clear({ force: true })

        // Test password without number
        cy.get('#password').type('Password!')
        cy.get('#cpassword').type('Password!', { force: true })
        cy.get('button').contains('Signup').should('be.disabled')
        cy.get('#password').clear()
        cy.get('#cpassword').clear({ force: true })

        // Test password without special character
        cy.get('#password').type('Password123')
        cy.get('#cpassword').type('Password123', { force: true })
        cy.get('button').contains('Signup').should('be.disabled')
        cy.get('#password').clear()
        cy.get('#cpassword').clear({ force: true })

        // Test valid password
        cy.get('#password').type('Password123!')
        cy.get('#cpassword').type('Password123!', { force: true })
        cy.get('button').contains('Signup').should('be.enabled')
    })

    it('should show error for password mismatch', () => {
        cy.get('#name').type('Test User')
        cy.get('#email').type('test@example.com')
        cy.get('#password').type('Password123!')
        cy.get('#cpassword').type('DifferentPassword123!', { force: true })
        cy.get('button').contains('Signup').click()
        
        cy.contains('Please check your passwords!!').should('be.visible')
        cy.get('#password').should('have.value', '')
        cy.get('#cpassword').should('have.value', '')
    })

    it('should successfully create account and redirect to login', () => {
        cy.intercept('POST', '**/signup', {
            statusCode: 201,
            body: {
                message: 'User created successfully'
            }
        }).as('successfulSignup')

        cy.get('#name').type('Test User')
        cy.get('#email').type('test@example.com')
        cy.get('#password').type('Password123!')
        cy.get('#cpassword').type('Password123!', { force: true })
        cy.get('button').contains('Signup').click()

        cy.wait('@successfulSignup')
        cy.contains('USER CREATED').should('be.visible')
        cy.url().should('include', '/login')
    })

    it('should show error on signup failure', () => {
        cy.intercept('POST', '**/signup', {
            statusCode: 401,
            body: {
                message: 'Signup failed'
            }
        }).as('failedSignup')

        cy.get('#name').type('Test User')
        cy.get('#email').type('test@example.com')
        cy.get('#password').type('Password123!')
        cy.get('#cpassword').type('Password123!', { force: true })
        cy.get('button').contains('Signup').click()

        cy.wait('@failedSignup')
        cy.contains('SIGNUP Failed.. Try again !!').should('be.visible')
        cy.get('#password').should('have.value', '')
        cy.get('#cpassword').should('have.value', '')
    })

    it('should disable signup button when required fields are empty', () => {
        // Test with missing name
        cy.get('#email').type('test@example.com')
        cy.get('#password').type('Password123!')
        cy.get('#cpassword').type('Password123!', { force: true })
        cy.get('button').contains('Signup').should('be.disabled')

        // Test with missing email
        cy.get('#name').type('Test User')
        cy.get('#email').clear()
        cy.get('button').contains('Signup').should('be.disabled')

        // Test with missing password
        cy.get('#email').type('test@example.com')
        cy.get('#password').clear()
        cy.get('button').contains('Signup').should('be.disabled')

        // Test with missing confirm password
        cy.get('#password').type('Password123!')
        cy.get('#cpassword').clear({ force: true })
        cy.get('button').contains('Signup').should('be.disabled')
    })

    it('should show password requirements tooltip', () => {
        cy.get('#password').focus()
        cy.contains('At least one Uppercase, Lowercase, Number, and Special Character should be present')
            .should('be.visible')
    })
})
  