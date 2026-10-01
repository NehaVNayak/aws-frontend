// =============================================================================
// Jenkinsfile — Frontend (React + Vite → Nginx)
// Pipeline: npm Install → Webpack/Vite Build → Docker Image → Push to ECR → Deploy EC2
// =============================================================================

pipeline {

    agent any

    // -------------------------------------------------------------------------
    // Pipeline-level environment variables
    // -------------------------------------------------------------------------
    environment {
        // AWS / ECR
        AWS_REGION          = 'us-east-1'
        AWS_ACCOUNT_ID      = '888577028066'
        ECR_REPO            = 'fanverseeeee'
        IMAGE_TAG           = 'frontend-latest'
        ECR_REGISTRY        = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        FULL_IMAGE          = "${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"

        // EC2
        EC2_USER            = 'ubuntu'
        EC2_HOST            = 'ec2-34-227-7-122.compute-1.amazonaws.com'
        CONTAINER_NAME      = 'fanverse-frontend'
        DOCKER_NETWORK      = 'fanverse-network'
        HOST_PORT           = '3000'
        CONTAINER_PORT      = '80'

        // nginx proxy target — must match the backend container name & internal port
        BACKEND_UPSTREAM    = 'backend:8085'
    }

    stages {

        // =====================================================================
        // STAGE 1 — Install Dependencies (npm ci for reproducible builds)
        // =====================================================================
        stage('Install Dependencies') {
            steps {
                dir('frontend') {
                    sh '''
                        echo "========== Installing npm dependencies =========="
                        node --version
                        npm  --version
                        npm ci --silent
                    '''
                }
            }
        }

        // =====================================================================
        // STAGE 2 — Build (Vite / Webpack bundle)
        // =====================================================================
        stage('Build (Vite)') {
            steps {
                dir('frontend') {
                    sh '''
                        echo "========== Building React app with Vite =========="
                        npm run build
                        echo "--- dist/ contents ---"
                        ls -lh dist/
                    '''
                }
            }
            post {
                success {
                    // Archive the dist folder as a zip for traceability
                    sh 'cd frontend && zip -r ../frontend-dist.zip dist/'
                    archiveArtifacts artifacts: 'frontend-dist.zip', fingerprint: true
                }
            }
        }

        // =====================================================================
        // STAGE 3 — Build Docker Image
        // =====================================================================
        stage('Build Docker Image') {
            steps {
                dir('frontend') {
                    sh """
                        echo "========== Building Docker image =========="
                        docker build -t ${FULL_IMAGE} .
                        docker images | grep ${ECR_REPO}
                    """
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
                    sh """
                        echo "========== Logging into ECR =========="
                        export AWS_ACCESS_KEY_ID=\$AWS_ACCESS_KEY_ID
                        export AWS_SECRET_ACCESS_KEY=\$AWS_SECRET_ACCESS_KEY
                        export AWS_DEFAULT_REGION=${AWS_REGION}

                        aws ecr get-login-password --region ${AWS_REGION} | \\
                            docker login --username AWS --password-stdin ${ECR_REGISTRY}

                        echo "========== Pushing image to ECR =========="
                        docker push ${FULL_IMAGE}

                        echo "========== Push complete =========="
                    """
                }
            }
        }

        // =====================================================================
        // STAGE 5 — Deploy to EC2
        // SSH in, pull latest, stop old, run new, patch nginx upstream if needed
        // =====================================================================
        stage('Deploy to EC2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId  : 'EC2_PEM_KEY',
                        keyFileVariable: 'PEM_FILE'
                    ),
                    string(credentialsId: 'AWS_ACCESS_KEY_ID',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        echo "========== Deploying Frontend to EC2 =========="

                        ssh -o StrictHostKeyChecking=no -i "\$PEM_FILE" ${EC2_USER}@${EC2_HOST} "
                            # Authenticate Docker with ECR
                            export AWS_ACCESS_KEY_ID=\$AWS_ACCESS_KEY_ID
                            export AWS_SECRET_ACCESS_KEY=\$AWS_SECRET_ACCESS_KEY
                            export AWS_DEFAULT_REGION=${AWS_REGION}

                            aws ecr get-login-password --region ${AWS_REGION} | \\
                                docker login --username AWS --password-stdin ${ECR_REGISTRY}

                            # Pull latest image
                            echo 'Pulling ${FULL_IMAGE} ...'
                            docker pull ${FULL_IMAGE}

                            # Stop & remove existing container if it exists
                            if docker ps -a --format '{{.Names}}' | grep -q '^${CONTAINER_NAME}\$'; then
                                echo 'Stopping existing container: ${CONTAINER_NAME}'
                                docker stop  ${CONTAINER_NAME} || true
                                docker rm -f ${CONTAINER_NAME} || true
                            fi

                            # Clean up old dangling images
                            docker image prune -f || true

                            # Create Docker network if not present
                            docker network inspect ${DOCKER_NETWORK} > /dev/null 2>&1 || \\
                                docker network create ${DOCKER_NETWORK}

                            # Run the new container
                            docker run -d \\
                                --name ${CONTAINER_NAME} \\
                                --network ${DOCKER_NETWORK} \\
                                --restart unless-stopped \\
                                -p ${HOST_PORT}:${CONTAINER_PORT} \\
                                ${FULL_IMAGE}

                            # Patch nginx upstream to point at backend:8085 (not default :8080)
                            echo 'Patching nginx upstream ...'
                            docker exec ${CONTAINER_NAME} sh -c \\
                                \"sed -i 's|backend:8080|${BACKEND_UPSTREAM}|g' /etc/nginx/conf.d/default.conf\"

                            # Verify nginx config and reload
                            docker exec ${CONTAINER_NAME} nginx -t
                            docker exec ${CONTAINER_NAME} nginx -s reload

                            echo '--- Running containers ---'
                            docker ps --filter name=${CONTAINER_NAME}

                            # Print the public IP for convenience
                            echo 'Public IP:'
                            curl -s http://checkip.amazonaws.com
                        "

                        echo "========== Deployment complete =========="
                    """
                }
            }
        }

    } // end stages

    // -------------------------------------------------------------------------
    // Post-build actions
    // -------------------------------------------------------------------------
    post {
        success {
            echo "SUCCESS: Frontend deployed! Image: ${FULL_IMAGE}"
        }
        failure {
            echo "FAILED: Frontend pipeline failed. Check the stage logs above."
        }
        always {
            sh 'docker image prune -f || true'
        }
    }

} // end pipeline
