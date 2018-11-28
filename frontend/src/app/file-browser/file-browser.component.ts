import { Component, OnInit } from '@angular/core';
import { FileModel, FileItem } from '../file-model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { createOfflineCompileUrlResolver } from '@angular/compiler';

@Component({
  selector: 'app-file-browser',
  templateUrl: './file-browser.component.html',
  styleUrls: ['./file-browser.component.scss']
})
export class FileBrowserComponent implements OnInit {
  data: FileModel;
  currentPath = 'data';
  groupFiles = [];

  // CSS sort direction
  sortCol: string;
  sortDirection = 0; // 預設的排序狀態為 0 (0: no sort, 1: asc, 2: desc)

  /**
   * 設定接下來要顯示的排序狀態，並重新調整目前使用者 click 排序的項目
   * @param currentSortCol 目前排序的項目
   */
  nextDir(currentSortCol) {
    if (this.sortCol === currentSortCol) {
      if (this.sortDirection < 2) {
        this.sortDirection++;
      } else { this.sortDirection = 1; }
    } else {
      this.sortDirection = 1;
      this.sortCol = currentSortCol; // FIXME: 順序有問題?
    }

    console.log('sort dir:', this.sortDirection, ', sorcol: ', this.sortCol);
  }

  dataSourceURL = '/api';
  // listDataURL = this.dataSourceURL + '/list?path='; // TODO : How to use string interpolation to foramt this URL?

  constructor(private httpClient: HttpClient) { }

  ngOnInit() {
    if (environment.data) {
      this.data = environment.data;
    } else {
      this.retrieveData();
    }
    // this.data = JSON.parse('{"status":200,"msg":"","files":[{"type":"D","name":"test_dir","size":0,"modified":1540606706000},{"type":"F","name":"file.txt","size":205,"modified":1540606806003}]}');
  }


  retrieveData() {
    const path = this.dataSourceURL + '/list?path=' + this.currentPath;
    this.getData(path);
  }

  getData(path: string) {
    this.httpClient.get(path)
      .subscribe(
        (val: FileModel) => { this.data = val; console.log('parent:', val.parent, ', path:', val.path); }
      );
    //this.currentPath = path;
  }

  goToDir(event: Event, dirName: string) {
    event.preventDefault();

    console.log('Go to dir:', dirName);
    const path = this.dataSourceURL + '/list?path=' + dirName;
    this.getData(path);
    // this.httpClient.get(path)
    //   .subscribe(
    //     (val: FileModel) => { this.data = val; console.log(val); }
    //   );
    this.currentPath = dirName;
  }

  sortColByFileName(event: Event) {
    event.preventDefault();

    const colTag = 'fileName';
    const fileItems = this.data.files;

    if (colTag === this.sortCol) {
      fileItems.reverse();
      // this.sortDirDefault = !this.sortDirDefault;
      // return;
    } else {
      fileItems.sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
    }

    // this.sortCol = colTag;
    this.nextDir(colTag);

  }

  sortColByType(event: Event) {
    event.preventDefault();

    const colTag = 'type';
    const groups = this.fileGroupByDate();

    // FIXME: 也要依日期群組排序，排序的是依照日期的時間，不是日期的名字
    if (colTag === this.sortCol) {
      groups.sort((a, b) => {
        return ('' + a.group).localeCompare('' + b.group);
      });
    } else {
      groups.sort((a, b) => {
        return ('' + b.group).localeCompare('' + a.group);
      });
    }


    groups.forEach((g) => {
      const fileItems = g.fileItems;
      if (colTag === this.sortCol) {
        console.log('reverse');
        fileItems.sort(sortByTypeReverse);
      } else {
        console.log('sort');
        fileItems.sort(sortByType);
      }
    });



    this.groupFiles = groups;
    this.nextDir(colTag);
  }

  sortColByFileSize(event: Event) {
    event.preventDefault();

    const colTag = 'size';
    const fileItems = this.data.files;
    if (colTag === this.sortCol) {
      fileItems.reverse();
      // return;
    } else {
      this.data.files.sort((a, b) => {
        return a.size - b.size;
      });
    }
    // this.sortCol = colTag;
    this.nextDir(colTag);
  }

  sortColByDate(event: Event) {
    event.preventDefault();

    const colTag = 'date';
    const fileItems = this.data.files;
    if ('date' === this.sortCol) {
      fileItems.reverse();
      // return;
    } else {
      fileItems.sort((a, b) => {
        return a.modified - b.modified;
      });
    }
    this.nextDir(colTag);
  }

  goToDirOrDownload(event: Event, type: string, fileName: string) {
    event.preventDefault();

    // 'D': Go to directory
    if (type === 'D') {
      this.goToDir(event, this.currentPath + '/' + fileName);
    } else {
      // 'F': download file
      const r: boolean = confirm('Do you really want to donwload the file: ' + fileName + ' ?');
      if (r) {
        this.downloadFile(fileName);
      }
    }
  }


  downloadFile(fileName: string) {
    // this.httpClient.get(this.dataSourceURL + '/file?path=a/package.json',
    const filePath = this.dataSourceURL + '/file?path=' + this.currentPath + '/' + fileName;
    console.log('download file: ', filePath);
    this.httpClient.get(filePath,
      {/*observe: 'response',*/ responseType: 'blob' }).subscribe(
        (res: Blob) => {
          console.log(res);
          const url = window.URL.createObjectURL(res);
          const a = document.createElement('a');
          document.body.appendChild(a);
          a.setAttribute('style', 'display: none');
          a.href = url;
          a.download = fileName; // download file naming.
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove(); // remove the element
        }
      );

  }


  /*
    *
     [{group: "2018/11/26",
      files: ['item 1', 'item 2']},
        ...
     ]
    */
  fileGroupByDate() {
    const fileItems = this.data.files;
    const group_to_values = fileItems.reduce((obj, item) => {
      const groupByDate = getDateTimeStart(item.modified);
      obj[groupByDate] = obj[groupByDate] || [];
      obj[groupByDate].push(item);
      return obj;
    }, {});

    const groups = Object.keys(group_to_values)
      .map((key) => {
        return {
          group: formateDateToReadable(parseInt(key, 10)),
          fileItems: group_to_values[key]
        };
      });

    console.log('groups:', groups);
    // this.groupFiles = groups;
    return groups;
  }


}

/** Custom sorting function */
function sortByType(a, b) {
  // 先排 type, 若 type 相同，則依 name 排序
  const r = ('' + a.type).localeCompare('' + b.type);
  if (r === 0) {
      return ('' + a.name).localeCompare('' + b.name);
  }
  return r;
}

function sortByTypeReverse(a, b) {
  const r = ('' + b.type).localeCompare('' + a.type);
  if (r === 0) {
      return ('' + a.name).localeCompare('' + b.name);
  }
  return r;
}



function getDateTimeStart(timestamp: number) {
  return Math.floor(timestamp / (1000 * 60 * 60 * 24));
}

function formateDateToReadable(timestamp_start: number) {
  const date = new Date(timestamp_start * 1000 * 60 * 60 * 24);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${dayNames[date.getDay()]})`;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

