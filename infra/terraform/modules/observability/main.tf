terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  common_tags = merge(var.tags, {
    "nuttoo:module" = "observability"
    "nuttoo:stack"  = var.name
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Log Groups
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "this" {
  for_each          = toset(var.log_groups)
  name              = "/nuttoo/${var.name}/${each.key}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.log_kms_key_arn
  tags              = local.common_tags
}

# -----------------------------------------------------------------------------
# SNS Topic (optional) for alarms
# -----------------------------------------------------------------------------
resource "aws_sns_topic" "alarms" {
  count = var.create_alarm_topic ? 1 : 0
  name  = "${var.name}-alarms"
  tags  = local.common_tags
}

resource "aws_sns_topic_subscription" "alarm_subscriptions" {
  for_each = var.create_alarm_topic ? { for i, e in var.alarm_email_subscribers : tostring(i) => e } : {}

  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = each.value
}

# -----------------------------------------------------------------------------
# Metric Alarms (generic)
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "alarms" {
  for_each = { for a in var.metric_alarms : a.alarm_name => a }

  alarm_name          = "${var.name}-${each.value.alarm_name}"
  alarm_description   = each.value.alarm_description
  namespace           = each.value.namespace
  metric_name         = each.value.metric_name
  statistic           = each.value.statistic
  period              = each.value.period
  evaluation_periods  = each.value.evaluation_periods
  threshold           = each.value.threshold
  comparison_operator = each.value.comparison_operator
  treat_missing_data  = each.value.treat_missing_data

  dimensions = each.value.dimensions

  alarm_actions = concat(
    var.alarm_action_arns,
    var.create_alarm_topic ? [aws_sns_topic.alarms[0].arn] : []
  )

  ok_actions = concat(
    var.ok_action_arns,
    var.create_alarm_topic ? [aws_sns_topic.alarms[0].arn] : []
  )

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CloudWatch Dashboard (optional)
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_dashboard" "this" {
  count          = var.create_dashboard ? 1 : 0
  dashboard_name = "${var.name}-dashboard"
  dashboard_body = var.dashboard_body_json
}
