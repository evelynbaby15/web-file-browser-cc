package main

import (
	//	"fmt"
	"strconv"
	"time"
)

type CommonResponse struct {
	Status int    `json:"status"`
	Msg    string `json:"msg"`
}

type JSONTime time.Time

func (t JSONTime) MarshalJSON() ([]byte, error) {
	//do your serializing here
	//stamp := fmt.Sprintf("\"%s\"", time.Time(t).Format("Mon Jan _2"))
	timeMilli := time.Time(t).Unix() * 1000

	return []byte(strconv.FormatInt(timeMilli, 10)), nil
}

type DirFile struct {
	Filetype string   `json:"type"`
	Filename string   `json:"name"`
	Size     int      `json:"size"`
	Modified JSONTime `json:"modified"`
}

type DirList struct {
	CommonResponse
	Files []DirFile `json:"files"`
}
