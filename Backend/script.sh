#!/bin/bash

PROJECT_NAME=$1

mkdir -p $PROJECT_NAME && cd $PROJECT_NAME

go mod init $PROJECT_NAME

mkdir -p cmd/api cmd/worker
mkdir -p config
mkdir -p internal/handlers internal/services internal/models internal/db
mkdir -p pkg
mkdir -p migrations
mkdir -p scripts

touch .env main.go

cat <<EOL > main.go
package main

import "fmt"

func main() {
    fmt.Println("Starting $PROJECT_NAME...")
}
EOL

