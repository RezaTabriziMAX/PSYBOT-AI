output "log_group_names" {
  value = { for k, v in aws_cloudwatch_log_group.this : k => v.name }
}

output "alarm_topic_arn" {
  value       = try(aws_sns_topic.alarms[0].arn, null)
  description = "SNS topic ARN used for alarm notifications"
}

output "dashboard_name" {
  value       = try(aws_cloudwatch_dashboard.this[0].dashboard_name, null)
  description = "CloudWatch dashboard name if created"
}
