output "replication_group_id" {
  value = aws_elasticache_replication_group.this.id
}

output "primary_endpoint" {
  value = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "reader_endpoint" {
  value = aws_elasticache_replication_group.this.reader_endpoint_address
}

output "port" {
  value = aws_elasticache_replication_group.this.port
}

output "security_group_id" {
  value = aws_security_group.this.id
}

output "subnet_group_name" {
  value = aws_elasticache_subnet_group.this.name
}

output "kms_key_arn" {
  value       = try(aws_kms_key.this[0].arn, null)
  description = "KMS key ARN if created"
}
