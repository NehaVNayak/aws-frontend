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

        AWS_REGION       = 'us-east-1'
        AWS_ACCOUNT_ID   = '888577028066'

        ECR_REPO         = 'fanverseeeee'
        IMAGE_TAG        = 'frontend-latest'

        ECR_REGISTRY     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        FULL_IMAGE       = "${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"

        EC2_USER         = 'ubuntu'
        EC2_HOST         = 'ec2-34-227-7-122.compute-1.amazonaws.com'

        CONTAINER_NAME   = 'fanverse-frontend'
        DOCKER_NETWORK   = 'fanverse-network'

        HOST_PORT        = '3000'
        CONTAINER_PORT   = '80'

        BACKEND_UPSTREAM = 'backend:8085'
    }

    stages {

        // =====================================================================
        // STAGE 1 — Install npm Dependencies
        // =====================================================================
        stage('Install Dependencies') {

            steps {

                bat '''
                    echo ========================================
                    echo Installing npm dependencies
                    echo ========================================

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
                    echo Installing dependencies:
                    npm ci

                    echo.
                    echo Checking Vite installation:
                    npx vite --version

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
                    echo Building React application
                    echo ========================================

                    npm run build

                    echo.
                    echo ========================================
                    echo DIST CONTENTS
                    echo ========================================

                    dir dist

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
                    echo Building frontend Docker image
                    echo ========================================

                    docker build -t ${FULL_IMAGE} .

                    echo.
                    echo Docker image:
                    echo ${FULL_IMAGE}

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
                        echo Logging into AWS ECR
                        echo ========================================

                        set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID%
                        set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY%
                        set AWS_DEFAULT_REGION=${AWS_REGION}

                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}


                        echo ========================================
                        echo Pushing frontend image
                        echo ========================================

                        docker push ${FULL_IMAGE}


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
                    // Create remote deployment script
                    // =========================================================

                    writeFile(
                        file: 'deploy_frontend.sh',
                        text: """#!/bin/bash

set -e


echo "========================================"
echo "Logging into AWS ECR"
echo "========================================"

aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}


echo "========================================"
echo "Pulling latest frontend image"
echo "========================================"

docker pull ${FULL_IMAGE}


echo "========================================"
echo "Stopping old frontend container"
echo "========================================"

docker stop ${CONTAINER_NAME} 2>/dev/null || true

docker rm -f ${CONTAINER_NAME} 2>/dev/null || true


echo "========================================"
echo "Cleaning old Docker images"
echo "========================================"

docker image prune -f || true


echo "========================================"
echo "Creating Docker network if required"
echo "========================================"

docker network inspect ${DOCKER_NETWORK} >/dev/null 2>&1 || docker network create ${DOCKER_NETWORK}


echo "========================================"
echo "Starting frontend container"
echo "========================================"

docker run -d \\
    --name ${CONTAINER_NAME} \\
    --network ${DOCKER_NETWORK} \\
    --restart unless-stopped \\
    -p ${HOST_PORT}:${CONTAINER_PORT} \\
    ${FULL_IMAGE}


echo "========================================"
echo "Patching nginx backend upstream"
echo "========================================"

docker exec ${CONTAINER_NAME} sh -c "sed -i 's|backend:8080|${BACKEND_UPSTREAM}|g' /etc/nginx/conf.d/default.conf"


echo "========================================"
echo "Testing nginx configuration"
echo "========================================"

docker exec ${CONTAINER_NAME} nginx -t


echo "========================================"
echo "Reloading nginx"
echo "========================================"

docker exec ${CONTAINER_NAME} nginx -s reload


echo "========================================"
echo "Running frontend container"
echo "========================================"

docker ps --filter name=${CONTAINER_NAME}


echo "========================================"
echo "Frontend deployment complete"
echo "========================================"

"""


                    // =========================================================
                    // Copy deployment script to EC2
                    // =========================================================

                    bat """

                        echo ========================================
                        echo Copying deployment script to EC2
                        echo ========================================

                        scp -o StrictHostKeyChecking=no -i "%PEM_FILE%" deploy_frontend.sh ${EC2_USER}@${EC2_HOST}:/tmp/deploy_frontend.sh

                    """


                    // =========================================================
                    // Execute deployment script on EC2
                    // =========================================================

                    bat """

                        echo ========================================
                        echo Deploying frontend on EC2
                        echo ========================================

                        ssh -o StrictHostKeyChecking=no -i "%PEM_FILE%" ${EC2_USER}@${EC2_HOST} "export AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID% && export AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY% && chmod +x /tmp/deploy_frontend.sh && bash /tmp/deploy_frontend.sh"

                    """


                    // =========================================================
                    // Cleanup temporary deployment script
                    // =========================================================

                    bat """

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
Frontend deployed successfully
Docker Image: ${FULL_IMAGE}
========================================
"""
        }

        failure {

            echo """
========================================
FAILED
Frontend pipeline failed.
Check the stage logs above.
========================================
"""
        }

        always {

            bat '''
                docker image prune -f || exit /b 0
            '''
        }
    }
}
