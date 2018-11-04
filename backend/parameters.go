package main

import (
	"errors"
	"flag"
	"strings"

	"gitlab.com/simiecc/golib/clog"
)

// types from
// https://stackoverflow.com/questions/28322997/how-to-get-a-list-of-values-into-a-flag-in-golang
type arrayFlags []string

func (i *arrayFlags) String() string {
	return "my string representation"
}

func (i *arrayFlags) Set(value string) error {
	*i = append(*i, value)
	return nil
}

// program parameters
var p_port string
var p_static_root string
var p_static_index string
var p_debug bool
var p_serveroots arrayFlags
var p_serveroots_parsed []DirRoot = nil

func initProgramArgs() {
	flag.StringVar(&p_port, "p", "8800", "Specify server list port")
	flag.StringVar(&p_static_root, "root", "./dist/", "Specify UI files root directory")
	flag.StringVar(&p_static_index, "index", "index.html", "Specifiy index filename in {root}")
	flag.BoolVar(&p_debug, "d", false, "Debug mode")
	flag.Var(&p_serveroots, "r", "Serve root directories(format: \"alias:directory\", multiple is acceptable).")

	flag.Parse()
}

func GetDebug() bool {
	return p_debug
}

func GetServerPort() string {
	return ":" + p_port
}

func GetStaticRoot() string {
	return p_static_root
}

func GetStaticIndexDoc() string {
	return GetStaticRoot() + "/" + p_static_index
}

type DirRoot struct {
	Alias string
	Path  string
}

func GetFileBrowserRoots() []DirRoot {
	if p_serveroots_parsed == nil {
		parseBrowserRoot()
	}

	return p_serveroots_parsed
	//	return []DirRoot{
	//		DirRoot{Alias: "a", Path: "C:/workspace/httptest2"},
	//		DirRoot{Alias: "b", Path: "D:/movies"},
	//	}
}

func parseBrowserRoot() {
	p_serveroots_parsed = []DirRoot{}
	if len(p_serveroots) == 0 {
		p_serveroots_parsed = append(p_serveroots_parsed, DirRoot{Alias: "data", Path: "/data"})
		return
	}

	for _, rstr := range p_serveroots {
		index := strings.Index(rstr, ":")
		if index == -1 {
			clog.Errorf("Invalid root config: %v", rstr)
		}

		targetpath := rstr[index+1:]
		targetpath = strings.Replace(targetpath, "\\", "/", -1)

		cfg := DirRoot{Alias: rstr[:index], Path: targetpath}
		p_serveroots_parsed = append(p_serveroots_parsed, cfg)
	}
}

func GetFileBrowserRoot(root string) (DirRoot, error) {
	for _, r := range GetFileBrowserRoots() {
		if root == r.Alias {
			return r, nil
		}
	}

	return DirRoot{}, errors.New("Root not found")
}
