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

This section includes both the React component unit tests and the Cypress end-to-end tests for the web application.

#### A. React Component Unit Tests

**Total Unit testcases : 20**

These tests verify individual component behavior:

- **Signup Component Tests:**  
  - Renders form elements (Name, Email, Password, Confirm Password) and displays the JOBSCOOP title.  
  - Initially disables the Signup button until valid inputs are provided.  
  - Validates email format and displays an error for invalid input.  
  - Shows a tooltip for password requirements on focus.  
  - Checks for password mismatch (clearing password fields and displaying an error if passwords do not match).  
  - Enables the Signup button with valid inputs; on successful API response, shows a success alert and navigates to the login page, while on failure, displays an error alert and clears passwords.  
  - Also validates various password criteria (uppercase, lowercase, numeric, and special character).

- **Password Reset Component Tests:**  
  - Renders the reset form with a stepper indicating "Enter Email," "Verify Code," and "Reset Password" steps.  
  - Validates email input (disabling/enabling the Next button based on format) and handles API responses for email submission.  
  - Transitions to the verification step upon successful email submission; displays errors and clears input on failure.  
  - Validates the verification code length and button state, then moves to the password reset fields upon successful code verification; otherwise, shows an error alert.  
  - Validates new password requirements ensuring both password fields match; a successful reset triggers the API call and redirects to the login page, while a failure displays an error.

- **Login Component Tests:**  
  - Renders the login form with Email, Password fields, and navigation links for Signup and Password Reset.  
  - Initially disables the Login button until valid credentials are entered.  
  - Validates the email format (displaying an error for invalid input).  
  - On successful login, calls the login function, sets local storage, and navigates to Home; on failure, displays an error alert and clears the inputs.  
  - Also verifies that clicking on Signup or Forgot Password navigates to the corresponding pages and that an already logged-in user is redirected to Home.  
  - Includes tests to ensure error snackbars can be dismissed.

#### B. Cypress End-to-End Tests
**Total Cypress testcases : 20**

These tests validate full user flows:

- **Login Tests:**  
  - Verify form field validations, successful login with a mocked API response (token retrieval), error handling for incorrect credentials, and logout functionality.
- **Password Reset Tests:**  
  - Ensure the multi-step password reset flow functions correctly—from email submission to code verification and final password reset—handling errors at each step.
- **Signup Tests:**  
  - Validate that the signup process includes proper input validations and user feedback, with navigation to the login page on success.
- **Subscription Tests:**  
  - Test the subscription management features (adding, modifying, and deleting subscriptions) following a login, with all API calls appropriately intercepted and validated.

**Running the Tests**

To execute the Cypress tests, ensure you have Cypress installed. You can run the tests in interactive mode:

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

- **Input Validation:**  
  - Ensures that `name`, `email`, and `password` are provided.
- **User Existence Check:**  
  - Checks if a user with the given email already exists.  
  - Returns a conflict error if the user exists.
- **Password Hashing:**  
  - Hashes the provided password using bcrypt.
- **User Creation:**  
  - Inserts the new user into the database with the hashed password.
- **JWT Generation:**  
  - Retrieves the newly created user's ID.  
  - Generates a JWT token with an expiration time (1 hour) and includes the user ID in the claims.
- **Response Construction:**  
  - Returns a 201 Created status with a JSON object containing a success message, the JWT token, and the user ID.

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

- **400 Bad Request:**  
  - When the payload is invalid or missing required fields.
- **409 Conflict:**  
  - When a user with the given email already exists.
- **500 Internal Server Error:**  
  - For database errors, password hashing failures, or JWT signing issues.

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

- **Input Validation:**  
  - Decodes the JSON payload and verifies that both `email` and `password` are provided.
- **User Authentication:**  
  - Looks up the user in the database by email.  
  - Returns a 404 error if the user does not exist.  
  - Retrieves the stored hashed password and compares it with the provided password.  
  - Returns an unauthorized error if the password does not match.
- **JWT Generation:**  
  - On successful authentication, generates a JWT token with an expiration time (1 hour) that includes the user ID in its claims.
- **Response Construction:**  
  - Returns a JSON response containing a success message, the generated JWT token, and the user ID.

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

