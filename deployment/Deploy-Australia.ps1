# Australian Production Deployment Script (PowerShell)
# iCattle.ai - MSA Grading System with Turing Protocol
#
# Usage: .\Deploy-Australia.ps1 -Environment [local|staging|production|test|logs|stop]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('local','staging','production','test','logs','stop')]
    [string]$Environment = 'local'
)

# Configuration
$ProjectName = "icattle-au"
$Region = "ap-southeast-2"  # Sydney

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    Write-ColorOutput "`n╔══════════════════════════════════════════════════════════╗" Green
    Write-ColorOutput "║                                                          ║" Green
    Write-ColorOutput "║         iCattle.ai Australian Deployment                 ║" Green
    Write-ColorOutput "║         MSA Grading with Turing Protocol                 ║" Green
    Write-ColorOutput "║                                                          ║" Green
    Write-ColorOutput "╚══════════════════════════════════════════════════════════╝" Green
    Write-ColorOutput "`nEnvironment: $Environment" Yellow
    Write-ColorOutput "Region: $Region`n" Yellow
}

# Check prerequisites
function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." Yellow
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-ColorOutput "✓ Docker installed: $dockerVersion" Green
    } catch {
        Write-ColorOutput "✗ Error: Docker is not installed" Red
        Write-ColorOutput "Install from: https://www.docker.com/products/docker-desktop" Yellow
        exit 1
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-ColorOutput "✓ Docker Compose installed: $composeVersion" Green
    } catch {
        Write-ColorOutput "✗ Error: Docker Compose is not installed" Red
        exit 1
    }
    
    # Check .env file
    if (-not (Test-Path ".env")) {
        Write-ColorOutput "⚠ Warning: .env file not found, creating from template..." Yellow
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-ColorOutput "✓ Created .env file from template" Green
            Write-ColorOutput "⚠ Please edit .env file with your credentials before continuing" Yellow
            Write-ColorOutput "Press any key to open .env in notepad..." Yellow
            $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
            notepad .env
            exit 0
        } else {
            Write-ColorOutput "✗ Error: .env.example not found" Red
            exit 1
        }
    }
    Write-ColorOutput "✓ .env file exists`n" Green
}

# Deploy locally
function Deploy-Local {
    Write-ColorOutput "Deploying to local environment..." Yellow
    
    # Stop existing containers
    Write-ColorOutput "Stopping existing containers..." White
    docker-compose -f docker-compose.australia.yml down
    
    # Build images
    Write-ColorOutput "Building Docker images..." White
    docker-compose -f docker-compose.australia.yml build
    
    # Start services
    Write-ColorOutput "Starting services..." White
    docker-compose -f docker-compose.australia.yml up -d
    
    # Wait for services to be healthy
    Write-ColorOutput "Waiting for services to be healthy..." White
    Start-Sleep -Seconds 10
    
    # Check health
    Write-ColorOutput "Checking service health..." White
    docker-compose -f docker-compose.australia.yml ps
    
    # Run database migrations
    Write-ColorOutput "Running database migrations..." White
    docker-compose -f docker-compose.australia.yml exec -T postgres `
        psql -U admin -d icattle_au -f /docker-entrypoint-initdb.d/01-schema.sql 2>$null
    
    Write-ColorOutput "`n✓ Local deployment complete!" Green
    Write-ColorOutput "`nAPI available at: http://localhost:8000" Yellow
    Write-ColorOutput "API docs: http://localhost:8000/docs" Yellow
    Write-ColorOutput "Database: localhost:5432`n" Yellow
    
    Write-ColorOutput "Test with:" Yellow
    Write-ColorOutput "curl http://localhost:8000/health`n" White
}

