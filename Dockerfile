# build backend
FROM golang:1.11 AS build-env
ADD backend /src
RUN cd /src && GOOS=linux GOARCH=amd64 go build -o app

# build frontend
FROM node:10.13-alpine AS build-frontend
ADD frontend /src
RUN cd /src && npm install && npm run build-prod

# final stage
#FROM debian:stretch
FROM alpine
RUN mkdir /lib64 && ln -s /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2

EXPOSE 8800/tcp
ENV ARGS ""

WORKDIR /app

COPY run.sh /app/
COPY --from=build-env /src/app /app/
COPY --from=build-frontend /src/dist /app/dist/

ENTRYPOINT ["sh", "./run.sh"]
