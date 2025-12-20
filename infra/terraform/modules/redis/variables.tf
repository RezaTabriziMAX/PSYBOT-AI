variable "name" {
  type        = string
  description = "Stack name used for tagging and identifiers"
}

variable "replication_group_id" {
  type        = string
  default     = ""
  description = "Optional explicit replication group id. If empty, derived from name."
}

variable "vpc_id" {
  type        = string
  description = "VPC ID"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Subnets for ElastiCache subnet group (private subnets recommended)"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to resources"
}

variable "engine_version" {
  type        = string
  default     = "7.1"
  description = "Redis engine version"
}

variable "node_type" {
  type        = string
  default     = "cache.t4g.medium"
  description = "Node type"
}

variable "port" {
  type        = number
  default     = 6379
  description = "Redis port"
}

variable "num_cache_clusters" {
  type        = number
  default     = 2
  description = "Number of cache clusters (use >=2 with automatic failover)"
}

variable "automatic_failover_enabled" {
  type        = bool
  default     = true
  description = "Enable automatic failover"
}

variable "multi_az_enabled" {
  type        = bool
  default     = true
  description = "Enable multi-AZ"
}

variable "at_rest_encryption_enabled" {
  type        = bool
  default     = true
  description = "Enable encryption at rest"
}

variable "transit_encryption_enabled" {
  type        = bool
  default     = true
  description = "Enable encryption in transit"
}

variable "enable_kms" {
  type        = bool
  default     = true
  description = "Create a dedicated KMS key for at-rest encryption"
}

variable "kms_key_arn" {
  type        = string
  default     = null
  description = "External KMS key ARN if enable_kms is false"
}

variable "auth_token" {
  type        = string
  default     = null
  sensitive   = true
  description = "Auth token for Redis (required when transit_encryption_enabled is true in many configurations)"
}

variable "user_group_ids" {
  type        = list(string)
  default     = []
  description = "Optional Redis user group ids (Redis ACL)"
}

variable "additional_security_group_ids" {
  type        = list(string)
  default     = []
  description = "Additional security groups to attach to the replication group"
}

variable "allowed_security_group_ids" {
  type        = list(string)
  default     = []
  description = "Security groups allowed to connect to Redis"
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  default     = []
  description = "CIDR blocks allowed to connect to Redis"
}

variable "parameter_group_family" {
  type        = string
  default     = "redis7"
  description = "ElastiCache parameter group family"
}

variable "parameters" {
  type = list(object({
    name  = string
    value = string
  }))
  default     = []
  description = "Custom Redis parameters"
}

variable "snapshot_retention_limit" {
  type        = number
  default     = 7
  description = "Snapshot retention in days"
}

variable "snapshot_window" {
  type        = string
  default     = "03:00-04:00"
  description = "Snapshot window"
}

variable "maintenance_window" {
  type        = string
  default     = "sun:04:00-sun:05:00"
  description = "Maintenance window"
}

variable "apply_immediately" {
  type        = bool
  default     = false
  description = "Apply modifications immediately"
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

variable "alarm_freeable_memory_bytes_threshold" {
  type        = number
  default     = 200_000_000
  description = "FreeableMemory alarm threshold in bytes"
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
