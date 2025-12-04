# Getting Started with iCattle Dashboard

## 🚀 Quick Start (Recommended)

```bash
# Clone the repository
git clone https://github.com/TuringDynamics3000/icattle-ai-turing-core.git
cd icattle-ai-turing-core

# One-command setup
make setup

# Start development
pnpm dev
```

That's it! Visit http://localhost:3000

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get running in 5 minutes
- **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** - Detailed local development guide
- **[POSTGRESQL_MIGRATION.md](./POSTGRESQL_MIGRATION.md)** - PostgreSQL migration details
- **[NEXT_STEPS.md](./NEXT_STEPS.md)** - What to do after setup

## 🐘 PostgreSQL Migration

The project has been migrated from MySQL to PostgreSQL for:
- Better JSON support (JSONB)
- No constraint name limits
- Advanced features (CTEs, window functions)
- Consistency with event sourcing architecture

All migration details in [POSTGRESQL_MIGRATION.md](./POSTGRESQL_MIGRATION.md).

## 🛠️ Development Tools

### Make Commands

```bash
make setup        # Initial setup
make dev          # Start dev server
make db-reset     # Reset database
make db-seed      # Add test data
make db-shell     # Open psql
make logs         # View logs
make help         # Show all commands
```

### pnpm Scripts

```bash
pnpm dev          # Start development server
pnpm check        # TypeScript type checking
pnpm test         # Run tests
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed test data
pnpm db:test      # Test database connection
pnpm db:studio    # Open Drizzle Studio
```

## 🐳 Docker Services

The project includes Docker Compose configuration for:

- **PostgreSQL 16** - Main database (port 5432)
- **pgAdmin** - Database management UI (port 5050)
- **Kafka** - Event streaming (port 9092)
- **Kafka UI** - Kafka management (port 8080)

Start services:
```bash
docker-compose up -d postgres pgadmin
```

## 📊 Test Data

After running `make setup` or `pnpm db:seed`, you'll have:

- 1 admin user
- 2 test farms (Riverside Cattle Station, Highland Breeding Farm)
- 5 cattle with complete records
- Lifecycle events and valuations

## 🔧 Configuration

Copy `.env.local.example` to `.env`:

```bash
cp .env.local.example .env
```

Default PostgreSQL connection (works out of the box):
```
DATABASE_URL=postgresql://icattle:icattle_dev_password@localhost:5432/icattle
```

## 🌐 Access Points

After setup:

- **Application**: http://localhost:3000
- **pgAdmin**: http://localhost:5050 (admin@icattle.local / admin)
- **Kafka UI**: http://localhost:8080
- **Drizzle Studio**: `pnpm db:studio`

## 📖 Project Structure

```
icattle-ai-turing-core/
├── client/              # Frontend (React + TypeScript)
├── server/              # Backend (Node.js + Express)
├── drizzle/             # Database schema
│   └── schema.ts        # PostgreSQL schema
├── scripts/             # Utility scripts
│   ├── seed.ts          # Test data seeder
│   └── test-connection.ts
├── docker-compose.yml   # Docker services
├── Makefile             # Development commands
└── *.md                 # Documentation
```

## 🆘 Troubleshooting

### Port 5432 in use
```bash
sudo systemctl stop postgresql
# or change port in docker-compose.yml
```

### Connection refused
```bash
docker-compose restart postgres
docker logs icattle-postgres
```

### No tables found
```bash
pnpm db:push
pnpm db:test
```

### Reset everything
```bash
make clean
make setup
```

## 🎯 Next Steps

1. ✅ Complete setup: `make setup`
2. ✅ Verify: `pnpm db:test`
3. ✅ Start dev server: `pnpm dev`
4. 🚀 Build ag-platform integration
5. 🚀 Implement OAuth flows
6. 🚀 Test Xero integration

## 📝 Additional Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

## 💬 Support

For issues or questions:
1. Check the documentation files
2. Review Docker logs: `docker logs icattle-postgres`
3. Test connection: `pnpm db:test`
4. Open an issue on GitHub

---

**Ready to develop?** Run `make setup` and you're good to go! 🚀
