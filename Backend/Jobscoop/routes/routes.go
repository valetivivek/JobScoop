package routes

import (
	user "JobScoop/internal/handlers"
	"JobScoop/internal/middleware"
	"net/http"

	"github.com/gorilla/mux"
)

func RegisterRoutes() *mux.Router {
	router := mux.NewRouter()
	router.Use(middleware.CORS)
	router.HandleFunc("/signup", user.SignupHandler).Methods(http.MethodPost)
	router.HandleFunc("/signup", user.SignupHandler).Methods(http.MethodOptions)

	router.HandleFunc("/login", user.LoginHandler).Methods(http.MethodPost)
	router.HandleFunc("/login", user.LoginHandler).Methods(http.MethodOptions)

	router.HandleFunc("/forgot-password", user.ForgotPasswordHandler).Methods(http.MethodPost)
	router.HandleFunc("/forgot-password", user.ForgotPasswordHandler).Methods(http.MethodOptions)

	router.HandleFunc("/verify-code", user.VerifyCodeHandler).Methods(http.MethodPost)
	router.HandleFunc("/verify-code", user.VerifyCodeHandler).Methods(http.MethodOptions)

	router.HandleFunc("/reset-password", user.ResetPasswordHandler).Methods(http.MethodPut)
	router.HandleFunc("/reset-password", user.ResetPasswordHandler).Methods(http.MethodOptions)

	return router
}