- **400 Bad Request:**  
  - Returned if the JSON payload is invalid or if email/password is missing.
- **404 Not Found:**  
  - Returned if the user does not exist.
- **401 Unauthorized:**  
  - Returned if the provided password is incorrect.
- **500 Internal Server Error:**  
  - Returned if there is a database error or an issue generating/signing the JWT token.

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

1. **Input Validation:**  
   - Decodes the request payload and checks that an email is provided.
2. **User Verification:**  
   - Checks if the provided email exists in the `users` table.  
   - If the email is not found, returns a 404 error prompting the user to sign up.
3. **Token Generation and Storage:**  
   - Generates a reset token and sets its expiration to 15 minutes from the current UTC time.  
   - Inserts or updates the reset token record in the `reset_tokens` table.
4. **Email Sending:**  
   - Sends a password reset email containing the token to the user.
5. **Response Construction:**  
   - Returns a success message if the email is sent successfully.

## Response

### Success Response

- **Status Code:** 200 OK  
- **Response Body:** Password reset email sent successfully!

### Error Responses

- **400 Bad Request:**  
  - Returned if the JSON payload is invalid.
- **404 Not Found:**  
  - Returned if the email does not exist in the users table.
- **500 Internal Server Error:**  
  - Returned if there is a database error, token generation/storage error, or if sending the email fails.

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

1. **Input Validation:**  
   - Decodes the request payload and ensures that both `email` and `token` are provided.
2. **Token Retrieval:**  
   - Fetches the stored token and its expiration time from the `reset_tokens` table for the given email.  
   - Returns a 404 error if no reset request is found.
3. **Token Verification:**  
   - Checks if the token has expired and returns an unauthorized error if it has.  
   - Compares the stored token with the provided token and returns an unauthorized error if they do not match.
4. **Response Construction:**  
   - On successful verification, returns a success message.

## Response

### Success Response

- **Status Code:** 200 OK  
- **Response Body:** Verification successful

### Error Responses

- **400 Bad Request:**  
  - When the payload is invalid or missing required fields.
- **404 Not Found:**  
  - When no reset request is found for the provided email.
- **401 Unauthorized:**  
  - When the token has expired or does not match.
- **500 Internal Server Error:**  
  - For any database-related errors.

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

1. **Input Validation:**  
   - Decodes the request payload and checks that both `email` and `new_password` are provided.
2. **User Verification:**  
   - Queries the `users` table to ensure that a user with the given email exists.  
   - Returns a 404 error if the user is not found.
3. **Password Hashing:**  
   - Hashes the new password using bcrypt.
4. **Password Update:**  
   - Updates the user's password in the database with the hashed password.
5. **Response Construction:**  
   - Returns a success message upon successful password update.

## Response

### Success Response

- **Status Code:** 200 OK  
- **Response Body:** Password reset successfully

### Error Responses

- **400 Bad Request:**  
  - When the JSON payload is invalid or missing required fields.
- **404 Not Found:**  
  - When no user is found with the provided email.
- **500 Internal Server Error:**  
  - For database errors, password hashing failures, or issues updating the password.

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

- **Input Validation:**  
  - Ensures `email` and each subscription’s `companyName` are provided.
- **User Lookup:**  
  - Fetches the user ID by email and returns a 404 error if the user is not found.
- **Subscription Processing:**  
  - For each subscription:  
    - Retrieves or creates the company record.  
    - Retrieves or creates career site IDs from `careerLinks` (using the company ID).  
    - Retrieves or creates role IDs from `roleNames`.  
    - Checks if a subscription (user ID + company ID) exists:  
      - **If not:** Inserts a new subscription record.  
      - **If yes:** Merges new career links and role IDs with the existing ones and updates the record.
- **Timestamps:**  
  - Sets the `interest_time` to the current UTC time.

## Response

### Success
```
{
  "message": "Subscription processed successfully",
  "status": "success"
}
```

### Errors

- **400 Bad Request:**  
  - Invalid JSON payload or missing required fields.
- **404 Not Found:**  
  - User not found.
- **500 Internal Server Error:**  
  - Database or processing errors.

