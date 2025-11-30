# iCattle.ai Platform MVP: Deployment and Testing Guide

This document provides the final, step-by-step instructions to deploy and test the Minimal Viable Product (MVP) of the iCattle.ai platform, built on the bank-grade **Turing Core** architecture.

The MVP demonstrates the core **Turing Protocol** flow: **API Gateway (Context Enforcement) $\rightarrow$ Core Logic (Muzzle Hash) $\rightarrow$ Command Dispatcher (Persist-then-Publish) $\rightarrow$ PostgreSQL (Audit) $\rightarrow$ Kafka (Event Bus)**.

## Prerequisites

You must have the following installed on your local machine:

1.  **Docker** and **Docker Compose**
2.  **Python 3.10+**
3.  **PowerShell** (or any standard terminal)

## Step 1: Setup and Infrastructure Deployment

1.  **Unzip the Archive:** Unzip the provided `icattle_ai.zip` file into a directory (e.g., `C:\Projects\iCattle`).
2.  **Navigate to Project Root:** Open your terminal and navigate to the project root:
    ```powershell
    cd C:\Projects\iCattle
    ```
3.  **Install Python Dependencies:** Install all required libraries:
    ```powershell
    pip install fastapi uvicorn pydantic confluent-kafka psycopg2-binary requests
    ```
4.  **Start Infrastructure:** Deploy the dedicated Kafka and PostgreSQL services using Docker Compose.
    ```powershell
    docker compose up -d
    ```
    *This command will start the services and automatically create the `agritech.animal.events` Kafka topic and the `events` table in PostgreSQL.*

## Step 2: Run the Application Components

You will need **three separate terminal windows** for this step.

### Window 1: API Gateway (The "Server")

This runs the core application, enforcing the Turing Protocol.

```powershell
uvicorn icattle_ai.src.api.main:app --reload --host 0.0.0.0 --port 8001
```
*Wait for the message: `Uvicorn running on http://0.0.0.0:8001`*

### Window 2: Kafka Consumer (The "ML Processor")

This simulates the downstream ML services (e.g., Behavioral Analytics) consuming the event.

```powershell
python .\icattle_ai\src\infrastructure\kafka_consumer.py
```
*This window will show: `Starting Kafka Consumer for topic: agritech.animal.events...`*

## Step 3: End-to-End Testing

### Window 3: Test Client (The "Mobile App")

This simulates the mobile app sending an `AnimalImageCaptured` command with all required contextual headers.

```powershell
python .\icattle_ai\test_client.py
```

### Expected Results

| Window | Expected Output | Confirmation of Success |
| :--- | :--- | :--- |
| **Window 3 (Client)** | `✅ COMMAND DISPATCH SUCCESSFUL` | Confirms the API accepted the command and the event was persisted to PostgreSQL. |
| **Window 2 (Consumer)** | `✅ EVENT RECEIVED FROM KAFKA` | Confirms the event was successfully published to Kafka and is available for downstream services. |

This successful test confirms that the **Turing Protocol** is fully enforced and the bank-grade, event-driven pipeline is operational.
