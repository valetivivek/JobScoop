# Sprint 1 Report

## User Stories
1. As a user, I want to sign up for an account so that I can access the application.
2. As a user, I want to log in to my account so that I can use the application's features.
3. As a user, I want to reset my password if I forget it so that I can regain access to my account.
4. As a user, I want to log out of my account so that I can securely end my session.

## Planned Issues
1. Implement the **Signup API** on the backend.
2. Implement the **Login API** on the backend with JWT (JSON Web Token) for secure authentication.
3. Implement the **Forgot Password API** on the backend with email functionality using SMTP.
4. Create the **Signup Screen** on the frontend.
5. Create the **Login Screen** on the frontend.
6. Create the **Forgot Password Screen** on the frontend.
7. Implement **AuthContext** to manage user authentication state and protect routes.
8. Implement the **Logout functionality** to securely end the user's session.
9. Integrate the frontend with the backend APIs for Signup, Login, and Forgot Password.

## Completed Issues
1. **Signup API** implemented on the backend. (Completed)
2. **Login API** implemented on the backend with JWT for secure authentication. (Completed)
3. **Forgot Password API** implemented on the backend with email functionality using SMTP. (Completed)
4. **Signup Screen** created on the frontend. (Completed)
5. **Login Screen** created on the frontend. (Completed)
6. **Forgot Password Screen** created on the frontend. (Completed)
7. **AuthContext** implemented to manage user authentication state and protect routes. (Completed)
8. **Logout functionality** implemented to securely end the user's session. (Completed)
9. Frontend successfully integrated with the backend APIs for Signup, Login, and Forgot Password. (Completed)

## Incomplete Issues
- None. All planned issues for this sprint were successfully completed.

## Notes
## Backend Implementation
The backend was developed with a clear and organized structure, following the **separation of concerns** design principle. Each functionality is isolated into its own file, making the codebase modular, maintainable, and scalable.
#### Security Measures
- **JWT Tokens**: Used for secure authentication. The token is signed with a secret key and includes an expiration time to enhance security.
- **Password Hashing**: User passwords are hashed using bcrypt before being stored in the database.
- **CORS**: Implemented Cross-Origin Resource Sharing (CORS) to allow the frontend to communicate with the backend without being blocked by the browser.
#### Forgot Password Logic
- A random 6-digit code is generated and sent to the user's email using **SMTP** and it's stored in the database with an expiration time of 15 minutes.
#### Database
- **PostgreSQL**: Chosen as the database for its reliability and scalability.

### Frontend Implementation
- **Signup, Login, and Forgot Password Screens**: The frontend now has fully functional screens for user signup, login, and password reset. These screens are integrated with the backend APIs.
- **AuthContext**: We implemented an `AuthContext` to manage the user's authentication state globally. This ensures that protected routes (e.g., dashboard, profile) are only accessible to logged-in users.
- **Browser Storage**: The user's login state is persisted across page reloads using `localStorage`. This ensures a seamless user experience even if the page is refreshed.
- **Protected Routes**: All important routes are now protected and require the user to be logged in. If an unauthenticated user tries to access a protected route, they are redirected to the login page.
- **Logout Functionality**: The logout feature was implemented to securely end the user's session. When the user logs out:
  - The JWT token is removed from `localStorage`.
  - The user's authentication state in `AuthContext` is reset.
  - The user is redirected to the login page.

### Testing and Validation
- All APIs were tested using Postman to ensure they work as expected.
- The frontend was tested to ensure proper integration with the backend and smooth user flows for signup, login, logout, and password reset.
- Email functionality for the Forgot Password feature was tested to ensure emails are sent successfully.

### Challenges
- No major blockers were encountered during this sprint. The team collaborated effectively to deliver all planned functionalities on time.

---