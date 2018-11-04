export class FileModel {
  status: number;
  msg: string;
  parent: string;
  path: string;
  files: FileItem[];
}

export class FileItem {
  type: string;
  name: string;
  size: number;
  modified: number;
}