# FetchUserSubscriptions API 

## Endpoint
- **URL:** `/fetch-user-subscriptions`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
```json
{
  "email": "user@example.com"
}
```

## Functionality

1. **Input Validation:**  
   - Decodes the JSON payload and checks that an email is provided.
2. **User Lookup:**  
   - Retrieves the user ID based on the provided email and returns a 404 error if the user is not found.
3. **Subscription Query:**  
   - Fetches all subscription rows for the user from the database.
4. **Data Aggregation:**  
   - For each subscription, retrieves the company name, associated career site links, and role names.
5. **Response Construction:**  
   - Returns a JSON object containing a list of subscriptions, each with `companyName`, `careerLinks`, and `roleNames`.

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

- **400 Bad Request:**  
  - Returned if the JSON payload is invalid or if the `email` field is missing.
- **404 Not Found:**  
  - Returned if the user associated with the provided email is not found.
- **500 Internal Server Error:**  
  - Returned if there is an error fetching subscriptions or processing database records.

# UpdateSubscriptions API 

## Endpoint
- **URL:** `/update-subscriptions`
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

- **Input Validation:**  
  - Ensures an `email` is provided and each subscription contains a `companyName`.
- **User & Company Verification:**  
  - Retrieves the user ID by email and looks up the company ID for the given `companyName`, returning an error if not found.
- **Update Logic:**  
  - Determines which fields (careerLinks and/or roleNames) are provided and, if none, returns an error.  
  - For provided fields, retrieves or creates corresponding IDs and updates the subscription record (merging with existing data) while updating the `interest_time`.
  
## Response

### Success Response
```
{
  "message": "Subscription(s) updated successfully",
  "status": "success"
}
```

### Error Responses

- **400 Bad Request:**  
  - Returned if the payload is invalid, missing `email`, or missing `companyName` in any subscription, or if no update fields are provided.
- **404 Not Found:**  
  - Returned if the user is not found.
- **500 Internal Server Error:**  
  - Returned if there is a database error while fetching or updating the subscription.

# DeleteSubscriptions API 

## Endpoint
- **URL:** `/delete-subscriptions`
- **Method:** `POST`
- **Content-Type:** `application/json`

## Request Body
```json
{
  "email": "user@example.com",
  "subscriptions": ["Amazon", "Meta"]
}
```

## Functionality

1. **Input Validation:**  
   - Verifies that an `email` is provided and that the `subscriptions` array is not empty.
2. **User Lookup:**  
   - Retrieves the user ID associated with the provided email, returning a 404 error if not found.
3. **Subscription Deletion:**  
   - Iterates over the company names in the `subscriptions` array, deleting each corresponding subscription record where the user ID and company ID match.
4. **Error Handling:**  
   - Returns an error if none of the provided subscriptions exist or if the user is not subscribed to any.
5. **Response Construction:**  
   - Returns a success message upon successful deletion.

## Response

### Success Response
```
{
  "message": "Deleted subscription(s) successfully",
  "status": "success"
}
```

### Error Responses

- **400 Bad Request:**  
  - When the payload is invalid, missing an email, or the subscriptions array is empty, or if no valid subscriptions are found.
- **404 Not Found:**  
  - When the user corresponding to the provided email is not found.
- **500 Internal Server Error:**  
  - In case of any database errors during deletion.

# FetchAllSubscriptions API 

## Endpoint
- **URL:** `/fetch-all-subscriptions`
- **Method:** `GET` 
- **Content-Type:** `application/json`

## Functionality

1. **Companies Query:**  
   - Fetches all company IDs and names from the `companies` table, building a map with each company name as a key and initializing an empty list for its career links.
2. **Career Sites Query:**  
   - For each company, queries the `career_sites` table to retrieve all associated career links and populates the map.
3. **Roles Query:**  
   - Fetches all role names from the `roles` table and compiles them into a list.
4. **Response Construction:**  
   - Constructs a JSON response containing a `companies` object (mapping company names to arrays of career links) and a `roles` array.

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

- **500 Internal Server Error:**  
  - Returned if there is an error fetching or scanning companies, career sites, or roles.
