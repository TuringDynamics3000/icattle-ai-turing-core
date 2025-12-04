-- PostgreSQL Initialization Script for iCattle Dashboard
-- This script ensures the database and user are properly created

-- Create user if not exists
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'icattle') THEN
    CREATE ROLE icattle WITH LOGIN PASSWORD 'icattle_dev_password';
  END IF;
END
$$;

-- Create database if not exists
SELECT 'CREATE DATABASE icattle OWNER icattle'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'icattle')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE icattle TO icattle;

-- Connect to icattle database and grant schema privileges
\c icattle

-- Grant privileges on public schema
GRANT ALL ON SCHEMA public TO icattle;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO icattle;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO icattle;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO icattle;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO icattle;

-- Ensure icattle can create tables
ALTER ROLE icattle CREATEDB;
