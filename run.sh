#!/bin/sh

FULLARGS="${ARGS} $@"
echo "Startup args: ${FULLARGS}"
./app ${FULLARGS}
