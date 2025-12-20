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
    "nuttoo:module" = "redis"
    "nuttoo:stack"  = var.name
  })

  rg_id = var.replication_group_id != "" ? var.replication_group_id : "${var.name}-redis"
}

# -----------------------------------------------------------------------------
# Subnet Group
# -----------------------------------------------------------------------------
resource "aws_elasticache_subnet_group" "this" {
  name       = "${local.rg_id}-subnets"
  subnet_ids = var.subnet_ids
  tags       = local.common_tags
}

# -----------------------------------------------------------------------------
# Security Group
# -----------------------------------------------------------------------------
resource "aws_security_group" "this" {
  name        = "${local.rg_id}-sg"
  description = "Redis security group"
  vpc_id      = var.vpc_id
  tags        = local.common_tags
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.this.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "from_sgs" {
  for_each = toset(var.allowed_security_group_ids)

  security_group_id            = aws_security_group.this.id
  referenced_security_group_id = each.value
  ip_protocol                  = "tcp"
  from_port                    = var.port
  to_port                      = var.port
  description                  = "Allow inbound Redis from trusted security group"
}

resource "aws_vpc_security_group_ingress_rule" "from_cidrs" {
  for_each = toset(var.allowed_cidr_blocks)

  security_group_id = aws_security_group.this.id
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = var.port
  to_port           = var.port
  description       = "Allow inbound Redis from trusted CIDR"
}

# -----------------------------------------------------------------------------
# KMS Key (optional, for at-rest encryption)
# -----------------------------------------------------------------------------
resource "aws_kms_key" "this" {
  count                   = var.enable_kms ? 1 : 0
  description             = "KMS key for Nuttoo Redis at-rest encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "this" {
  count         = var.enable_kms ? 1 : 0
  name          = "alias/${local.rg_id}-redis"
  target_key_id = aws_kms_key.this[0].key_id
}

# -----------------------------------------------------------------------------
# Parameter Group (optional)
# -----------------------------------------------------------------------------
resource "aws_elasticache_parameter_group" "this" {
  name   = "${local.rg_id}-pg"
  family = var.parameter_group_family
  tags   = local.common_tags

  dynamic "parameter" {
    for_each = var.parameters
    content {
      name  = parameter.value.name
      value = parameter.value.value
    }
  }
}

# -----------------------------------------------------------------------------
# Replication Group
# -----------------------------------------------------------------------------
resource "aws_elasticache_replication_group" "this" {
  replication_group_id          = local.rg_id
  description                   = "Nuttoo Redis replication group"
  engine                        = "redis"
  engine_version                = var.engine_version
  node_type                     = var.node_type
  port                          = var.port

  parameter_group_name          = aws_elasticache_parameter_group.this.name
  subnet_group_name             = aws_elasticache_subnet_group.this.name
  security_group_ids            = concat([aws_security_group.this.id], var.additional_security_group_ids)

  automatic_failover_enabled    = var.automatic_failover_enabled
  multi_az_enabled              = var.multi_az_enabled

  num_cache_clusters            = var.num_cache_clusters

  at_rest_encryption_enabled    = var.at_rest_encryption_enabled
  transit_encryption_enabled    = var.transit_encryption_enabled

  kms_key_id                    = var.enable_kms ? aws_kms_key.this[0].arn : var.kms_key_arn

  auth_token                    = var.auth_token
  user_group_ids                = var.user_group_ids

  snapshot_retention_limit      = var.snapshot_retention_limit
  snapshot_window               = var.snapshot_window

  maintenance_window            = var.maintenance_window

  apply_immediately             = var.apply_immediately

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Optional CloudWatch Alarms
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "${local.rg_id}-cpu-high"
  alarm_description   = "High CPU utilization on Redis replication group"
  namespace           = "AWS/ElastiCache"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.alarm_cpu_threshold
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.this.id
  }

  alarm_actions = var.alarm_actions
  ok_actions    = var.ok_actions
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "memory_low" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "${local.rg_id}-free-memory-low"
  alarm_description   = "Low free memory on Redis replication group"
  namespace           = "AWS/ElastiCache"
  metric_name         = "FreeableMemory"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.alarm_freeable_memory_bytes_threshold
  comparison_operator = "LessThanThreshold"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.this.id
  }

  alarm_actions = var.alarm_actions
  ok_actions    = var.ok_actions
  tags          = local.common_tags
}
