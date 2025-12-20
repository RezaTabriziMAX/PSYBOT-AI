variable "name" {
  type        = string
  description = "Stack name used for tagging and identifiers"
}

variable "db_identifier" {
  type        = string
  default     = ""
  description = "Optional explicit DB identifier. If empty, derived from name."
}

variable "vpc_id" {
  type        = string
  description = "VPC ID"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Subnets for RDS subnet group (private subnets recommended)"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to resources"
}

variable "engine_version" {
  type        = string
  default     = "16.3"
  description = "Postgres engine version"
}

variable "major_engine_version" {
  type        = string
  default     = "16"
  description = "Major engine version used for option group"
}

variable "instance_class" {
  type        = string
  default     = "db.t4g.medium"
  description = "RDS instance class"
}

variable "db_name" {
  type        = string
  default     = "nuttoo"
  description = "Database name"
}

variable "username" {
  type        = string
  description = "Master username"
}

variable "password" {
  type        = string
  sensitive   = true
  description = "Master password"
}

variable "port" {
  type        = number
  default     = 5432
  description = "Database port"
}

variable "allocated_storage" {
  type        = number
  default     = 50
  description = "Allocated storage in GB"
}

variable "max_allocated_storage" {
  type        = number
  default     = 200
  description = "Autoscaling max storage in GB"
}

variable "storage_type" {
  type        = string
  default     = "gp3"
  description = "Storage type (gp3 recommended)"
}

variable "iops" {
  type        = number
  default     = null
  description = "Provisioned IOPS (gp3 only; optional)"
}

variable "storage_throughput" {
  type        = number
  default     = null
  description = "Storage throughput (gp3 only; optional)"
}

variable "multi_az" {
  type        = bool
  default     = true
  description = "Enable Multi-AZ"
}

variable "publicly_accessible" {
  type        = bool
  default     = false
  description = "Whether DB is publicly accessible"
}

variable "deletion_protection" {
  type        = bool
  default     = true
  description = "Enable deletion protection"
}

variable "apply_immediately" {
  type        = bool
  default     = false
  description = "Apply modifications immediately"
}

variable "auto_minor_version_upgrade" {
  type        = bool
  default     = true
  description = "Enable auto minor version upgrades"
}

variable "backup_retention_period" {
  type        = number
  default     = 14
  description = "Backup retention in days"
}

variable "backup_window" {
  type        = string
  default     = "03:00-04:00"
  description = "Backup window"
}

variable "maintenance_window" {
  type        = string
  default     = "sun:04:00-sun:05:00"
  description = "Maintenance window"
}

variable "enabled_cloudwatch_logs_exports" {
  type        = list(string)
  default     = ["postgresql", "upgrade"]
  description = "CloudWatch logs exports"
}

variable "skip_final_snapshot" {
  type        = bool
  default     = false
  description = "Skip final snapshot on destroy"
}

variable "additional_security_group_ids" {
  type        = list(string)
  default     = []
  description = "Additional security groups to attach to the DB instance"
}

variable "allowed_security_group_ids" {
  type        = list(string)
  default     = []
  description = "Security groups allowed to connect to the DB port"
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  default     = []
  description = "CIDR blocks allowed to connect to the DB port"
}

variable "parameter_group_family" {
  type        = string
  default     = "postgres16"
  description = "DB parameter group family"
}

variable "parameters" {
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string)
  }))
  default     = []
  description = "Custom DB parameters"
}

variable "enable_option_group" {
  type        = bool
  default     = false
  description = "Create and attach an option group"
}

variable "enable_kms" {
  type        = bool
  default     = true
  description = "Create a dedicated KMS key for encryption"
}

variable "kms_key_arn" {
  type        = string
  default     = null
  description = "External KMS key ARN if enable_kms is false"
}

variable "performance_insights_enabled" {
  type        = bool
  default     = true
  description = "Enable Performance Insights"
}

variable "performance_insights_retention_period" {
  type        = number
  default     = 7
  description = "Performance Insights retention period"
}

variable "monitoring_interval" {
  type        = number
  default     = 60
  description = "Enhanced monitoring interval in seconds; set 0 to disable"
}

variable "enable_alarms" {
  type        = bool
  default     = true
  description = "Create basic CloudWatch alarms"
}

variable "alarm_cpu_threshold" {
  type        = number
  default     = 80
  description = "CPU utilization alarm threshold percentage"
}

variable "alarm_free_storage_bytes_threshold" {
  type        = number
  default     = 5_000_000_000
  description = "Free storage alarm threshold in bytes"
}

variable "alarm_actions" {
  type        = list(string)
  default     = []
  description = "Alarm actions ARNs"
}

variable "ok_actions" {
  type        = list(string)
  default     = []
  description = "OK actions ARNs"
}
