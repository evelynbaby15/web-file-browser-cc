all: FORCE
	docker build -t simiecc/web-file-browser .

FORCE:

clean: frontend backend
