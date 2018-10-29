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
  currentPath: string;
  sortDirection = true;

  dataSourceURL = 'http://192.168.1.111:8811/api/list';

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
    this.httpClient.get(this.dataSourceURL + '?path=a')
      .subscribe(
        (val: FileModel) => { this.data = val; console.log(val); }
      );
    this.currentPath = 'a'; // FIXME
  }

  sortColByFileName(event: Event) {
    event.preventDefault();

    const colTag = 'fileName';
    const fileItems = this.data.files;

    if (colTag === this.currentSortColumn) {
      fileItems.reverse();
      this.sortDirection =  !this.sortDirection;
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

  goToDirOrDownload(event: Event, type: string, path: string) {
    event.preventDefault();

    if (type === 'D') {
      this.currentPath = path;
      // TODO
    } else {
      // type === 'F' means need to download file
      confirm('Do you really want to donwload file: ' + path + ' ?');
      // TODO
    }
    // this.httpClient.get<FileModel>(this.dataSourceURL + '?path=' + dir)
    // .subscribe(
    //   val => { this.data = val; console.log(val); }
    // );
  }


  downloadFile() {
    this.httpClient.get('http://192.168.1.111:8811/api/file' + '?path=a/package.json',
    {/*observe: 'response',*/ responseType: 'blob'}).subscribe(
      (res: Blob) => {
        console.log(res);
        var url = window.URL.createObjectURL(res);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.href = url;
        a.download = 'testxxx'; // TODO file name
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove(); // remove the element
      }
    );

  }
}
