.PHONY: help setup start stop restart logs db-up db-down db-reset db-push db-seed clean

# Default target
help:
	@echo "iCattle Dashboard - Development Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup        - Initial setup (install deps, start DB, push schema)"
	@echo ""
	@echo "Docker Services:"
	@echo "  make start        - Start all Docker services"
	@echo "  make stop         - Stop all Docker services"
	@echo "  make restart      - Restart all Docker services"
	@echo "  make logs         - View Docker logs"
	@echo ""
	@echo "Database:"
	@echo "  make db-up        - Start PostgreSQL only"
	@echo "  make db-down      - Stop PostgreSQL and remove volumes"
	@echo "  make db-reset     - Reset database (drop and recreate)"
	@echo "  make db-push      - Push schema to database"
	@echo "  make db-seed      - Seed database with test data"
	@echo "  make db-shell     - Open psql shell"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development server"
	@echo "  make check        - Run TypeScript type checking"
	@echo "  make test         - Run tests"
	@echo "  make clean        - Clean up containers and volumes"

# Initial setup
setup:
	@echo "🚀 Setting up iCattle Dashboard..."
	@echo ""
	@echo "📦 Installing dependencies..."
	pnpm install
	@echo ""
	@echo "🐘 Starting PostgreSQL..."
	docker-compose up -d postgres
	@echo ""
	@echo "⏳ Waiting for PostgreSQL to be ready..."
	@sleep 5
	@echo ""
	@echo "📊 Pushing database schema..."
	pnpm drizzle-kit generate
	pnpm drizzle-kit migrate
	@echo ""
	@echo "🌱 Seeding test data..."
	pnpm exec tsx scripts/seed.ts
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start the development server."

# Docker services
start:
	@echo "🚀 Starting all Docker services..."
	docker-compose up -d

stop:
	@echo "🛑 Stopping all Docker services..."
	docker-compose stop

restart:
	@echo "🔄 Restarting all Docker services..."
	docker-compose restart

logs:
	@echo "📋 Viewing Docker logs (Ctrl+C to exit)..."
	docker-compose logs -f

# Database commands
db-up:
	@echo "🐘 Starting PostgreSQL..."
	docker-compose up -d postgres
	@echo "⏳ Waiting for PostgreSQL to be ready..."
	@sleep 3
	@docker exec icattle-postgres pg_isready -U icattle -d icattle

db-down:
	@echo "🛑 Stopping PostgreSQL and removing volumes..."
	docker-compose down -v postgres

db-reset: db-down db-up
	@echo "🔄 Resetting database..."
	@sleep 3
	@echo "📊 Pushing schema..."
	pnpm drizzle-kit generate
	pnpm drizzle-kit migrate
	@echo "🌱 Seeding test data..."
	pnpm exec tsx scripts/seed.ts
	@echo "✅ Database reset complete!"

db-push:
	@echo "📊 Pushing schema to database..."
	pnpm drizzle-kit generate
	pnpm drizzle-kit migrate

db-seed:
	@echo "🌱 Seeding database with test data..."
	pnpm exec tsx scripts/seed.ts

db-shell:
	@echo "🐚 Opening PostgreSQL shell..."
	docker exec -it icattle-postgres psql -U icattle -d icattle

# Development commands
dev:
	@echo "🚀 Starting development server..."
	pnpm dev

check:
	@echo "🔍 Running TypeScript type checking..."
	pnpm check

test:
	@echo "🧪 Running tests..."
	pnpm test

# Cleanup
clean:
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	rm -rf node_modules
	rm -rf dist
	@echo "✅ Cleanup complete!"
