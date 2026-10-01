
// =============================================================================
// Jenkinsfile — Frontend (React + Vite → Nginx)
// Windows Jenkins Agent
//
// Pipeline:
// Checkout
//     ↓
// Debug Workspace
//     ↓
// Install npm Dependencies
//     ↓
// Verify Vite
//     ↓
// Vite Build
//     ↓
// Docker Build
//     ↓
// Push to ECR
//     ↓
// Deploy to EC2
// =============================================================================

pipeline {

    agent any

    environment {

        // =====================================================================
        // AWS CONFIGURATION
        // =====================================================================

        AWS_REGION       = 'us-east-1'
        AWS_ACCOUNT_ID   = '888577028066'

        ECR_REPO         = 'fanverseeeee'
        IMAGE_TAG        = 'frontend-latest'

        ECR_REGISTRY     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        FULL_IMAGE       = "${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"


        // =====================================================================
        // EC2 CONFIGURATION
        // =====================================================================

        EC2_USER         = 'ubuntu'
        EC2_HOST         = 'ec2-34-227-7-122.compute-1.amazonaws.com'


        // =====================================================================
        // DOCKER CONFIGURATION
        // =====================================================================

        CONTAINER_NAME   = 'fanverse-frontend'
        DOCKER_NETWORK   = 'fanverse-network'

        HOST_PORT        = '3000'
        CONTAINER_PORT   = '80'


        // =====================================================================
        // BACKEND CONFIGURATION
        // =====================================================================

        BACKEND_UPSTREAM = 'backend:8085'
    }


    // =========================================================================
    // STAGES
    // =========================================================================

    stages {


        // =====================================================================
        // STAGE 1 — DEBUG WORKSPACE
        // =====================================================================

        stage('Debug Workspace') {

            steps {

                bat '''
                    @echo on

                    echo ========================================
                    echo DEBUG WORKSPACE
                    echo ========================================

                    echo.
                    echo Current directory:
                    cd

                    echo.
                    echo Workspace contents:
                    dir

                    echo.
                    echo ========================================
                    echo CHECKING PACKAGE.JSON
                    echo ========================================

                    if not exist package.json (
                        echo ERROR: package.json not found
                        exit /b 1
                    )

                    echo package.json found.

                    echo.
                    echo ========================================
                    echo CHECKING PACKAGE-LOCK.JSON
                    echo ========================================

                    if not exist package-lock.json (
                        echo ERROR: package-lock.json not found
                        exit /b 1
                    )

                    echo package-lock.json found.

                    echo.
                    echo ========================================
                    echo NODE VERSION
                    echo ========================================

                    node --version

                    echo.
                    echo ========================================
                    echo NPM VERSION
                    echo ========================================

                    npm --version

                    echo.
                    echo ========================================
                    echo DEBUG COMPLETE
                    echo ========================================
                '''
            }
        }


        // =====================================================================
        // STAGE 2 — INSTALL NPM DEPENDENCIES
        // =====================================================================

        stage('Install Dependencies') {

            steps {

                bat '''
                    @echo on

                    echo ========================================
                    echo INSTALLING NPM DEPENDENCIES
                    echo ========================================

                    echo.
                    echo Current directory:
                    cd

                    echo.
                    echo Node version:
                    node --version

                    echo.
                    echo NPM version:
                    npm --version

                    echo.
                    echo ========================================
                    echo RUNNING NPM CI NOW
                    echo ========================================

                    npm ci

                    echo.
                    echo npm ci completed.
                    echo ERRORLEVEL:
                    echo %ERRORLEVEL%

                    if errorlevel 1 (
                        echo.
                        echo ========================================
                        echo ERROR: NPM CI FAILED
                        echo ========================================
                        exit /b 1
                    )

                    echo.
                    echo ========================================
                    echo NPM CI SUCCESSFUL
                    echo ========================================


                    echo.
                    echo ========================================
                    echo CHECKING NODE_MODULES
                    echo ========================================

                    if not exist "node_modules" (
                        echo ERROR: node_modules directory was NOT created.
                        exit /b 1
                    )

                    echo SUCCESS: node_modules directory exists.


                    echo.
                    echo ========================================
                    echo CHECKING VITE EXECUTABLE
                    echo ========================================

                    if not exist "node_modules\\.bin\\vite.cmd" (
                        echo ERROR: Vite executable was NOT found.
                        echo.
                        echo Contents of node_modules\\.bin:
                        dir "node_modules\\.bin"
                        exit /b 1
                    )

                    echo SUCCESS: Vite executable exists.


                    echo.
                    echo ========================================
                    echo CHECKING VITE VERSION
                    echo ========================================

                    call "node_modules\\.bin\\vite.cmd" --version

                    if errorlevel 1 (
                        echo ERROR: Vite could not be executed.
                        exit /b 1
                    )


                    echo.
                    echo ========================================
                    echo DEPENDENCY INSTALLATION COMPLETE
                    echo ========================================
                '''
            }
        }


        // =====================================================================
        // STAGE 3 — BUILD REACT APPLICATION
        // =====================================================================

        stage('Build (Vite)') {

            steps {

                bat '''
                    @echo on

                    echo ========================================
                    echo BUILDING REACT APPLICATION
                    echo ========================================

                    echo.
                    echo Checking node_modules...

                    if not exist "node_modules" (
                        echo ERROR: node_modules directory does not exist.
                        exit /b 1
                    )

                    echo node_modules exists.


                    echo.
                    echo Checking Vite...

                    if not exist "node_modules\\.bin\\vite.cmd" (
                        echo ERROR: Vite executable does not exist.
                        exit /b 1
                    )

                    echo Vite executable exists.


                    echo.
                    echo Vite version:

                    call "node_modules\\.bin\\vite.cmd" --version

                    if errorlevel 1 (
                        echo ERROR: Vite execution failed.
                        exit /b 1
                    )


                    echo.
                    echo ========================================
                    echo RUNNING NPM RUN BUILD
                    echo ========================================

                    call npm run build

                    if errorlevel 1 (
                        echo.
                        echo ========================================
                        echo ERROR: NPM BUILD FAILED
                        echo ========================================
                        exit /b 1
                    )


                    echo.
                    echo ========================================
                    echo CHECKING DIST DIRECTORY
                    echo ========================================

                    if not exist "dist" (
                        echo ERROR: dist directory was NOT created.
                        exit /b 1
                    )

                    echo SUCCESS: dist directory exists.


                    echo.
                    echo ========================================
                    echo DIST CONTENTS
                    echo ========================================

                    dir dist


                    echo.
                    echo ========================================
                    echo VITE BUILD SUCCESSFUL
                    echo ========================================
                '''
            }

            post {

                success {

                    archiveArtifacts(
                        artifacts: 'dist/**',
                        fingerprint: true
                    )
                }
            }
        }


        // =====================================================================
        // STAGE 4 — BUILD DOCKER IMAGE
        // =====================================================================

        stage('Build Docker Image') {

            steps {

                bat """
                    @echo on

                    echo ========================================
                    echo BUILDING FRONTEND DOCKER IMAGE
                    echo ========================================

                    echo.
                    echo Docker version:
                    docker --version

                    echo.
                    echo Docker image:
                    echo ${FULL_IMAGE}


                    echo.
                    echo ========================================
                    echo RUNNING DOCKER BUILD
                    echo ========================================

                    docker build -t ${FULL_IMAGE} .

                    if errorlevel 1 (
                        echo.
                        echo ========================================
                        echo ERROR: DOCKER BUILD FAILED
                        echo ========================================
                        exit /b 1
                    )


                    echo.
                    echo ========================================
                    echo DOCKER IMAGE CREATED
                    echo ========================================

                    docker images ${ECR_REGISTRY}/${ECR_REPO}


                    echo.
                    echo ========================================
                    echo DOCKER BUILD SUCCESSFUL
                    echo ========================================
                """
            }
        }


        // =====================================================================
        // STAGE 5 — PUSH IMAGE TO ECR
        // =====================================================================

        stage('Push to ECR') {

            steps {

                withCredentials([

                    string(
                        credentialsId: 'AWS_ACCESS_KEY_ID',
                        variable: 'AWS_ACCESS_KEY_ID'
                    ),

                    string(
                        credentialsId: 'AWS_SECRET_ACCESS_KEY',
                        variable: 'AWS_SECRET_ACCESS_KEY'
                    )

                ]) {

                    bat """

                        @echo on

                        echo ========================================
                        echo AWS ECR LOGIN
                        echo ========================================

                        set AWS_DEFAULT_REGION=${AWS_REGION}

                        echo AWS Region:
                        echo ${AWS_REGION}

                        echo.
                        echo ECR Registry:
                        echo ${ECR_REGISTRY}


                        echo.
                        echo ========================================
                        echo CHECKING AWS CLI
                        echo ========================================

                        aws --version

                        if errorlevel 1 (
                            echo ERROR: AWS CLI is not available.
                            exit /b 1
                        )


                        echo.
                        echo ========================================
                        echo LOGGING INTO ECR
                        echo ========================================

                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

                        if errorlevel 1 (
                            echo ERROR: ECR LOGIN FAILED.
                            exit /b 1
                        )


                        echo.
                        echo ========================================
                        echo ECR LOGIN SUCCESSFUL
                        echo ========================================


                        echo.
                        echo ========================================
                        echo PUSHING FRONTEND IMAGE
                        echo ========================================

                        echo Image:
                        echo ${FULL_IMAGE}

                        docker push ${FULL_IMAGE}

                        if errorlevel 1 (
                            echo ERROR: DOCKER PUSH FAILED.
                            exit /b 1
                        )


                        echo.
                        echo ========================================
                        echo ECR PUSH SUCCESSFUL
                        echo ========================================
                    """
                }
            }
        }


        // =====================================================================
        // STAGE 6 — DEPLOY FRONTEND TO EC2
        // =====================================================================

        stage('Deploy to EC2') {

            steps {

                withCredentials([

                    sshUserPrivateKey(
                        credentialsId: 'EC2_PEM_KEY',
                        keyFileVariable: 'PEM_FILE'
                    ),

                    string(
                        credentialsId: 'AWS_ACCESS_KEY_ID',
                        variable: 'AWS_ACCESS_KEY_ID'
                    ),

                    string(
                        credentialsId: 'AWS_SECRET_ACCESS_KEY',
                        variable: 'AWS_SECRET_ACCESS_KEY'
                    )

                ]) {


                    // =========================================================
                    // CREATE DEPLOYMENT SCRIPT
                    // =========================================================

                    writeFile(
                        file: 'deploy_frontend.sh',
                        text: """#!/bin/bash

set -e


echo "========================================"
echo "FRONTEND DEPLOYMENT STARTED"
echo "========================================"


# =====================================================================
# AWS CONFIGURATION
# =====================================================================

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="${AWS_REGION}"


# =====================================================================
# CHECK AWS CLI
# =====================================================================

echo "========================================"
echo "Checking AWS CLI"
echo "========================================"

aws --version


# =====================================================================
# LOGIN TO ECR
# =====================================================================

echo "========================================"
echo "Logging into AWS ECR"
echo "========================================"

aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}


# =====================================================================
# PULL FRONTEND IMAGE
# =====================================================================

echo "========================================"
echo "Pulling frontend image"
echo "========================================"

docker pull ${FULL_IMAGE}


# =====================================================================
# STOP OLD FRONTEND CONTAINER
# =====================================================================

echo "========================================"
echo "Stopping old frontend container"
echo "========================================"

docker stop ${CONTAINER_NAME} 2>/dev/null || true

docker rm -f ${CONTAINER_NAME} 2>/dev/null || true


# =====================================================================
# CREATE DOCKER NETWORK
# =====================================================================

echo "========================================"
echo "Checking Docker network"
echo "========================================"

docker network inspect ${DOCKER_NETWORK} >/dev/null 2>&1 || docker network create ${DOCKER_NETWORK}


# =====================================================================
# START FRONTEND CONTAINER
# =====================================================================

echo "========================================"
echo "Starting frontend container"
echo "========================================"

docker run -d \\
    --name ${CONTAINER_NAME} \\
    --network ${DOCKER_NETWORK} \\
    --restart unless-stopped \\
    -p ${HOST_PORT}:${CONTAINER_PORT} \\
    ${FULL_IMAGE}


# =====================================================================
# WAIT FOR CONTAINER
# =====================================================================

echo "========================================"
echo "Waiting for frontend container"
echo "========================================"

sleep 5


# =====================================================================
# CHECK CONTAINER
# =====================================================================

echo "========================================"
echo "Checking frontend container"
echo "========================================"

docker ps --filter name=${CONTAINER_NAME}


# =====================================================================
# PATCH NGINX BACKEND UPSTREAM
# =====================================================================

echo "========================================"
echo "Patching nginx backend upstream"
echo "========================================"

docker exec ${CONTAINER_NAME} sh -c "sed -i 's|backend:8080|${BACKEND_UPSTREAM}|g' /etc/nginx/conf.d/default.conf"


# =====================================================================
# TEST NGINX
# =====================================================================

echo "========================================"
echo "Testing nginx configuration"
echo "========================================"

docker exec ${CONTAINER_NAME} nginx -t


# =====================================================================
# RELOAD NGINX
# =====================================================================

echo "========================================"
echo "Reloading nginx"
echo "========================================"

docker exec ${CONTAINER_NAME} nginx -s reload


# =====================================================================
# SHOW LOGS
# =====================================================================

echo "========================================"
echo "Frontend container logs"
echo "========================================"

docker logs --tail 50 ${CONTAINER_NAME}


# =====================================================================
# CLEAN UNUSED IMAGES
# =====================================================================

echo "========================================"
echo "Cleaning unused Docker images"
echo "========================================"

docker image prune -f || true


# =====================================================================
# FINAL STATUS
# =================================================================
