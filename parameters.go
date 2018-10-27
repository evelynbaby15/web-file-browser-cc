package main

import (
	"errors"
)

const SERVE = ":8812"
const STATIC_FILE_ROOT = "C:/workspace/ict/gitsvn/ictinv-ui-svcmgt/dist"
const STATIC_FILE_INDEX = STATIC_FILE_ROOT + "/index.html"

func GetServerPort() string {
	return SERVE
}

func GetStaticRoot() string {
	return STATIC_FILE_ROOT
}

func GetStaticIndexDoc() string {
	return STATIC_FILE_INDEX
}

type DirRoot struct {
	Alias string
	Path  string
}

func GetFileBrowserRoots() []DirRoot {
	return []DirRoot{
		DirRoot{Alias: "a", Path: "C:/workspace/httptest2"}}
}

func GetFileBrowserRoot(root string) (DirRoot, error) {
	for _, r := range GetFileBrowserRoots() {
		if root == r.Alias {
			return r, nil
		}
	}

	return DirRoot{}, errors.New("Root not found")
}
