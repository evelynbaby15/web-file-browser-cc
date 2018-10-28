package main

import (
	"errors"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"time"

	"gitlab.com/simiecc/pi/clog"

	"strings"
)

func defaultErrorResult(w http.ResponseWriter) {
	ReturnError(w, http.StatusNotAcceptable, "Error read")
}

func debug_header(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
}

func dir_list(w http.ResponseWriter, req *http.Request) {
	if req.Method == "GET" {
		dir_list_get(w, req)
	} else {
		ReturnMethodNotAllowed(w)
	}
}

func dir_list_get(w http.ResponseWriter, req *http.Request) {

	//time.Sleep(2 * time.Second)

	filepath, err := getRequestParam(req, "path")
	if err != nil {
		filepath = ""
		//		clog.Error("Error: fail parse 'path'", err)
		//		defaultErrorResult(w)
		//		return
	}

	if strings.HasPrefix(filepath, "/") {
		filepath = filepath[1:]
	}

	var outputFiles []DirFile
	if filepath == "" {
		outputFiles = getRootFileList()
	} else {
		outputFiles = getOsFileList(filepath)
	}

	if outputFiles == nil {
		defaultErrorResult(w)
		return
	}

	if GetDebug() {
		debug_header(w)
	}
	var finalData *DirList
	if req.Method == "HEAD" {
		finalData = nil
	} else {
		finalData = &DirList{
			CommonResponse: CommonResponse{Status: 200, Msg: ""},
			Path:           filepath,
			Files:          outputFiles}
	}
	ReturnJson(w, finalData)
}

func getRootFileList() []DirFile {
	roots := GetFileBrowserRoots()
	var dirs []DirFile
	for _, r := range roots {
		dirs = append(dirs, DirFile{
			Filetype: "D",
			Filename: r.Alias,
			Modified: JSONTime(time.Unix(0, 0)),
		})
	}

	return dirs
}

func getOsFileList(filepath string) []DirFile {

	osPath, err := getRequestFile(filepath)
	if err != nil {
		clog.Error("Error: get file", err)
		return nil
	}

	defer osPath.Close()
	stat, err := osPath.Stat()
	if err != nil {
		clog.Error("Error: fail read stat", err)
		return nil
	}

	if !stat.IsDir() {
		clog.Error("Error: fail read dir: not a directory", err)
		return nil
	}

	osFiles, err := osPath.Readdir(-1)
	if err != nil {
		clog.Error("Error: fail read dir list", err)
		return nil
	}

	var outputFiles []DirFile
	for _, file := range osFiles {
		fileType := "F"
		if file.IsDir() {
			fileType = "D"
		}
		outputFiles = append(outputFiles, DirFile{
			Filetype: fileType, Filename: file.Name(), Size: int(file.Size()), Modified: JSONTime(file.ModTime())})
	}

	outputFiles = randomItem(outputFiles)
	return outputFiles
}

func randomItem(ds []DirFile) []DirFile {
	for i := 0; i < 20; i++ {
		d1, d2 := rand.Intn(len(ds)), rand.Intn(len(ds))
		temp := ds[d1]
		ds[d1] = ds[d2]
		ds[d2] = temp
	}

	return ds
}

func dir_get_file(w http.ResponseWriter, req *http.Request) {
	if req.Method == "GET" {
		dir_get_file_get(w, req)
	} else {
		ReturnMethodNotAllowed(w)
	}
}

func dir_get_file_get(w http.ResponseWriter, req *http.Request) {

	filepath, err := getRequestParam(req, "path")
	if err != nil {
		clog.Error("Error: fail parse 'path'", err)
		defaultErrorResult(w)
		return
	}

	osPath, err := getRequestFile(filepath)
	if err != nil {
		clog.Error("Error: get file", err)
		defaultErrorResult(w)
		return
	}

	defer osPath.Close()
	stat, err := osPath.Stat()
	if err != nil {
		clog.Error("Error: fail read stat", err)
		defaultErrorResult(w)
		return
	}

	if stat.IsDir() {
		clog.Error("Error: fail read dir: could not download directory", err)
		defaultErrorResult(w)
		return
	}

	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", "attachment; filename="+url.QueryEscape(stat.Name()))
	//w.Header().Set("Content-Length", strconv.FormatInt(stat.Size(), 10))

	if GetDebug() {
		debug_header(w)
	}
	_, err = io.Copy(w, osPath)
	if err != nil {
		clog.Error("Error: output file", err)
		defaultErrorResult(w)
		return
	}
}

func getRequestFile(filepath string) (*os.File, error) {

	pathParts := strings.Split(filepath, "/")

	pathRoot, err := GetFileBrowserRoot(pathParts[0])
	if err != nil {
		clog.Error("Error: fail get root", err)
		return nil, errors.New("")
	}
	clog.Debug("Path root:", pathRoot)

	pathRemain := strings.Join(pathParts[1:], "/")
	pathFull := pathRoot.Path + "/" + pathRemain
	clog.Debug("OS Path:", pathFull)

	return os.Open(pathFull)
}

func getRequestParam(req *http.Request, key string) (string, error) {

	values, ok := req.URL.Query()[key]
	if !ok || len(values) < 1 {
		return "", errors.New(fmt.Sprintf("Error: fail parse '%v'", key))
	}

	return values[0], nil
}
