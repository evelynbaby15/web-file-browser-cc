
# web-file-browser - An web-based file browser made by Angular6(frontend) + Go(backend)

## command parameters

- `-d`: Debug mode
- `-p`: Listen port (default to 80)
- `-r`: Serve roots (multiple times are allowed)

	Format: (alias):(directory path)

	For example: -r dirname:/path/to/folder/something


## Docker build instruction

- Build image

	`make`

- Start image

```docker run -d \
-p 8800:8800 -v /path/to/data:/data
```

## Develop

### Frontend

- install node.js 8+ & angular-cli ([install steps of angular-cli][angular-cli])
- `cd frontend/`
- `npm install`
- `ng serve`

### Backend

- install Go 1.11+ and set GO111MODULE=on
- `cd backend/`
- `go build`

[angular-cli]: https://github.com/angular/angular-cli/wiki


### Demo
![demo-img](https://github.com/evelynbaby15/web-file-browser-cc/blob/br1/frontend/web-file-browser-demo-2.gif?raw=true)