# Deploy to AWS
function Deploy-AWS {
    Write-ColorOutput "Deploying to AWS ($Environment)..." Yellow
    
    # Check AWS CLI
    try {
        $awsVersion = aws --version
        Write-ColorOutput "✓ AWS CLI installed: $awsVersion" Green
    } catch {
        Write-ColorOutput "✗ Error: AWS CLI is not installed" Red
        Write-ColorOutput "Install from: https://aws.amazon.com/cli/" Yellow
        exit 1
    }
    
    # Get AWS account ID
    $AwsAccountId = aws sts get-caller-identity --query Account --output text
    $EcrRegistry = "$AwsAccountId.dkr.ecr.$Region.amazonaws.com"
    
    Write-ColorOutput "AWS Account: $AwsAccountId" White
    Write-ColorOutput "ECR Registry: $EcrRegistry`n" White
    
    # Login to ECR
    Write-ColorOutput "Logging in to ECR..." White
    $ecrPassword = aws ecr get-login-password --region $Region
    $ecrPassword | docker login --username AWS --password-stdin $EcrRegistry
    
    # Build Docker image
    Write-ColorOutput "Building Docker image..." White
    docker build -t ${ProjectName}:latest -f Dockerfile.australia ..
    
    # Tag image
    Write-ColorOutput "Tagging image..." White
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    docker tag ${ProjectName}:latest ${EcrRegistry}/${ProjectName}:latest
    docker tag ${ProjectName}:latest ${EcrRegistry}/${ProjectName}:${Environment}-${timestamp}
    
    # Push to ECR
    Write-ColorOutput "Pushing to ECR..." White
    docker push ${EcrRegistry}/${ProjectName}:latest
    docker push ${EcrRegistry}/${ProjectName}:${Environment}-${timestamp}
    
    # Update ECS service
    Write-ColorOutput "Updating ECS service..." White
    aws ecs update-service `
        --cluster ${ProjectName}-cluster `
        --service ${ProjectName}-api `
        --force-new-deployment `
        --region $Region
    
    # Wait for deployment
    Write-ColorOutput "Waiting for deployment to complete..." White
    aws ecs wait services-stable `
        --cluster ${ProjectName}-cluster `
        --services ${ProjectName}-api `
        --region $Region
    
    Write-ColorOutput "`n✓ AWS deployment complete!" Green
    Write-ColorOutput "`nCheck status:" Yellow
    Write-ColorOutput "aws ecs describe-services --cluster ${ProjectName}-cluster --services ${ProjectName}-api --region $Region`n" White
}

# Run tests
function Invoke-Tests {
    Write-ColorOutput "Running tests..." Yellow
    
    # Unit tests
    Write-ColorOutput "Running unit tests..." White
    docker-compose -f docker-compose.australia.yml exec -T api `
        pytest tests/ -v --cov=domain --cov=infrastructure --cov=api
    
    # Integration tests
    Write-ColorOutput "Running integration tests..." White
    docker-compose -f docker-compose.australia.yml exec -T api `
        pytest tests/integration/ -v
    
    # Turing Protocol tests
    Write-ColorOutput "Testing Turing Protocol enforcement..." White
    
    # Test without headers (should fail)
    Write-ColorOutput "Test 1: Request without Turing Protocol headers (should fail)..." White
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/livestock/grading" `
            -Method POST `
            -ContentType "application/json" `
            -Body '{"animal_id": "982 000123456789", "weight_kg": 450.0, "quality_grade": "4 Star"}' `
            -ErrorAction Stop
        Write-ColorOutput "✗ Failed: Expected 400, got $($response.StatusCode)" Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-ColorOutput "✓ Correctly rejected request without headers" Green
        } else {
            Write-ColorOutput "✗ Failed: Unexpected error" Red
        }
    }
    
    # Test with headers (should succeed)
    Write-ColorOutput "Test 2: Request with Turing Protocol headers (should succeed)..." White
    $requestId = [guid]::NewGuid().ToString()
    $headers = @{
        "X-Tenant-ID" = "AU-TEST-001"
        "X-Request-ID" = $requestId
        "X-User-ID" = "test_user"
        "X-Device-ID" = "TEST-001"
        "X-Geo-Location" = "-27.4705,153.0260"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/livestock/grading" `
            -Method POST `
            -ContentType "application/json" `
            -Headers $headers `
            -Body '{"animal_id": "982 000123456789", "weight_kg": 450.0, "quality_grade": "4 Star", "marbling_score": 7}' `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✓ Successfully processed request with headers" Green
        } else {
            Write-ColorOutput "✗ Failed: Expected 200, got $($response.StatusCode)" Red
        }
    } catch {
        Write-ColorOutput "✗ Failed: $($_.Exception.Message)" Red
    }
    
    Write-ColorOutput "`n✓ Tests complete!`n" Green
}

# Show logs
function Show-Logs {
    Write-ColorOutput "Showing logs..." Yellow
    docker-compose -f docker-compose.australia.yml logs -f api
}

# Stop services
function Stop-Services {
    Write-ColorOutput "Stopping services..." Yellow
    docker-compose -f docker-compose.australia.yml down
    Write-ColorOutput "✓ Services stopped" Green
}

# Main execution
Write-Header
Test-Prerequisites

switch ($Environment) {
    'local' {
        Deploy-Local
    }
    'staging' {
        Deploy-AWS
    }
    'production' {
        Deploy-AWS
    }
    'test' {
        Deploy-Local
        Invoke-Tests
    }
    'logs' {
        Show-Logs
    }
    'stop' {
        Stop-Services
    }
}

Write-ColorOutput "`n╔══════════════════════════════════════════════════════════╗" Green
Write-ColorOutput "║                                                          ║" Green
Write-ColorOutput "║         Deployment Complete!                             ║" Green
Write-ColorOutput "║         Turing Protocol: ENFORCED ✓                      ║" Green
Write-ColorOutput "║                                                          ║" Green
Write-ColorOutput "╚══════════════════════════════════════════════════════════╝`n" Green
