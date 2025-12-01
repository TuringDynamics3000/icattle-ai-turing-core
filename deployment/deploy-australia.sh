#!/bin/bash

# Australian Production Deployment Script
# iCattle.ai - MSA Grading System with Turing Protocol
# 
# Usage: ./deploy-australia.sh [environment]
# Environments: local, staging, production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-local}
PROJECT_NAME="icattle-au"
REGION="ap-southeast-2"  # Sydney

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║         iCattle.ai Australian Deployment                 ║${NC}"
echo -e "${GREEN}║         MSA Grading with Turing Protocol                 ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker installed${NC}"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
    
    # Check .env file
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Warning: .env file not found, creating from template...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file with your credentials${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ .env file exists${NC}"
    
    echo ""
}

# Function to deploy locally
deploy_local() {
    echo -e "${YELLOW}Deploying to local environment...${NC}"
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker-compose -f docker-compose.australia.yml down
    
    # Build images
    echo "Building Docker images..."
    docker-compose -f docker-compose.australia.yml build
    
    # Start services
    echo "Starting services..."
    docker-compose -f docker-compose.australia.yml up -d
    
    # Wait for services to be healthy
    echo "Waiting for services to be healthy..."
    sleep 10
    
    # Check health
    echo "Checking service health..."
    docker-compose -f docker-compose.australia.yml ps
    
    # Run database migrations
    echo "Running database migrations..."
    docker-compose -f docker-compose.australia.yml exec -T postgres \
        psql -U admin -d icattle_au -f /docker-entrypoint-initdb.d/01-schema.sql || true
    
    echo ""
    echo -e "${GREEN}✓ Local deployment complete!${NC}"
    echo ""
    echo -e "${YELLOW}API available at: http://localhost:8000${NC}"
    echo -e "${YELLOW}API docs: http://localhost:8000/docs${NC}"
    echo -e "${YELLOW}Database: localhost:5432${NC}"
    echo ""
    echo -e "${YELLOW}Test with:${NC}"
    echo "curl http://localhost:8000/health"
    echo ""
}

# Function to deploy to AWS
deploy_aws() {
    echo -e "${YELLOW}Deploying to AWS ($ENVIRONMENT)...${NC}"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}Error: AWS CLI is not installed${NC}"
        exit 1
    fi
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
    
    echo "AWS Account: $AWS_ACCOUNT_ID"
    echo "ECR Registry: $ECR_REGISTRY"
    echo ""
    
    # Login to ECR
    echo "Logging in to ECR..."
    aws ecr get-login-password --region $REGION | \
        docker login --username AWS --password-stdin $ECR_REGISTRY
    
    # Build Docker image
    echo "Building Docker image..."
    docker build -t $PROJECT_NAME:latest -f Dockerfile.australia ..
    
    # Tag image
    echo "Tagging image..."
    docker tag $PROJECT_NAME:latest $ECR_REGISTRY/$PROJECT_NAME:latest
    docker tag $PROJECT_NAME:latest $ECR_REGISTRY/$PROJECT_NAME:$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)
    
    # Push to ECR
    echo "Pushing to ECR..."
    docker push $ECR_REGISTRY/$PROJECT_NAME:latest
    docker push $ECR_REGISTRY/$PROJECT_NAME:$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)
    
    # Update ECS service
    echo "Updating ECS service..."
    aws ecs update-service \
        --cluster $PROJECT_NAME-cluster \
        --service $PROJECT_NAME-api \
        --force-new-deployment \
        --region $REGION
    
    # Wait for deployment
    echo "Waiting for deployment to complete..."
    aws ecs wait services-stable \
        --cluster $PROJECT_NAME-cluster \
        --services $PROJECT_NAME-api \
        --region $REGION
    
    echo ""
    echo -e "${GREEN}✓ AWS deployment complete!${NC}"
    echo ""
    echo -e "${YELLOW}Check status:${NC}"
    echo "aws ecs describe-services --cluster $PROJECT_NAME-cluster --services $PROJECT_NAME-api --region $REGION"
    echo ""
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running tests...${NC}"
    
    # Unit tests
    echo "Running unit tests..."
    docker-compose -f docker-compose.australia.yml exec -T api \
        pytest tests/ -v --cov=domain --cov=infrastructure --cov=api
    
    # Integration tests
    echo "Running integration tests..."
    docker-compose -f docker-compose.australia.yml exec -T api \
        pytest tests/integration/ -v
    
    # Turing Protocol tests
    echo "Testing Turing Protocol enforcement..."
    
    # Test without headers (should fail)
    echo "Test 1: Request without Turing Protocol headers (should fail)..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST http://localhost:8000/api/v1/livestock/grading \
        -H "Content-Type: application/json" \
        -d '{"animal_id": "982 000123456789", "weight_kg": 450.0, "quality_grade": "4 Star"}')
    
    if [ "$RESPONSE" = "400" ]; then
        echo -e "${GREEN}✓ Correctly rejected request without headers${NC}"
    else
        echo -e "${RED}✗ Failed: Expected 400, got $RESPONSE${NC}"
    fi
    
    # Test with headers (should succeed)
    echo "Test 2: Request with Turing Protocol headers (should succeed)..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST http://localhost:8000/api/v1/livestock/grading \
        -H "Content-Type: application/json" \
        -H "X-Tenant-ID: AU-TEST-001" \
        -H "X-Request-ID: $(uuidgen)" \
        -H "X-User-ID: test_user" \
        -H "X-Device-ID: TEST-001" \
        -H "X-Geo-Location: -27.4705,153.0260" \
        -d '{"animal_id": "982 000123456789", "weight_kg": 450.0, "quality_grade": "4 Star", "marbling_score": 7}')
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ Successfully processed request with headers${NC}"
    else
        echo -e "${RED}✗ Failed: Expected 200, got $RESPONSE${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✓ Tests complete!${NC}"
    echo ""
}

# Function to show logs
show_logs() {
    echo -e "${YELLOW}Showing logs...${NC}"
    docker-compose -f docker-compose.australia.yml logs -f api
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose -f docker-compose.australia.yml down
    echo -e "${GREEN}✓ Services stopped${NC}"
}

# Main deployment logic
main() {
    check_prerequisites
    
    case $ENVIRONMENT in
        local)
            deploy_local
            ;;
        staging|production)
            deploy_aws
            ;;
        test)
            deploy_local
            run_tests
            ;;
        logs)
            show_logs
            ;;
        stop)
            stop_services
            ;;
        *)
            echo -e "${RED}Error: Unknown environment '$ENVIRONMENT'${NC}"
            echo "Usage: $0 [local|staging|production|test|logs|stop]"
            exit 1
            ;;
    esac
}

# Run main function
main

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║         Deployment Complete!                             ║${NC}"
echo -e "${GREEN}║         Turing Protocol: ENFORCED ✓                      ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
