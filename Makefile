all: frontend backend

FORCE:

frontend: FORCE
	$(MAKE) -C ./frontend $(MAKECMDGOALS)

backend: FORCE
	$(MAKE) -C ./backend $(MAKECMDGOALS)

clean: frontend backend

