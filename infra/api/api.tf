locals {
  application = "scout"

  standard_tags = {
    Environment = var.environment
    Component   = "api"
    Application = local.application
  }
}

resource "aws_lambda_function" "scout_api" {
  function_name = "scout-api"

  handler     = "lambda.handler"
  runtime     = "nodejs14.x"
  memory_size = 512
  timeout     = 5

  s3_bucket        = var.code_bucket
  s3_key           = "${local.application}/${var.environment}/${var.git_version}/api.zip"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.scout_rooms.name
    }
  }

  role = aws_iam_role.api_lambda_role.arn
  tags = local.standard_tags
}

resource "aws_iam_role" "api_lambda_role" {
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
  tags = local.standard_tags
}

resource "aws_iam_policy" "api_lambda_policy" {
  description = "Lambda policy to allow writing to DynamoDB, and logging"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PutLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": ["arn:aws:logs:*:*:*"]
    },
    {
      "Sid": "ReadWriteCreateTable",
      "Effect": "Allow",
      "Action": [
          "dynamodb:BatchGetItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:CreateTable"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/${aws_dynamodb_table.scout_rooms.name}"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "api_lambda_policy_attach" {
  role       = aws_iam_role.api_lambda_role.name
  policy_arn = aws_iam_policy.api_lambda_policy.arn
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.scout_api.function_name}"
  retention_in_days = 14
}

# DynamoDB
resource "aws_dynamodb_table" "scout_rooms" {
  name         = "ScoutRoomState_${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "roomId"

  attribute {
    name = "roomId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = local.standard_tags
}

# API Gateway
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scout_api.function_name
  principal     = "apigateway.amazonaws.com"

  # The "/*/*" portion grants access from any method on any resource
  # within the API Gateway REST API.
  source_arn = "${aws_api_gateway_rest_api.scout_api_gateway.execution_arn}/*/*"
}

resource "aws_api_gateway_rest_api" "scout_api_gateway" {
  name        = "scout_api_gateway_${var.environment}"
  description = "Scout Gateway for API"
}

resource "aws_api_gateway_resource" "scout_api_proxy" {
  rest_api_id = aws_api_gateway_rest_api.scout_api_gateway.id
  parent_id   = aws_api_gateway_rest_api.scout_api_gateway.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "scout_api_proxy_root" {
  rest_api_id   = aws_api_gateway_rest_api.scout_api_gateway.id
  resource_id   = aws_api_gateway_rest_api.scout_api_gateway.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "scout_api_lambda_root" {
  rest_api_id = aws_api_gateway_rest_api.scout_api_gateway.id
  resource_id = aws_api_gateway_method.scout_api_proxy_root.resource_id
  http_method = aws_api_gateway_method.scout_api_proxy_root.http_method

  integration_http_method = "POST"

  type = "AWS_PROXY"
  uri  = aws_lambda_function.scout_api.invoke_arn
}


resource "aws_api_gateway_deployment" "scout_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.scout_api_lambda_root,
  ]

  rest_api_id = aws_api_gateway_rest_api.scout_api_gateway.id
  stage_name  = var.environment
}

output "invoke_url" {
  value = aws_api_gateway_deployment.scout_api_deployment.invoke_url
}
