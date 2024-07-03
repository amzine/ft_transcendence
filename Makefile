FOLDER = $(shell basename $(CURDIR))

all: build

build:
	@docker-compose up --build -d

start:
	@docker-compose start -d

stop:
	@docker-compose stop

clean:
	@docker-compose down
	# @docker rmi frontend backend
	@docker volume rm $(FOLDER)_database