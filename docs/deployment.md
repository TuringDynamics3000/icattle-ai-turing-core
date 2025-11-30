# Deployment & Operations Guide

This guide provides instructions for deploying, managing, and monitoring the iCattle.ai platform.

---

## 1. Deployment

The platform is designed to be deployed using Docker and Docker Compose, which simplifies the setup and ensures consistency across environments.

### 1.1. Production Deployment

For a production environment, it is recommended to:

- Use a managed PostgreSQL and Kafka service (e.g., Amazon RDS, Confluent Cloud) for high availability and automated backups.
- Run the API Gateway and Kafka Consumer services in a container orchestration platform like Kubernetes or Amazon ECS for scalability and resilience.
- Store Docker images in a private container registry (e.g., Amazon ECR, Docker Hub).

### 1.2. Local Deployment (for Development)

The included docker-compose.yml file is configured for local development. To start all services:

docker-compose up -d

This will start:
- PostgreSQL: on localhost:5433
- Kafka: on localhost:9093
- Zookeeper: on localhost:2181

---

## 2. Configuration

Application configuration is managed through environment variables and configuration files.

- docker-compose.yml: Defines the infrastructure services (PostgreSQL, Kafka) and their configurations.
- src/infrastructure/event_store.py: Contains the database connection settings (DB_CONFIG).
- src/infrastructure/kafka_consumer.py: Contains the Kafka connection settings (KAFKA_CONFIG).

For production, these settings should be managed through environment variables or a configuration service (e.g., AWS Parameter Store, HashiCorp Vault).

---

## 3. Monitoring & Health Checks

### 3.1. Infrastructure

- PostgreSQL: Use standard PostgreSQL monitoring tools (e.g., pg_stat_activity, pg_stat_statements) to monitor database health and performance.
- Kafka: Use Kafka monitoring tools (e.g., Confluent Control Center, Prometheus JMX Exporter) to monitor broker health, topic throughput, and consumer lag.

### 3.2. Application

- API Gateway: The FastAPI application automatically provides interactive API documentation at http://localhost:8001/docs.
- Logs: All services print logs to standard output. When running in Docker, you can view logs using docker-compose logs -f.

---

## 4. Troubleshooting

- role turing_user does not exist: This error means the application cannot connect to the PostgreSQL database with the correct user. Ensure that the PostgreSQL container was initialized correctly and that the DB_CONFIG in event_store.py matches the settings in docker-compose.yml.
- connection to server at localhost (::1 ), port 5432 failed: This indicates a port conflict or a misconfiguration. Ensure that no other PostgreSQL instance is running on the same port and that the port mapping in docker-compose.yml is correct.
- Kafka Consumer Not Receiving Events: This can happen if the Kafka topic does not exist, the consumer group has already committed offsets, or there is a network issue between the consumer and the Kafka broker.

---

*This document is maintained by TuringDynamics.*
