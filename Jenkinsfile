pipeline {
    agent any
    environment {
        TARGET_REGION = "us-east-1"
        BOT_URL = credentials('telegram')
    }    
    stages {
        stage('Install dependencies ') {
            parallel {
                stage('Init') {
                agent {
                    docker {
                        image 'node:fermium-alpine'
                        args '-u root:root'
                    }           
                 }
                    steps {
                        sh 'npm install'
                    }
                }
                stage('Test') {
                agent {
                    docker {
                        image 'node:fermium-alpine'
                        args '-u root:root'
                    }           
                 }
                    steps {
                        catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                        sh 'npm run test'
                        }
                    }
                }
            } // end parallel
        }

        stage('sast') {
            parallel {
                stage('Secrets-Gitleaks') {
                    steps {
                        script {
                            def result = sh label: "Secrets", returnStatus: true,
                                script: """\
                                    ./automation/security.sh secrets
                            """
                            if (result > 0) {
                                unstable(message: "Secrets issues found")
                            }   
                            }
                        }
                    }
            stage('audit') {
                agent {
                    docker {
                        image 'node:fermium-alpine'
                        args '-u root:root'
                    }           
                 }
                    steps {
                        catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                            sh 'npm audit --registry=https://registry.npmjs.org -audit-level=critical --json > report_npmaudit.json'
                            stash name: 'report_npmaudit.json', includes: 'report_npmaudit.json'
                        } 
                    }
                }
        }
    }
        stage('Build'){
            agent {
                docker {
                    image 'node:fermium-alpine'
                    args '-u root:root -v {}'
                } 
            }
            steps {
                sh '''
                if [ ${BRANCH_NAME} = "develop" ] ; then npm run build:develop ; else npm run build:production ; fi
                '''
                sh "apk add zip --update"
                sh "cd build;zip -r ../dist.zip . -x .*"
                stash includes: 'dist.zip', name: 'dist' 
            }
        }

        stage('aws-amplify') {
            parallel {
                stage('aws-check-Amplify') {
                    steps {
                        withAWS(credentials: 'aws-roxsross', region: "${TARGET_REGION}"){
                            sh './automation/aws_amplify.sh check'
                        }
                    }
                }
                stage ('upload-files-s3') {
                    steps{
                        withAWS(credentials: 'aws-roxsross', region: "${TARGET_REGION}"){
                            unstash 'dist'
                            sh './automation/aws_amplify.sh uploads3'
                        }
                    }
                }
            } //end parallels
        } 

        stage('aws-deploy-amplify') {
            steps {
                withAWS(credentials: 'aws-roxsross', region: "${TARGET_REGION}"){
                    sh './automation/aws_amplify.sh check'
                }
            } 
        }    

        stage('Notifications') {
            when {
                branch 'master'
            }
            steps {
                sh './automation/notification.sh'
            }
        }

        stage("Security Dast"){
            when {
                branch 'develop'
            }
            agent{
              docker{
                image "owasp/zap2docker-weekly"
                args "--volume ${WORKSPACE}:/zap/wrk"
                reuseNode true                   
                }
                    }
            steps{
                script {
                    def result = sh label: "OWASP ZAP", returnStatus: true,
                        script: """\
                            zap-baseline.py \
                            -t "https://develop.d3qp3lfgf2c69x.amplifyapp.com" \
                            -m 1 \
                            -d \
                            -r zapreport.html \
                    """
                    if (result > 0) {
                        unstable(message: "OWASP ZAP issues found")
                    }   
                }
            }
        }    
    }
}