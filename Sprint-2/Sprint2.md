# Sprint 2 Report

# User Stories  
## Subscription Management  
- **As a user,** I want to subscribe to job sites of companies with my preferred roles.  
- **As a user,** I want to edit my subscribed job sites, companies, and preferred roles.  
- **As a user,** I want to delete my subscribed job sites, companies, and preferred roles.
- **As a user,** I want to fetch my subscribed job sites, companies, and preferred roles.
- **As a user,** I want to fetch all subscriptions in the database.

## Planned Issues
1. Implement the **Save Subscription API** on the backend.
2. Implement the **Save Subscription functionality** on the frontend.
3. Implement the **Fetch User Subscriptions API** on the backend.
4. Implement the **Fetch User Subscriptions functionality** on the frontend.
5. Implement the **Update Subscriptions API** on the backend.
6. Implement the **Update Subscriptions functionality** on the frontend.
7. Implement the **Delete Subscriptions API** on the backend.
8. Implement the **Delete Subscriptions functionality** on the frontend.
9. Implement the **Fetch All Subscriptions API** on the backend.
10. Implement the **Fetch All Subscriptions functionality** on the frontend.
11. Write unit tests for all subscription API handlers.
12. Create the **Subscriptions Management Screen** on the frontend.
13. Integrate the frontend with the backend subscription APIs.
14. Implement state management for subscriptions (using Redux or Context API).

## Completed Issues
1. **Save Subscription API** implemented on the backend. (Completed)
2. **Save Subscription functionality** implemented on the frontend. (Completed)
3. **Fetch User Subscriptions API** implemented on the backend. (Completed)
4. **Fetch User Subscriptions functionality** implemented on the frontend. (Completed)
5. **Update Subscriptions API** implemented on the backend. (Completed)
6. **Update Subscriptions functionality** implemented on the frontend. (Completed)
7. **Delete Subscriptions API** implemented on the backend. (Completed)
8. **Delete Subscriptions functionality** implemented on the frontend. (Completed)
9. **Fetch All Subscriptions API** implemented on the backend. (Completed)
10. **Fetch All Subscriptions functionality** implemented on the frontend. (Completed)
11. Unit tests for all subscription API handlers written. (Completed)
12. **Subscriptions Management Screen** created on the frontend. (Completed)
13. Frontend successfully integrated with the backend subscription APIs. (Completed)
14. State management for subscriptions implemented using Redux/Context API. (Completed)

## Incomplete Issues
- None. All planned issues for this sprint were successfully completed.

## Backend Unit Tests

### User Unit Tests

- **TestSignupHandler**: Tests the functionality of `SignupHandler` to ensure user registration works correctly.
- **TestLoginHandler**: Tests the functionality of `LoginHandler` to ensure secure and accurate user authentication.
- **TestForgotPasswordHandler**: Tests the functionality of `ForgotPasswordHandler` to ensure password reset requests are processed correctly.
- **TestVerifyCodeHandler**: Tests the functionality of `VerifyCodeHandler` to ensure that the code verification process works correctly.
- **TestResetPasswordHandler**: Tests the functionality of `ResetPasswordHandler` to ensure users can securely reset their passwords.

### Subscription Unit Tests

- **TestSaveSubscriptionsHandler**: Tests that `SaveSubscriptionsHandler` processes valid subscription requests and correctly saves them to the database.
- **TestFetchUserSubscriptionsHandler**: Tests that `FetchUserSubscriptionsHandler` retrieves and returns user subscriptions in the expected JSON format.
- **TestUpdateSubscriptionsHandler**: Tests that `UpdateSubscriptionsHandler` correctly updates existing subscriptions with new career links and role names.
- **TestDeleteSubscriptionsHandler**: Tests that `DeleteSubscriptionsHandler` properly deletes subscriptions based on the provided company names.
- **TestFetchAllSubscriptionsHandler**: Tests that `FetchAllSubscriptionsHandler` fetches all companies with their career links and roles, returning the correct structure.

### Frontend Unit Tests

This section includes the end-to-end tests written in Cypress to validate the core functionalities of the web application. The tests are organized into four main suites:

