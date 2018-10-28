package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"mime"

	"net/http"
	"os"
	"path/filepath"

	"gitlab.com/simiecc/pi/clog"
)

func init() {
	clog.SetDisplaySource(false)
	clog.Init()
}

func main() {
	InitProgramArgs()
	flag.Parse()

	initHandlers()
	startServ()

}

func initHandlers() {
	//fileSvr := http.FileServer(http.Dir("C:/workspace/ict/gitsvn/ictinv-ui-svcmgt/dist"))

	//	http.Handle("/", interceptHandler(fileSvr, defaultErrorHandler))
	http.Handle("/api/list", RequestLogInterceptor{handle: dir_list})
	//http.Handle("/api/file", RequestLogInterceptor{handle: fake_download_file})
	http.Handle("/api/file", RequestLogInterceptor{handle: dir_get_file})
	//http.HandleFunc("/api/", handleRequest_list)
}

func startServ() {
	if GetDebug() {
		clog.Info("Debug mode ON")
	}
	port := GetServerPort()
	clog.Infof("Starting server on %v...", port)
	clog.Error(http.ListenAndServe(port, nil))
}

func handleRequest_api(w http.ResponseWriter, req *http.Request) {
	clog.Print("Request ", req.Method, " ", req.URL)

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
	clog.Print("handleFile ", filename)

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

	clog.Print("Content-Type: ", ctype)

	defer f.Close()
	io.Copy(w, f)
}

// https://gist.github.com/nhooyr/076c397a761fefded1e580c837c528ea
type interceptResponseWriter struct {
	http.ResponseWriter
	errH func(http.ResponseWriter, int)
}

func (w *interceptResponseWriter) WriteHeader(status int) {
	if status == http.StatusNotFound {
		w.Header().Del("Content-Type")
		handleFile(w.ResponseWriter, GetStaticIndexDoc())
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
	//clog.Printf("Error ", status, " - ", message)
	w.WriteHeader(status)

	ReturnJson(w, CommonResponse{Status: status, Msg: message})
	//http.Error(w, message, status)
}

func interceptHandler(next http.Handler, errH ErrorHandler) http.Handler {
	if errH == nil {
		errH = defaultErrorHandler
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(&interceptResponseWriter{w, errH}, r)
	})
}

func ReturnJson(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if data != nil {
		bytes, _ := json.Marshal(data)
		//w.Header().Set("Content-Length", strconv.Itoa(len(bytes)))
		w.Write(bytes)
	}
}

// Return 405 MethodNotAllow result with empty body
func ReturnMethodNotAllowed(w http.ResponseWriter) {
	w.WriteHeader(http.StatusMethodNotAllowed)
}
