package main

import (
	"net/http"
	"strconv"

	"time"

	"gitlab.com/simiecc/pi/clog"
)

type RequestLogInterceptor struct {
	handle func(http.ResponseWriter, *http.Request)
}

func (this RequestLogInterceptor) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	wrapped := recordStatusResponseWriter{ResponseWriter: w, finalStatus: new(int)}
	*wrapped.finalStatus = 200
	start := time.Now()

	this.handle(wrapped, r)

	elapsed := time.Since(start)

	clog.Infof("[Request] %v %v (%v) %v", r.Method, r.URL, *wrapped.finalStatus, asMs(elapsed))
}

func asMs(d time.Duration) string {
	return strconv.FormatInt(d.Nanoseconds()/time.Millisecond.Nanoseconds(), 10) + " ms"
}

type recordStatusResponseWriter struct {
	http.ResponseWriter
	finalStatus *int
}

func (w recordStatusResponseWriter) WriteHeader(status int) {
	*w.finalStatus = status
	w.ResponseWriter.WriteHeader(status)
}
