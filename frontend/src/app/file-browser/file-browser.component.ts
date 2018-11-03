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
  currentSortColumn: string;
  currentPath = 'data';
  sortDirection = true;

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
        (val: FileModel) => { this.data = val; console.log(val); }
      );
    //this.currentPath = path;
  }

  goToDir(dirName: string) {
    console.log('Go to dir:', dirName);
    const path = this.dataSourceURL + '/list?path=' + this.currentPath + '/' + dirName;
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

    if (colTag === this.currentSortColumn) {
      fileItems.reverse();
      this.sortDirection = !this.sortDirection;
      return;
    }

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
    this.currentSortColumn = colTag;

  }

  sortColByType(event: Event) {
    event.preventDefault();

    const colTag = 'type';
    const fileItems = this.data.files;

    if (colTag === this.currentSortColumn) {
      fileItems.reverse();
      return;
    }

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

    this.currentSortColumn = colTag;
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
    if (colTag === this.currentSortColumn) {
      fileItems.reverse();
      return;
    }

    this.data.files.sort((a, b) => {
      return a.size - b.size;
    });

    this.currentSortColumn = colTag;

  }

  sortColByDate(event: Event) {
    event.preventDefault();

    const fileItems = this.data.files;
    if ('date' === this.currentSortColumn) {
      fileItems.reverse();
      return;
    }
    fileItems.sort((a, b) => {
      return a.modified - b.modified;
    });

    this.currentSortColumn = 'date';
  }

  /*
  compareString(a: FileItem, b: FileItem, column: string) {
    const nameA = a[column].toUpperCase();
    const nameB = b[column].toUpperCase();

    if (nameA === nameB) {
      return 0;
    }

    const compare = (nameA < nameB);
    if (compare) {
      return -1;
    } else {
      return 1;
    }
  }
  */

  goToDirOrDownload(event: Event, type: string, fileName: string) {
    event.preventDefault();

    // 'D': Go to directory
    if (type === 'D') {
      this.goToDir(fileName);
    } else {
      // 'F': download file
      confirm('Do you really want to donwload the file: ' + fileName + ' ?');
      this.downloadFile(fileName);
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
}
