package main

import (
	"bufio"
	"fmt"
	"io"
	"mime"

	"log"
	"net/http"
	"os"
	"path/filepath"
)

const SERVE = ":8811"
const STATIC_FILE_ROOT = "C:/workspace/ict/gitsvn/ictinv-ui-svcmgt/dist"
const STATIC_FILE_INDEX = STATIC_FILE_ROOT + "/index.html"

func main() {
	initHandlers()
	startServ()
}

func initHandlers() {
	//fileSvr := http.FileServer(http.Dir("C:/workspace/ict/gitsvn/ictinv-ui-svcmgt/dist"))

	//http.Handle("/", interceptHandler(fileSvr, defaultErrorHandler))
	http.HandleFunc("/api/list", fake_dir_list)
	//http.HandleFunc("/api/", handleRequest_list)
}

func startServ() {
	log.Printf("Started serve on %v...", SERVE)
	log.Fatal(http.ListenAndServe(":8811", nil))
}

func handleRequest_api(w http.ResponseWriter, req *http.Request) {
	log.Print("Request ", req.Method, " ", req.URL)

	f, err := os.Open("C:/data-delete.xml")
	if err != nil {
		w.Write([]byte(fmt.Sprintf("Error: %v", err)))
		return
	}

	defer f.Close()
	reader := bufio.NewReader(f)
	io.Copy(w, reader)

	//w.Write([]byte("123123"))
}

// The algorithm uses at most sniffLen bytes to make its decision.
const sniffLen = 512

func handleFile(w http.ResponseWriter, filename string) {
	log.Print("handleFile ", filename)

	f, err := os.Open(filename)
	if err != nil {
		w.Write([]byte(fmt.Sprintf("Error: %v", err)))
		return
	}

	// If Content-Type isn't set, use the file's extension to find it, but
	// if the Content-Type is unset explicitly, do not sniff the type.
	ctypes, haveType := w.Header()["Content-Type"]
	var ctype string

	if !haveType {
		ctype = mime.TypeByExtension(filepath.Ext(filename))
		if ctype == "" {
			// read a chunk to decide between utf-8 text and binary
			var buf [sniffLen]byte
			n, _ := io.ReadFull(f, buf[:])
			ctype = http.DetectContentType(buf[:n])
			_, err := f.Seek(0, io.SeekStart) // rewind to output whole file
			if err != nil {
				ReturnError(w, 500, "seeker can't seek")
				return
			}
		}

		w.Header().Set("Content-Type", ctype)
	} else if len(ctypes) > 0 {
		ctype = ctypes[0]
	}

	log.Print("Content-Type: ", ctype)

	defer f.Close()
	reader := bufio.NewReader(f)
	io.Copy(w, reader)
}

// https://gist.github.com/nhooyr/076c397a761fefded1e580c837c528ea
type interceptResponseWriter struct {
	http.ResponseWriter
	errH func(http.ResponseWriter, int)
}

func (w *interceptResponseWriter) WriteHeader(status int) {
	if status == http.StatusNotFound {
		w.Header().Del("Content-Type")
		handleFile(w.ResponseWriter, STATIC_FILE_INDEX)
		w.errH = nil
	} else if status >= http.StatusBadRequest {
		w.errH(w.ResponseWriter, status)
		w.errH = nil
	} else {
		w.ResponseWriter.WriteHeader(status)
	}
}

type ErrorHandler func(http.ResponseWriter, int)

func (w *interceptResponseWriter) Write(p []byte) (n int, err error) {
	if w.errH == nil {
		return len(p), nil
	}
	return w.ResponseWriter.Write(p)
}

func defaultErrorHandler(w http.ResponseWriter, status int) {
	ReturnError(w, status, string(status))
}

func ReturnError(w http.ResponseWriter, status int, message string) {
	log.Print("Error ", status, " - ", message)
	http.Error(w, message, status)
}

func interceptHandler(next http.Handler, errH ErrorHandler) http.Handler {
	if errH == nil {
		errH = defaultErrorHandler
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(&interceptResponseWriter{w, errH}, r)
	})
}
