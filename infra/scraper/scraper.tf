locals {
  scraper_s3_origin_id = "scraper_s3_origin"
  application = "scout"

  standard_tags = {
    Environment = var.environment
    Component   = "scraper"
    Application = local.application
  }
}

resource "aws_lambda_function" "scraper" {
  function_name = "scout-scraper-${var.environment}"

  # "lambda" is the filename within the zip file (main.js) and "handler"
  # is the name of the property under which the handler function was
  # exported in that file.
  handler     = "scraper.handler"
  runtime     = "python3.8"
  memory_size = 2048
  timeout     = 300

  s3_bucket = var.code_bucket
  s3_key    = "${local.application}/${var.environment}/${var.git_version}/package.zip"

  role = aws_iam_role.scraper_role.arn

  environment {
    variables = {
      S3_OUTPUT_BUCKET = var.app_bucket
      ENVIRONMENT      = var.environment
    }
  }

  tags = local.standard_tags
}

resource "aws_iam_role" "scraper_role" {
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

resource "aws_iam_policy" "scraper_policy" {
  description = "Lambda policy to allow writing to S3 bucket, DynamoDB, and logging"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PutObjectActions",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": ["arn:aws:s3:::${var.app_bucket}/*"]
    },
    {
      "Sid": "PutLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": ["arn:aws:logs:*:*:*"]
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "scraper_policy_attach" {
  role       = aws_iam_role.scraper_role.name
  policy_arn = aws_iam_policy.scraper_policy.arn
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.scraper.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_event_rule" "scraper_trigger" {
  schedule_expression = "cron(5 6 * * ? *)"

  description = "Run scraper on schedule"
  tags        = local.standard_tags
}

resource "aws_cloudwatch_event_target" "scraper_target" {
  rule  = aws_cloudwatch_event_rule.scraper_trigger.name
  arn   = aws_lambda_function.scraper.arn
  input = "{}"
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_scraper" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scraper.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.scraper_trigger.arn
}
