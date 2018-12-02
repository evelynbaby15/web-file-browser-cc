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
  gotoPath = '';
  groupFiles = [];

  // CSS sort direction
  sortCol: string;
  sortDirection = 0; // 預設的排序狀態為 0 (0: no sort, 1: asc, 2: desc)

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
      this.sortCol = currentSortCol;
    }

    console.log('sort dir:', this.sortDirection, ', sorcol: ', this.sortCol);
  }


  retrieveData() {
    this.getData(this.currentPath);
  }

  getData(dirName: string) {
    dirName = this.checkDirStr(dirName);
    if (dirName === null) {
      console.error('dir name check fails.');
      return;
    }

    const path = this.dataSourceURL + '/list?path=' + dirName;

    this.httpClient.get(path)
      .subscribe(
        (val: FileModel) => {
          this.data = val;
          console.log('parent:', val.parent, ', path:', val.path);
          this.currentPath = dirName;
          this.gotoPath = dirName;
        }
        , error => {
          console.log('Get http data fails. this.currentPath: ', this.currentPath);
          // FIXME: Revert back to latest correct path.
          // FIXME: 兩個 value. 想要去的跟目前所在的需要是不同的變數
        });
  }

  goToDir(event: Event, dirName: string) {
    console.log('Go to dir:', dirName);
    event.preventDefault();


    this.getData(dirName);
    // this.currentPath = dirName;

  }

  /**
   * 檢查檔案路徑格式是否合法
   *
   * @param directoryName
   */
  checkDirStr(directoryName: string) {
    // 檔案或目錄的 RE 需要符合才繼續往下執行
    let str = directoryName.trim();
    const myRe = /^data(\/[\\\S|*\S]?.*)?(\/)?$/;
    if (str.match(myRe) !== null) {
      const lastDirChar = str.charAt(str.length - 1);
      if (lastDirChar === '/') {
        str = str.slice(0, -1);
      }
      return str;
    }
    return null;
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
    // FIXME: 按下種類排序之後，goToDir() 就會失效？
    const colTag = 'type';
    this.nextDir(colTag); // 因為這邊不能直接使用 sort.reverse, 需要先知道目前的排序是上還是下，所以跟其他排序的 function 呼叫 nextDir() 的時機點不同

    // Step 1: 先將同一天的檔案做群組
    const groups = this.fileGroupByDate();

    // Step 2: 再對群組修改時間做排序
    if (this.sortDirection === 1) {
      groups.sort(sortByGroupTypeModifedTimeAsc);
    } else {
      groups.sort(sortByGroupTypeModifedTimeDesc);
    }

    // Step 3: 最後對每個群組內的檔案做排序，若檔案類型相同，則再對檔名做排序
    groups.forEach((g) => {
      const fileItems = g.fileItems;
      fileItems.sort(sortByType);
    });

    this.groupFiles = groups;
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
    // FIXME: 點了上方排序之後，再點目錄好像也會有問題?
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
          grpTime: key,
          group: formateDateToReadable(parseInt(key, 10)),
          fileItems: group_to_values[key]
        };
      });

    // console.log('groups:', groups);
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

// 依日期群組排序，排序的是日期時間，不是日期的群組名稱
function sortByGroupTypeModifedTimeAsc(a, b) {
  return (parseInt(a.grpTime, 10) - parseInt(b.grpTime, 10));
}
function sortByGroupTypeModifedTimeDesc(a, b) {
  return (parseInt(b.grpTime, 10) - parseInt(a.grpTime, 10));
}


/** Time related fuction */
function getDateTimeStart(timestamp: number) {
  return Math.floor(timestamp / (1000 * 60 * 60 * 24));
}

function formateDateToReadable(timestamp_start: number) {
  const date = new Date(timestamp_start * 1000 * 60 * 60 * 24);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${dayNames[date.getDay()]})`;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

