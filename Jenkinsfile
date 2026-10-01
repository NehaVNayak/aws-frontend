
// =============================================================================
// Jenkinsfile — Frontend (React + Vite → Nginx)
// Windows Jenkins Agent
//
// Pipeline:
// npm Install → Vite Build → Docker Image → Push ECR → Deploy EC2
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
        // STAGE 1 — Install npm Dependencies
        // =====================================================================

        stage('Install Dependencies') {

            steps {

                bat '''
                    echo ========================================
                    echo INSTALLING NPM DEPENDENCIES
                    echo ========================================

                    echo.
                    echo Current directory:
                    cd

                    echo.
                    echo Files in workspace:
                    dir

                    echo.
                    echo Node version:
                    node --version

                    echo.
                    echo NPM version:
                    npm --version

                    echo.
                    echo ========================================
                    echo Running npm ci
                    echo ========================================

                    call npm ci

                    echo.
                    echo ========================================
                    echo Checking node_modules
                    echo ========================================

                    if not exist node_modules (
                        echo ERROR: node_modules directory was not created.
                        exit /b 1
                    )

                    echo node_modules successfully created.

                    echo.
                    echo ========================================
                    echo Checking Vite installation
                    echo ========================================

                    call npx vite --version

                    echo.
                    echo ========================================
                    echo NPM INSTALL COMPLETE
                    echo ========================================
                '''
            }
        }


        // =====================================================================
        // STAGE 2 — Build React Application with Vite
        // =====================================================================

        stage('Build (Vite)') {

            steps {

                bat '''
                    echo ========================================
                    echo BUILDING REACT APPLICATION
                    echo ========================================

                    echo.
                    echo Checking Vite:
                    call npx vite --version

                    echo.
                    echo Running Vite build:
                    call npm run build

                    if not exist dist (
                        echo ERROR: dist directory was not created.
                        exit /b 1
                    )

                    echo.
                    echo ========================================
                    echo DIST CONTENTS
                    echo ========================================

                    dir dist

                    echo.
                    echo ========================================
                    echo VITE BUILD COMPLETE
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
        // STAGE 3 — Build Docker Image
        // =====================================================================

        stage('Build Docker Image') {

            steps {

                bat """
                    echo ========================================
                    echo BUILDING FRONTEND DOCKER IMAGE
                    echo ========================================

                    echo.
                    echo Docker version:
                    docker --version

                    echo.
                    echo Image:
                    echo ${FULL_IMAGE}

                    echo.
                    echo ========================================
                    echo Running Docker Build
                    echo ========================================

                    docker build -t ${FULL_IMAGE} .

                    if errorlevel 1 (
                        echo ERROR: Docker build failed.
                        exit /b 1
                    )

                    echo.
                    echo ========================================
                    echo DOCKER BUILD COMPLETE
                    echo ========================================
                """
            }
        }


        // =====================================================================
        // STAGE 4 — Push Docker Image to ECR
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

                        echo ========================================
                        echo AWS CONFIGURATION
                        echo ========================================

                        set AWS_DEFAULT_REGION=${AWS_REGION}

                        echo AWS Region:
                        echo ${AWS_REGION}

                        echo.
                        echo ECR Registry:
                        echo ${ECR_REGISTRY}

                        echo.
                        echo ========================================
                        echo LOGGING INTO AWS ECR
                        echo ========================================

                        aws --version

                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

                        if errorlevel 1 (
                            echo ERROR: ECR login failed.
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
                            echo ERROR: Docker push failed.
                            exit /b 1
                        )

                        echo.
                        echo ========================================
                        echo ECR PUSH COMPLETE
                        echo ========================================

                    """
                }
            }
        }


        // =====================================================================
        // STAGE 5 — Deploy Frontend to EC2
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
                    // CREATE REMOTE DEPLOYMENT SCRIPT
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
# CHECK AWS
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
# PULL LATEST FRONTEND IMAGE
# =====================================================================

echo "========================================"
echo "Pulling latest frontend image"
echo "========================================"

docker pull ${FULL_IMAGE}


# =====================================================================
# STOP OLD CONTAINER
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
echo "Creating Docker network if required"
echo "========================================"

docker network inspect ${DOCKER_NETWORK} >/dev/null 2>&1 || docker network create ${DOCKER_NETWORK}


# =====================================================================
# RUN FRONTEND CONTAINER
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
# CHECK NGINX CONFIGURATION
# =====================================================================

echo "========================================"
echo "Testing nginx configuration"
echo "========================================"

docker exec ${CONTAINER_NAME} nginx -t


# =====================================================================
# PATCH BACKEND UPSTREAM
# =====================================================================

echo "========================================"
echo "Patching nginx backend upstream"
echo "========================================"

docker exec ${CONTAINER_NAME} sh -c "sed -i 's|backend:8080|${BACKEND_UPSTREAM}|g' /etc/nginx/conf.d/default.conf"


# =====================================================================
# TEST NGINX AGAIN
# =====================================================================

echo "========================================"
echo "Testing nginx configuration again"
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
# SHOW CONTAINER LOGS
# =====================================================================

echo "========================================"
echo "Frontend container logs"
echo "========================================"

docker logs --tail 50 ${CONTAINER_NAME}


# =====================================================================
# CLEAN OLD IMAGES
# =====================================================================

echo "========================================"
echo "Cleaning unused Docker images"
echo "========================================"

docker image prune -f || true


# =====================================================================
# FINAL STATUS
# =====================================================================

echo "========================================"
echo "Frontend deployment complete"
echo "========================================"

docker ps --filter name=${CONTAINER_NAME}

echo "========================================"
echo "FRONTEND DEPLOYMENT SUCCESSFUL"
echo "========================================"

"""
                    )


                    // =========================================================
                    // COPY DEPLOYMENT SCRIPT TO EC2
                    // =========================================================

                    bat """

                        echo ========================================
                        echo COPYING DEPLOYMENT SCRIPT TO EC2
                        echo ========================================

                        scp -o StrictHostKeyChecking=no -i "%PEM_FILE%" deploy_frontend.sh ${EC2_USER}@${EC2_HOST}:/tmp/deploy_frontend.sh

                        if errorlevel 1 (
                            echo ERROR: Failed to copy deployment script.
                            exit /b 1
                        )

                    """


                    // =========================================================
                    // EXECUTE DEPLOYMENT SCRIPT ON EC2
                    // =========================================================

                    bat """

                        echo ========================================
                        echo DEPLOYING FRONTEND ON EC2
                        echo ========================================

                        ssh -o StrictHostKeyChecking=no -i "%PEM_FILE%" ${EC2_USER}@${EC2_HOST} "chmod +x /tmp/deploy_frontend.sh && AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID% AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY% AWS_DEFAULT_REGION=${AWS_REGION} bash /tmp/deploy_frontend.sh"

                        if errorlevel 1 (
                            echo ERROR: EC2 deployment failed.
                            exit /b 1
                        )

                    """


                    // =========================================================
                    // CLEANUP TEMPORARY SCRIPT
                    // =========================================================

                    bat """

                        echo ========================================
                        echo CLEANING UP
                        echo ========================================

                        if exist deploy_frontend.sh del deploy_frontend.sh

                    """
                }
            }
        }
    }


    // =========================================================================
    // POST ACTIONS
    // =========================================================================

    post {

        success {

            echo """
========================================
SUCCESS
========================================

Frontend deployed successfully.

Docker Image:
${FULL_IMAGE}

EC2:
${EC2_HOST}

Frontend Port:
${HOST_PORT}

========================================
"""
        }


        failure {

            echo """
========================================
FAILED
========================================

Frontend pipeline failed.

Please check the stage logs above.

========================================
"""
        }


        always {

            bat '''
                echo ========================================
                echo CLEANING JENKINS DOCKER CACHE
                echo ========================================

                docker image prune -f || exit /b 0
            '''
        }
    }
}
