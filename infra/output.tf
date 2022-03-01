output "environment" {
  value = local.environment
}

output "app_bucket" {
  value = module.app.app_bucket
}

output "invoke_url" {
  value = module.lambda_api.invoke_url
}