#### 1. Login Tests   
- **Purpose:** Verify the login process, including form field validations, successful authentication, error handling, and logout functionality.  
- **Key Tests:**
  - **Unit Tests:** Check that the email and password input fields exist, are visible, and have the correct attributes. Also, ensure the login button is initially disabled.
  - **Integration Tests:** 
    - Simulate a successful login by mocking the API response (returning a token) and verifying navigation to the home page.
    - Validate error messages when incorrect credentials are provided.
    - Ensure form validations work properly (e.g., required fields, prevention of multiple submissions).
    - Simulate logout by clicking the logout icon and checking that the user is redirected back to the login page.

#### 2. Password Reset Tests  
- **Purpose:** Ensure that the multi-step password reset flow functions correctly.  
- **Key Tests:**
  - Verify that the password reset form renders correctly with its stepper (Email, Verify Code, Reset Password).
  - Check that valid emails enable the "Next" button and that invalid formats trigger error messages.
  - Test the progression from email submission to verification code entry, including handling invalid codes.
  - Validate the password reset step, including password matching and adherence to complexity requirements.
  - Confirm that a successful password reset redirects the user back to the login page.

#### 3. Signup Tests   
- **Purpose:** Validate the signup process, ensuring proper input validations and user feedback.  
- **Key Tests:**
  - Confirm that all necessary signup form fields (name, email, password, confirm password) are rendered and validated.
  - Ensure the signup button remains disabled until valid inputs are provided.
  - Test various password requirements (e.g., presence of uppercase, lowercase, numbers, and special characters) and error handling for password mismatches.
  - Simulate a successful signup with mocked API responses and verify redirection to the login page.
  - Check for appropriate error messages when signup fails and validate tooltips for password requirements.

#### 4. Subscription Tests  
- **Purpose:** Test the subscription management features including adding, modifying, and deleting subscriptions.  
- **Key Tests:**
  - Start with a login process to access the subscriptions page.
  - **Adding Subscriptions:** Fill in details (company name, career links, and job roles) and verify successful saving.
  - **Modifying Subscriptions:** Update existing subscription data (e.g., company name changes and adding new roles) and ensure changes are saved.
  - **Deleting Subscriptions:** Test deletion of subscriptions and verify confirmation messages.
  - Validate that the subscription form enforces required field validations and displays appropriate error messages.

**Running the Tests**

To execute these tests, ensure you have Cypress installed. You can run the tests in interactive mode:

```bash
npx cypress open
```

Or run them headlessly with:

```bash
npx cypress run
```

---

## Backend API Documentation

# Signup API 

