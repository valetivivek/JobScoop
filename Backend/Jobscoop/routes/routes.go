package routes

import (
	user "JobScoop/internal/handlers"
	"net/http"

	"github.com/gorilla/mux"
)

func RegisterRoutes() *mux.Router {
	router := mux.NewRouter()
	router.HandleFunc("/signup", user.SignupHandler).Methods(http.MethodPost)
	router.HandleFunc("/login", user.LoginHandler).Methods(http.MethodPost)
	router.HandleFunc("/forgot-password", user.ForgotPasswordHandler).Methods(http.MethodPost)
	router.HandleFunc("/verify-code", user.VerifyCodeHandler).Methods(http.MethodPost)
	router.HandleFunc("/reset-password", user.ResetPasswordHandler).Methods(http.MethodPut)
	return router
}
