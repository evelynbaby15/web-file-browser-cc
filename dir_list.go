package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"

	"strings"
)

func dir_list(w http.ResponseWriter, req *http.Request) {

	filepath, err := getRequestParam(req, "path")
	if err != nil {
		log.Printf("Error: fail parse 'path'", err)
		ReturnError(w, 500, err.Error())
		return
	}

	log.Print("Request Path: ", filepath)
	pathParts := strings.Split(filepath, "/")

	pathRoot, err := GetFileBrowserRoot(pathParts[0])
	if err != nil {
		log.Printf("Error: fail get root", err)
		ReturnError(w, 500, err.Error())
		return
	}
	log.Print("Path root:", pathRoot)

	pathRemain := strings.Join(pathParts[1:], "/")
	pathFull := pathRoot.Path + "/" + pathRemain
	log.Print("OS Path: ", pathFull)

	osPath, err := os.Open(pathFull)
	if err != nil {
		log.Printf("Error: read root", pathFull)
		ReturnError(w, 500, "Error read")
		return
	}

	defer osPath.Close()
	stat, err := osPath.Stat()
	if err != nil {
		log.Printf("Error: fail read stat", err)
		ReturnError(w, 500, "Error read")
		return
	}

	if !stat.IsDir() {
		log.Printf("Error: fail read dir: not a directory", err)
		ReturnError(w, 500, "Error read")
		return
	}

	osFiles, err := osPath.Readdir(-1)
	if err != nil {
		log.Printf("Error: fail read dir list", err)
		ReturnError(w, 500, "Error read")
		return
	}

	outputFiles := []DirFile{}
	for _, file := range osFiles {
		fileType := "F"
		if file.IsDir() {
			fileType = "D"
		}
		outputFiles = append(outputFiles, DirFile{
			Filetype: fileType, Filename: file.Name(), Size: int(file.Size()), Modified: JSONTime(file.ModTime())})
	}

	finalData := DirList{
		CommonResponse: CommonResponse{Status: 200, Msg: ""},
		Path:           filepath,
		Files:          outputFiles}
	ReturnJson(w, finalData)
}

func getRequestParam(req *http.Request, key string) (string, error) {

	values, ok := req.URL.Query()[key]
	if !ok || len(values) < 1 {
		return "", errors.New(fmt.Sprintf("Error: fail parse '%v'", key))
	}

	return values[0], nil
}
