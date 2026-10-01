// =============================================================================
// Jenkinsfile — Frontend (React + Vite → Nginx)  *** Windows Jenkins Agent ***
// Pipeline: npm Install → Vite Build → Docker Image → Push ECR → Deploy EC2
// =============================================================================

pipeline {

    agent any

    environment {
        AWS_REGION      = 'us-east-1'
        AWS_ACCOUNT_ID  = '888577028066'
        ECR_REPO        = 'fanverseeeee'
        IMAGE_TAG       = 'frontend-latest'
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        FULL_IMAGE      = "${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
        EC2_USER        = 'ubuntu'
        EC2_HOST        = 'ec2-34-227-7-122.compute-1.amazonaws.com'
        CONTAINER_NAME  = 'fanverse-frontend'
        DOCKER_NETWORK  = 'fanverse-network'
        HOST_PORT       = '3000'
        CONTAINER_PORT  = '80'
        BACKEND_UPSTREAM = 'backend:8085'
    }

    stages {

        // =====================================================================
        // STAGE 1 — Install npm Dependencies
        // =====================================================================
        stage('Install Dependencies') {
            steps {
                dir('frontend') {
                    bat '''
                        echo ========== Installing npm dependencies ==========
                        node --version
                        npm  --version
                        npm ci --silent
                    '''
                }
            }
        }

        // =====================================================================
        // STAGE 2 — Build with Vite (React production bundle)
        // =====================================================================
        stage('Build (Vite)') {
            steps {
                dir('frontend') {
                    bat '''
                        echo ========== Building React app with Vite ==========
                        npm run build
                        echo --- dist contents ---
                        dir dist
                    '''
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true
                }
            }
        }

        // =====================================================================
        // STAGE 3 — Build Docker Image
        // =====================================================================
        stage('Build Docker Image') {
            steps {
                dir('frontend') {
                    bat "docker build -t ${FULL_IMAGE} ."
                }
            }
        }

        // =====================================================================
        // STAGE 4 — Push Docker Image to ECR
        // =====================================================================
        stage('Push to ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    bat """
                        set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID%
                        set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY%
                        set AWS_DEFAULT_REGION=${AWS_REGION}
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        docker push ${FULL_IMAGE}
                    """
                }
            }
        }

        // =====================================================================
        // STAGE 5 — Deploy to EC2
        // Write a bash script locally, SCP it to EC2, then SSH-execute it
        // =====================================================================
        stage('Deploy to EC2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'EC2_PEM_KEY', keyFileVariable: 'PEM_FILE'),
                    string(credentialsId: 'AWS_ACCESS_KEY_ID',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {

                    // --- Write remote deploy script (Groovy fills in non-secret values) ---
                    writeFile file: 'deploy_frontend.sh', text: """#!/bin/bash
set -e

echo "=== Logging into ECR ==="
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo "=== Pulling latest image ==="
docker pull ${FULL_IMAGE}

echo "=== Stopping old container (if running) ==="
docker stop  ${CONTAINER_NAME} 2>/dev/null || true
docker rm -f ${CONTAINER_NAME} 2>/dev/null || true

echo "=== Pruning old images ==="
docker image prune -f || true

echo "=== Ensuring Docker network exists ==="
docker network inspect ${DOCKER_NETWORK} >/dev/null 2>&1 || docker network create ${DOCKER_NETWORK}

echo "=== Starting new container ==="
docker run -d \\
    --name ${CONTAINER_NAME} \\
    --network ${DOCKER_NETWORK} \\
    --restart unless-stopped \\
    -p ${HOST_PORT}:${CONTAINER_PORT} \\
    ${FULL_IMAGE}

echo "=== Patching nginx upstream to ${BACKEND_UPSTREAM} ==="
docker exec ${CONTAINER_NAME} sh -c "sed -i 's|backend:8080|${BACKEND_UPSTREAM}|g' /etc/nginx/conf.d/default.conf"

echo "=== Validating nginx config ==="
docker exec ${CONTAINER_NAME} nginx -t

echo "=== Reloading nginx ==="
docker exec ${CONTAINER_NAME} nginx -s reload

echo "=== Running containers ==="
docker ps --filter name=${CONTAINER_NAME}

echo "=== Public IP ==="
curl -s http://checkip.amazonaws.com
echo ""
echo "=== Frontend deployment complete ==="
"""

                    // --- SCP script to EC2, pass secrets via SSH env, execute ---
                    bat """
                        scp -o StrictHostKeyChecking=no -i "%PEM_FILE%" deploy_frontend.sh ${EC2_USER}@${EC2_HOST}:/tmp/deploy_frontend.sh
                        ssh -o StrictHostKeyChecking=no -i "%PEM_FILE%" ${EC2_USER}@${EC2_HOST} "export AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID% && export AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY% && chmod +x /tmp/deploy_frontend.sh && bash /tmp/deploy_frontend.sh"
                    """

                    // --- Cleanup temp script ---
                    bat 'if exist deploy_frontend.sh del deploy_frontend.sh'
                }
            }
        }

    } // end stages

    post {
        success {
            echo "SUCCESS: Frontend deployed — ${FULL_IMAGE}"
        }
        failure {
            echo "FAILED: Frontend pipeline failed. Check stage logs above."
        }
        always {
            // Windows-safe prune (|| exit /b 0 suppresses non-zero exit)
            bat 'docker image prune -f || exit /b 0'
        }
    }

} // end pipeline