## Endpoint
- **URL:** `/signup`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
The payload should include the user's name, email, and password:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword"
}
```

## Functionality

-   **Input Validation:**
    -   Ensures that `name`, `email`, and `password` are provided.
-   **User Existence Check:**
    -   Checks if a user with the given email already exists.
    -   Returns a conflict error if the user exists.
-   **Password Hashing:**
    -   Hashes the provided password using bcrypt.
-   **User Creation:**
    -   Inserts the new user into the database with the hashed password.
-   **JWT Generation:**
    -   Retrieves the newly created user's ID.
    -   Generates a JWT token with an expiration time (1 hour) and includes the user ID in the claims.
-   **Response Construction:**
    -   Returns a 201 Created status with a JSON object containing a success message, the JWT token, and the user ID.

## Response

### Success Response
```
{
  "message": "User created successfully",
  "token": "generated_jwt_token_here",
  "userid": 123
}
```
### Error Responses

-   **400 Bad Request:**
    -   When the payload is invalid or missing required fields.
-   **409 Conflict:**
    -   When a user with the given email already exists.
-   **500 Internal Server Error:**
    -   For database errors, password hashing failures, or JWT signing issues.

# Login API 

## Endpoint
- **URL:** `/login`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
The payload must include the user's email and password:
```json
{
  "email": "user@example.com",
  "password": "userPassword"
}
```

## Functionality

-   **Input Validation:**
    -   Decodes the JSON payload.
    -   Verifies that both `email` and `password` are provided.
-   **User Authentication:**
    -   Looks up the user in the database by email.
    -   Returns a 404 error if the user does not exist.
    -   Retrieves the stored hashed password and compares it with the provided password.
    -   Returns an unauthorized error if the password does not match.
-   **JWT Generation:**
    -   On successful authentication, generates a JWT token with an expiration time (1 hour).
    -   The token includes the user ID in its claims.
-   **Response Construction:**
    -   Returns a JSON response containing a success message, the generated JWT token, and the user ID.

## Response

### Success Response
```
{
  "message": "Login successful",
  "token": "generated_jwt_token_here",
  "userid": 123
}
```
### Error Responses

-   **400 Bad Request:**
    -   Returned if the JSON payload is invalid or if email/password is missing.
-   **404 Not Found:**
    -   Returned if the user does not exist.
-   **401 Unauthorized:**
    -   Returned if the provided password is incorrect.
-   **500 Internal Server Error:**
    -   Returned if there is a database error or an issue generating/signing the JWT token.

# ForgotPassword API 

## Endpoint
- **URL:** `/forgot-password`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
The JSON payload should contain the user's email:
```json
{
  "email": "user@example.com"
}
```
## Functionality

1.  **Input Validation:**
    -   Decodes the request payload and checks that an email is provided.
2.  **User Verification:**
    -   Checks if the provided email exists in the `users` table.
    -   If the email is not found, returns a 404 error prompting the user to sign up.
3.  **Token Generation and Storage:**
    -   Generates a reset token and sets its expiration to 15 minutes from the current UTC time.
    -   Inserts or updates the reset token record in the `reset_tokens` table.
4.  **Email Sending:**
    -   Sends a password reset email containing the token to the user.
5.  **Response Construction:**
    -   Returns a success message if the email is sent successfully.

## Response

### Success Response

-   **Status Code:** 200 OK
-   **Response Body:** Password reset email sent successfully!

### Error Responses

-   **400 Bad Request:**
    -   Returned if the JSON payload is invalid.
-   **404 Not Found:**
    -   Returned if the email does not exist in the users table.
-   **500 Internal Server Error:**
    -   Returned if there is a database error, token generation/storage error, or if sending the email fails.

# VerifyCode API

## Endpoint
- **URL:** `/verify-code`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
The JSON payload must include the user's email and the reset token:
```json
{
  "email": "user@example.com",
  "token": "reset_token_here"
}
```
## Functionality

1.  **Input Validation:**
    -   Decodes the request payload.
    -   Ensures that both `email` and `token` are provided.
2.  **Token Retrieval:**
    -   Fetches the stored token and its expiration time from the `reset_tokens` table for the given email.
    -   Returns a 404 error if no reset request is found.
3.  **Token Verification:**
    -   Checks if the token has expired and returns an unauthorized error if it has.
    -   Compares the stored token with the provided token. Returns an unauthorized error if they do not match.
4.  **Response Construction:**
    -   On successful verification, returns a success message.

## Response

### Success Response

-   **Status Code:** 200 OK
-   **Response Body:** Verification successful

### Error Responses

-   **400 Bad Request:**
    -   When the payload is invalid or missing required fields.
-   **404 Not Found:**
    -   When no reset request is found for the provided email.
-   **401 Unauthorized:**
    -   When the token has expired or does not match.
-   **500 Internal Server Error:**
    -   For any database-related errors.

# ResetPassword API 

## Endpoint
- **URL:** `/reset-password`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
The JSON payload must include the user's email and the new password:
```json
{
  "email": "user@example.com",
  "new_password": "newSecurePassword"
}
```
## Functionality

1.  **Input Validation:**
    -   Decodes the request payload.
    -   Checks that both `email` and `new_password` are provided.
2.  **User Verification:**
    -   Queries the `users` table to ensure that a user with the given email exists.
    -   Returns a 404 error if the user is not found.
3.  **Password Hashing:**
    -   Hashes the new password using bcrypt.
4.  **Password Update:**
    -   Updates the user's password in the database with the hashed password.
5.  **Response Construction:**
    -   Returns a success message upon successful password update.

## Response

### Success Response

-   **Status Code:** 200 OK
-   **Response Body:** Password reset successfully

### Error Responses

-   **400 Bad Request:**
    -   When the JSON payload is invalid or missing required fields.
-   **404 Not Found:**
    -   When no user is found with the provided email.
-   **500 Internal Server Error:**
    -   For database errors, password hashing failures, or issues updating the password.

# SaveSubscriptions API 

## Endpoint
- **URL:** `/save-subscriptions`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
```json
{
  "email": "user@example.com",
  "subscriptions": [
    {
      "companyName": "Adobe",
      "careerLinks": ["http://example.com/careers/adobe1", "http://example.com/careers/adobe2"],
      "roleNames": ["Software Engineer", "Data Scientist"]
    }
  ]
}
```

## Functionality

-   **Input Validation:**
    -   Ensures `email` and each subscription’s `companyName` are provided.
-   **User Lookup:**
    -   Fetches the user ID by email. Returns a 404 error if the user is not found.
-   **Subscription Processing:**
    -   For each subscription:
        -   Retrieves or creates the company record.
        -   Retrieves or creates career site IDs from `careerLinks` (using the company ID).
        -   Retrieves or creates role IDs from `roleNames`.
        -   Checks if a subscription (user ID + company ID) exists:
            -   **If not:** Inserts a new subscription record.
            -   **If yes:** Merges new career links and role IDs with the existing ones and updates the record.
-   **Timestamps:**
    -   Sets the `interest_time` to the current UTC time.

## Response

### Success
```
{
  "message": "Subscription processed successfully",
  "status": "success"
}
```
### Errors

-   **400 Bad Request:**
    -   Invalid JSON payload or missing required fields.
-   **404 Not Found:**
    -   User not found.
-   **500 Internal Server Error:**
    -   Database or processing errors.

# FetchUserSubscriptions API 

## Endpoint
- **URL:** `/fetch-user-subscriptions`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
The request should include the user's email:
```json
{
  "email": "user@example.com"
}
```
## Functionality

1.  **Input Validation:**
    -   Decodes the JSON payload and checks that an email is provided.
2.  **User Lookup:**
    -   Retrieves the user ID based on the provided email.
    -   Returns a 404 error if the user is not found.
3.  **Subscription Query:**
    -   Fetches all subscription rows for the user from the database.
4.  **Data Aggregation:**
    -   For each subscription, retrieves:
        -   The company name (using the company ID).
        -   All career site links associated with the subscription.
        -   All role names associated with the subscription.
5.  **Response Construction:**
    -   Returns a JSON object containing a list of subscriptions.
    -   Each subscription includes `companyName`, `careerLinks`, and `roleNames`.

## Response

### Success Response
```
{
  "status": "success",
  "subscriptions": [
    {
      "companyName": "Adobe",
      "careerLinks": [
        "http://example.com/careers/adobe1",
        "http://example.com/careers/adobe2"
      ],
      "roleNames": [
        "Software Engineer",
        "Data Scientist"
      ]
    },
    {
      "companyName": "Amazon",
      "careerLinks": [
        "http://example.com/careers/amazon1"
      ],
      "roleNames": [
        "Backend Engineer"
      ]
    }
  ]
}
```
### Error Responses

-   **400 Bad Request:**
    -   Returned if the JSON payload is invalid or if the `email` field is missing.
-   **404 Not Found:**
    -   Returned if the user associated with the provided email is not found.
-   **500 Internal Server Error:**
    -   Returned if there is an error fetching subscriptions or processing database records.

# UpdateSubscriptions API 

## Endpoint
- **URL:** `/update-subscriptions`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
The JSON payload should follow this structure:

```json
{
  "email": "user@example.com",
  "subscriptions": [
    {
      "companyName": "Adobe",
      "careerLinks": ["http://example.com/careers/adobe1", "http://example.com/careers/adobe2"],
      "roleNames": ["Software Engineer", "Data Scientist"]
    }
  ]
}
```

## Functionality

-   **Input Validation:**
    -   Ensures an `email` is provided.
    -   Checks that each subscription entry contains a `companyName`.
-   **User & Company Verification:**
    -   Retrieves the user ID by email.
    -   Looks up the company ID for the given `companyName` without auto-creating a new company.
    -   Returns an error if the company does not exist or if no subscription record exists for the user and company.
-   **Update Logic:**
    -   Determines which fields (careerLinks and/or roleNames) are provided.
    -   If no update fields are provided, returns an error.
    -   For provided `careerLinks`, retrieves (or creates) career site IDs associated with the company.
    -   For provided `roleNames`, retrieves (or creates) role IDs.
    -   Converts the ID slices to the appropriate type for PostgreSQL array storage.
    -   Executes an UPDATE query to modify the subscription record (merging new IDs with existing ones if necessary) and updates the `interest_time`.

## Response

### Success Response
```
{
  "message": "Subscription(s) updated successfully",
  "status": "success"
}
```

### Error Responses

-   **400 Bad Request:**
    -   Returned if the payload is invalid, missing `email`, missing `companyName` in any subscription, or if no update fields are provided.
-   **404 Not Found:**
    -   Returned if the user is not found.
-   **500 Internal Server Error:**
    -   Returned if there is a database error while fetching or updating the subscription.

# DeleteSubscriptions API 

## Endpoint
- **URL:** `/delete-subscriptions`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
The request payload should follow this structure:
```json
{
  "email": "user@example.com",
  "subscriptions": ["Amazon", "Meta"]
}
```
## Functionality

1.  **Input Validation:**
    -   Verifies that an `email` is provided.
    -   Ensures that the `subscriptions` array is not empty.
2.  **User Lookup:**
    -   Retrieves the user ID associated with the provided email.
    -   Returns a 404 error if the user is not found.
3.  **Subscription Deletion:**
    -   Iterates over the list of company names provided in the `subscriptions` array.
    -   For each company name:
        -   Attempts to retrieve the corresponding company ID.
        -   If the company does not exist, that subscription is skipped.
        -   Deletes the subscription record where both the user ID and company ID match.
    -   Checks whether any valid subscription was found and deleted.
4.  **Error Handling:**
    -   If none of the provided company names exist in the database, returns an error.
    -   If the user is not subscribed to any of the provided subscriptions, returns an error.
5.  **Response Construction:**
    -   On successful deletion of one or more subscriptions, returns a success message.

## Response

### Success Response
```
{
  "message": "Deleted subscription(s) successfully",
  "status": "success"
}
```

### Error Responses

-   **400 Bad Request:**
    -   When the payload is invalid, missing an email, or the subscriptions array is empty.
    -   When none of the provided subscriptions exist, or the user is not subscribed to any of them.
-   **404 Not Found:**
    -   When the user corresponding to the provided email is not found.
-   **500 Internal Server Error:**
    -   In case of any database errors during the deletion process.

# FetchAllSubscriptions API 

## Endpoint
- **URL:** `/fetch-all-subscriptions`
- **Method:** `GET` 
- **Content-Type:** `application/json`

## Functionality
1. **Companies Query:**  
   - Fetches all company IDs and names from the `companies` table.
   - Builds a map with each company name as a key and initializes an empty list for its career links.

2. **Career Sites Query:**  
   - For each company, queries the `career_sites` table to retrieve all associated career links.
   - Populates the company’s entry in the map with these links.

3. **Roles Query:**  
   - Fetches all role names from the `roles` table and compiles them into a list.

4. **Response Construction:**  
   - Constructs a JSON response containing:
     - A `companies` object mapping company names to arrays of career links.
     - A `roles` array containing all role names.

## Response

### Success Response
```json
{
  "companies": {
    "Adobe": ["http://example.com/careers/adobe1", "http://example.com/careers/adobe2"],
    "Amazon": ["http://example.com/careers/amazon1"]
  },
  "roles": ["Software Engineer", "Data Scientist"]
}
```
### Error Responses

-   **500 Internal Server Error:**
    -   Returned if there is an error fetching or scanning companies, career sites, or roles.
