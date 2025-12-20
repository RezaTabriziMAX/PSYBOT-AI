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
    "nuttoo:module" = "rds"
    "nuttoo:stack"  = var.name
  })

  db_identifier = var.db_identifier != "" ? var.db_identifier : "${var.name}-postgres"
}

# -----------------------------------------------------------------------------
# Subnet Group
# -----------------------------------------------------------------------------
resource "aws_db_subnet_group" "this" {
  name       = "${local.db_identifier}-subnets"
  subnet_ids = var.subnet_ids
  tags       = local.common_tags
}

# -----------------------------------------------------------------------------
# Parameter Group (optional custom parameters)
# -----------------------------------------------------------------------------
resource "aws_db_parameter_group" "this" {
  name   = "${local.db_identifier}-pg"
  family = var.parameter_group_family
  tags   = local.common_tags

  dynamic "parameter" {
    for_each = var.parameters
    content {
      name         = parameter.value.name
      value        = parameter.value.value
      apply_method = lookup(parameter.value, "apply_method", "pending-reboot")
    }
  }
}

# -----------------------------------------------------------------------------
# Option Group (optional)
# -----------------------------------------------------------------------------
resource "aws_db_option_group" "this" {
  count                = var.enable_option_group ? 1 : 0
  name                 = "${local.db_identifier}-og"
  engine_name          = "postgres"
  major_engine_version = var.major_engine_version
  tags                 = local.common_tags
}

# -----------------------------------------------------------------------------
# Security Group
# -----------------------------------------------------------------------------
resource "aws_security_group" "this" {
  name        = "${local.db_identifier}-sg"
  description = "RDS security group"
  vpc_id      = var.vpc_id
  tags        = local.common_tags
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.this.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# Allow inbound from provided security groups (e.g., ECS services).
resource "aws_vpc_security_group_ingress_rule" "from_sgs" {
  for_each = toset(var.allowed_security_group_ids)

  security_group_id            = aws_security_group.this.id
  referenced_security_group_id = each.value
  ip_protocol                  = "tcp"
  from_port                    = var.port
  to_port                      = var.port
  description                  = "Allow inbound Postgres from trusted security group"
}

# Allow inbound from specific CIDR blocks (optional).
resource "aws_vpc_security_group_ingress_rule" "from_cidrs" {
  for_each = toset(var.allowed_cidr_blocks)

  security_group_id = aws_security_group.this.id
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = var.port
  to_port           = var.port
  description       = "Allow inbound Postgres from trusted CIDR"
}

# -----------------------------------------------------------------------------
# KMS Key (optional)
# -----------------------------------------------------------------------------
resource "aws_kms_key" "this" {
  count                   = var.enable_kms ? 1 : 0
  description             = "KMS key for Nuttoo RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "this" {
  count         = var.enable_kms ? 1 : 0
  name          = "alias/${local.db_identifier}-rds"
  target_key_id = aws_kms_key.this[0].key_id
}

# -----------------------------------------------------------------------------
# RDS Instance (single-AZ) or Multi-AZ
# -----------------------------------------------------------------------------
resource "aws_db_instance" "this" {
  identifier = local.db_identifier

  engine         = "postgres"
  engine_version = var.engine_version

  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage

  db_name  = var.db_name
  username = var.username
  password = var.password

  port = var.port

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = concat([aws_security_group.this.id], var.additional_security_group_ids)

  parameter_group_name = aws_db_parameter_group.this.name
  option_group_name    = var.enable_option_group ? aws_db_option_group.this[0].name : null

  storage_type          = var.storage_type
  storage_encrypted     = true
  kms_key_id            = var.enable_kms ? aws_kms_key.this[0].arn : var.kms_key_arn
  iops                  = var.iops
  storage_throughput    = var.storage_throughput

  multi_az               = var.multi_az
  publicly_accessible    = var.publicly_accessible
  deletion_protection    = var.deletion_protection
  apply_immediately      = var.apply_immediately
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? var.performance_insights_retention_period : null
  performance_insights_kms_key_id        = var.performance_insights_enabled && var.enable_kms ? aws_kms_key.this[0].arn : null

  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_interval > 0 ? aws_iam_role.enhanced_monitoring[0].arn : null

  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports

  copy_tags_to_snapshot = true
  skip_final_snapshot   = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${local.db_identifier}-final"

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Enhanced Monitoring Role (optional)
# -----------------------------------------------------------------------------
data "aws_iam_policy_document" "monitoring_assume" {
  count = var.monitoring_interval > 0 ? 1 : 0

  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "enhanced_monitoring" {
  count              = var.monitoring_interval > 0 ? 1 : 0
  name               = "${local.db_identifier}-rds-monitoring"
  assume_role_policy = data.aws_iam_policy_document.monitoring_assume[0].json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "enhanced_monitoring" {
  count      = var.monitoring_interval > 0 ? 1 : 0
  role       = aws_iam_role.enhanced_monitoring[0].name
  policy_arn  = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# -----------------------------------------------------------------------------
# Optional: CloudWatch Alarms
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "${local.db_identifier}-cpu-high"
  alarm_description   = "High CPU utilization on RDS instance"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.alarm_cpu_threshold
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }

  alarm_actions = var.alarm_actions
  ok_actions    = var.ok_actions
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "free_storage_low" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "${local.db_identifier}-free-storage-low"
  alarm_description   = "Low free storage on RDS instance"
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  threshold           = var.alarm_free_storage_bytes_threshold
  comparison_operator = "LessThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }

  alarm_actions = var.alarm_actions
  ok_actions    = var.ok_actions
  tags          = local.common_tags
}
