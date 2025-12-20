output "cluster_id" {
  value = aws_ecs_cluster.this.id
}

output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "service_security_group_id" {
  value = aws_security_group.service.id
}

output "service_names" {
  value = { for k, v in aws_ecs_service.this : k => v.name }
}

output "task_definition_arns" {
  value = { for k, v in aws_ecs_task_definition.this : k => v.arn }
}

output "log_group_names" {
  value = { for k, v in aws_cloudwatch_log_group.service : k => v.name }
}

output "api_target_group_arn" {
  value       = try(aws_lb_target_group.api[0].arn, null)
  description = "ALB target group ARN for API (if enabled)"
}

output "web_target_group_arn" {
  value       = try(aws_lb_target_group.web[0].arn, null)
  description = "ALB target group ARN for Web (if enabled)"
}

output "task_execution_role_arn" {
  value = aws_iam_role.task_execution.arn
}

output "task_role_arn" {
  value = aws_iam_role.task.arn
}
