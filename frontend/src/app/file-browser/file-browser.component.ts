import { Component, OnInit } from '@angular/core';
import { FileModel, FileItem } from '../file-model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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
      } else { this.sortDirection = 0; }
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

  goToDir(dirName: string) {
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
    this.fileGroupByDate();
    /*
    const fileItems = this.data.files;
    if (colTag === this.sortCol) {
      fileItems.reverse();
    } else {
      fileItems.sort((a, b) => {
        if (a.type < b.type) {
          return -1;
        } else if (a.type > b.type) {
          return 1;
        } else {
          const nameA = a.name.toUpperCase();
          const nameB = b.name.toUpperCase();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        }
      });
    }
    */
    // this.sortCol = colTag;
    this.nextDir(colTag);
  }


  /*
  sortColByString(event: Event, name: string) {
    event.preventDefault();

    const fileItems = this.data.files;
    if (name === this.currentSortColumn) {
      fileItems.reverse();
      return;
    }
    fileItems.sort((a, b) => {
      return this.compareString(a, b, name);
    });

    this.currentSortColumn = name;

  }
  */

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
      this.goToDir(this.currentPath + '/' + fileName);
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
    this.groupFiles = groups;

  }


}


function getDateTimeStart(timestamp: number) {
  return Math.floor(timestamp / (1000 * 60 * 60 * 24));
}

function formateDateToReadable(timestamp_start: number) {
  const date = new Date(timestamp_start * 1000 * 60 * 60 * 24);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${dayNames[date.getDay()]})`;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

