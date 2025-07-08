AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= 
AWS_PROFILE ?= new-efflux
STACK_NAME ?= Postbacks-Handler-API
NEW_RELIC_ACCOUNT_ID ?= 

deploy-stack:
	@echo "Deploying stack using SAM"
	@sam deploy \
		--no-confirm-changeset \
		--template-file template.yaml \
		--stack-name $(STACK_NAME) \
		--region $(AWS_REGION) \
		--profile $(AWS_PROFILE) \
		--capabilities CAPABILITY_IAM \
		--resolve-s3 \
		--parameter-overrides \
      ParameterKey=NewRelicAccountId,ParameterValue=$(NEW_RELIC_ACCOUNT_ID) \
			ParameterKey=AWSRegion,ParameterValue=$(AWS_REGION) \
			ParameterKey=AWSAccountId,ParameterValue=$(AWS_ACCOUNT_ID) \
			ParameterKey=AWSProfile,ParameterValue=$(AWS_PROFILE)

destroy-stack:
	@echo "Destroying stack using SAM"
	@sam delete \
		--stack-name $(STACK_NAME) \
		--region $(AWS_REGION) \
		--profile $(AWS_PROFILE)

tail-logs:
	@echo "Tailing logs for stack $(STACK_NAME)"
	@sam logs \
		--stack-name $(STACK_NAME) \
		--region $(AWS_REGION) \
		--profile $(AWS_PROFILE) \
		--tail
