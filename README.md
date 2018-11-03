
# web-file-browser - An web-based file browser made by Angular6(frontend) + Go(backend)

## command parameters

- `-d`: Debug mode
- `-p`: Listen port (default to 80)
- `-r`: Serve roots (multiple times are allowed)

	Format: (alias):(directory path)
	For example: -r dirname:/path/to/folder/something

## Docker build instruction

- `docker build -t web-file-browser .`
- ```docker run -d \
	-p 8800:8800 -v /path/to/data:/data
	```
