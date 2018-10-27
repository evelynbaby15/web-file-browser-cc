package main

import (
	"log"
	"net/http"
)

type RequestLogInterceptor struct {
	handle func(http.ResponseWriter, *http.Request)
}

func (this RequestLogInterceptor) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Print("[Request] ", r.Method, " ", r.URL)
	this.handle(w, r)
}
