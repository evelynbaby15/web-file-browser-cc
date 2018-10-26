package main

import (
	"encoding/json"
	"log"
	"net/http"

	"time"
)

func fake_dir_list(w http.ResponseWriter, req *http.Request) {
	log.Print("in dir_list")

	data := DirList{
		CommonResponse: CommonResponse{Status: 200, Msg: ""},
		Files: []DirFile{
			DirFile{Filetype: "D", Filename: "test_dir", Size: 0, Modified: JSONTime(time.Now())},
			DirFile{Filetype: "F", Filename: "file.txt", Size: 205, Modified: JSONTime(time.Now())}}}

	bytes, _ := json.Marshal(data)
	w.Write(bytes)
}
