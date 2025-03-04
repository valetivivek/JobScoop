///<reference types="cypress"/>

describe('Subscription Test Suite', () => {
    beforeEach(() => {
        // Visit login page first
        cy.visit('http://localhost:3000/login');

        // Set up intercepts before performing actions
        cy.intercept({
            method: 'POST',
            url: '**/login'
        }).as('loginRequest');

        cy.intercept('GET', '**/fetch-all-subscriptions', {
            statusCode: 200,
            body: {
                companies: {
                    'Google': ['careers.google.com'],
                    'Microsoft': ['careers.microsoft.com'],
                    'Amazon': ['amazon.jobs']
                },
                roles: ['Software Engineer', 'Product Manager', 'Data Scientist']
            }
        }).as('fetchSubscriptions');

        cy.intercept('POST', '**/fetch-user-subscriptions', {
            statusCode: 200,
            body: {
                subscriptions: [
                    {
                        companyName: 'Google',
                        careerLinks: ['careers.google.com'],
                        roleNames: ['Software Engineer']
                    }
                ]
            }
        }).as('fetchUserSubscriptions');

        // Perform login
        cy.get('#username').should('be.visible').type("ultimategamervivek@gmail.com", { delay: 100 });
        cy.get('#password').should('be.visible').type("Vivek@test123", { delay: 100 });
        cy.get('button.MuiButton-containedPrimary').contains('Login')
            .should('be.visible')
            .click();
        
        // Wait for login and verify
        cy.wait('@loginRequest').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            // Store token in localStorage
            window.localStorage.setItem('token', interception.response.body.token);
        });

        // Verify successful login
        cy.url().should('include', '/home');
        cy.get('h1').contains("JOBSCOOP").should('be.visible');

        // Navigate to subscriptions page and wait for data
        cy.visit('http://localhost:3000/subscribe');
        cy.wait(['@fetchUserSubscriptions', '@fetchSubscriptions'], { timeout: 10000 });
        
        // Wait for the page to be fully loaded
        cy.contains('MANAGE YOUR SUBSCRIPTIONS', { timeout: 10000 }).should('be.visible');
    });

    it('should add new subscription successfully', () => {
        // Mock save subscription endpoint
        cy.intercept('POST', '**/save-subscriptions', {
            statusCode: 200,
            body: { message: 'Subscriptions saved successfully!' }
        }).as('saveSubscriptions');

        // Click add subscriptions button and wait for navigation
        cy.contains('button', 'Add Subscriptions', { timeout: 10000 })
            .should('be.visible')
            .click();
        cy.url().should('include', '/subscribe/addsubscriptions');

        // Fill in subscription details with delays
        cy.get('input[id="companyName-1"]', { timeout: 10000 })
            .should('be.visible')
            .type('Microsoft', { delay: 100 });

        cy.wait(1000); // Wait for company name to be processed

        cy.get('input[id="careerLinks-1"]', { timeout: 10000 })
            .should('be.visible')
            .type('careers.microsoft.com{enter}', { delay: 100 });

        cy.wait(1000); // Wait for URL to be processed

        cy.get('input[id="roleNames-1"]', { timeout: 10000 })
            .should('be.visible')
            .type('Software Engineer{enter}', { delay: 100 });

        cy.wait(1000); // Wait for role to be processed

        // Save subscription
        cy.contains('button', 'Save Subscriptions', { timeout: 10000 })
            .should('be.visible')
            .and('not.be.disabled')
            .click();

        // Wait for save and verify
        cy.wait('@saveSubscriptions');
        cy.contains('Subscriptions saved successfully!', { timeout: 10000 }).should('be.visible');
    });

    it('should modify existing subscription', () => {
        // Set up update intercept
        cy.intercept('PUT', '**/update-subscriptions', {
            statusCode: 200,
            body: { message: 'Update Successful' }
        }).as('updateSubscriptions');

        // Click modify button
        cy.contains('button', 'Modify', { timeout: 10000 })
            .should('be.visible')
            .click();

        cy.wait(1000); // Wait for fields to become editable

        // Update company name
        cy.get('input[id="companyName-0"]', { timeout: 10000 })
            .should('be.enabled')
            .clear({ delay: 50 })
            .type('Microsoft', { delay: 100 });

        cy.wait(1000); // Wait for company name to be processed

        // Add new role
        cy.get('input[id="careerLinks-0"]', { timeout: 10000 })
            .should('be.visible')
            .type('http://www.microsoft.careers.com/sde{enter}', { delay: 100 });

        cy.wait(1000); // Wait for role to be processed

        // Save changes
        cy.contains('button', 'Save Changes', { timeout: 10000 })
            .should('be.visible')
            .and('not.be.disabled')
            .click();

        // Verify update
        cy.wait('@updateSubscriptions');
        cy.contains('Update Successful', { timeout: 10000 }).should('be.visible');
    });

    it('should delete subscription', () => {
        // Set up delete intercept
        cy.intercept('POST', '**/delete-subscriptions', {
            statusCode: 200,
            body: { message: 'Delete Successful' }
        }).as('deleteSubscription');

        cy.contains('button', 'Modify', { timeout: 10000 })
            .should('be.visible')
            .click();

        // Wait for subscriptions to load and click delete
        cy.get('button[id="delete-0"]', { timeout: 10000 })
            .should('be.visible')
            .first()
            .click();

        // Verify deletion
        cy.wait('@deleteSubscription');
        cy.contains('Delete Successful', { timeout: 10000 }).should('be.visible');
    });

    it('should validate required fields when adding subscription', () => {
        // Navigate to add subscriptions
        cy.contains('button', 'Add Subscriptions', { timeout: 10000 })
            .should('be.visible')
            .click();
        
        cy.wait(1000); // Wait for form to load

        cy.get('input[id="companyName-0"]', { timeout: 10000 })
            .should('be.enabled')
            .clear({ delay: 50 })
            .type('Microsoft', { delay: 100 });

        // Try to save without data
        cy.contains('button', 'Save Subscriptions', { timeout: 10000 })
            .should('be.visible')
            .click();
        
        // Verify validation messages
        // cy.contains('Company name is required', { timeout: 10000 })
        //     .should('be.visible')
        //     .and('have.css', 'color', 'rgb(211, 47, 47)');
        
        cy.contains('At least one job role is required', { timeout: 10000 })
            .should('be.visible')
            .and('have.css', 'color', 'rgb(211, 47, 47)');
    });
});