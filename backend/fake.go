package main

import (
	"io"
	"net/http"
	"os"

	"gitlab.com/simiecc/golib/clog"

	"time"
)

func fake_dir_list(w http.ResponseWriter, req *http.Request) {
	data := DirList{
		CommonResponse: CommonResponse{Status: 200, Msg: ""},
		Files: []DirFile{
			DirFile{Filetype: "D", Filename: "test_dir", Size: 0, Modified: JSONTime(time.Now())},
			DirFile{Filetype: "F", Filename: "file.txt", Size: 205, Modified: JSONTime(time.Now())}}}
	ReturnJson(w, data)
}

func fake_download_file(w http.ResponseWriter, req *http.Request) {
	file, err := os.Open("./assets/test.txt")
	if err != nil {
		clog.Error("Error: open file", err)
		w.Write([]byte("error response"))
		return
	}

	//	Content-Type: application/octet-stream
	//	Content-Disposition: attachment; filename=MyFileName.ext
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", "attachment; filename=MyFileName.ext")

	_, err = io.Copy(w, file)
	if err != nil {
		clog.Error("Error: write file", err)
		w.Write([]byte("error response"))
		return
	}
}
