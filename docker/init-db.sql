-- PostgreSQL Initialization Script for iCattle Dashboard
-- Runs automatically on first container startup

-- Create icattle user with password
CREATE ROLE icattle WITH LOGIN PASSWORD 'icattle_dev_password' CREATEDB;

-- Grant all privileges on the icattle database
GRANT ALL PRIVILEGES ON DATABASE icattle TO icattle;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO icattle;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO icattle;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO icattle;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO icattle;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO icattle;
