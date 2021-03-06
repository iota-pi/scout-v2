locals {
  environment        = terraform.workspace == "default" ? "production" : terraform.workspace
}

module "app" {
  source = "./app"

  environment        = local.environment
  git_version        = var.app_version
  root_domain        = var.root_domain
  cloudflare_zone_id = var.cloudflare_zone_id

  providers = {
    aws.us_east_1 = aws.us_east_1
  }
}

module "scraper" {
  source = "./scraper"

  app_bucket = module.app.app_bucket
  code_bucket = var.code_bucket
  environment = local.environment
  git_version = var.scraper_version
}
