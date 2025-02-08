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
	return router
}