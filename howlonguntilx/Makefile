.PHONY: dev build db-push db-seed

dev:
	npm run dev

build:
	npm run build

db-push:
	npm run db:push

db-seed:
	npm run db:seed

install:
	npm install

setup: install db-push db-seed
	@echo "✅ Ready — run: make dev"
