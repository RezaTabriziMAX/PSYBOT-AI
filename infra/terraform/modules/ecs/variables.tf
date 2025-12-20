variable "name" {
  type        = string
  description = "Name prefix for ECS cluster and services"
}

variable "aws_region" {
  type        = string
  description = "AWS region for log configuration"
}

variable "vpc_id" {
  type        = string
  description = "VPC id"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet ids for Fargate tasks"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to resources"
}

variable "services" {
  type        = list(string)
  description = "Services to deploy. Supported: api, worker, agent, indexer, web"
  default     = ["api", "worker"]
  validation {
    condition     = alltrue([for s in var.services : contains(["api", "worker", "agent", "indexer", "web"], s)])
    error_message = "services must be a subset of: api, worker, agent, indexer, web"
  }
}

variable "images" {
  type        = map(string)
  description = "Container images by service name"
}

variable "environment" {
  type        = map(string)
  default     = {}
  description = "Environment variables injected into all containers"
}

variable "secrets" {
  type        = map(string)
  default     = {}
  description = "Secrets Manager or SSM parameter ARNs mapped to env var names"
}

variable "enable_container_insights" {
  type        = bool
  default     = true
}

variable "capacity_providers" {
  type        = list(string)
  default     = ["FARGATE", "FARGATE_SPOT"]
}

variable "default_capacity_provider" {
  type        = string
  default     = "FARGATE"
}

variable "log_retention_days" {
  type        = number
  default     = 14
}

variable "enable_execute_command" {
  type        = bool
  default     = false
}

variable "allow_internal_traffic" {
  type        = bool
  default     = true
  description = "Allow tasks in the same SG to talk to each other"
}

# ---------------------------------------------------------------------------
# Optional ALB integration
# ---------------------------------------------------------------------------
variable "enable_alb" {
  type        = bool
  default     = false
  description = "Enable ALB integration for web/api"
}

variable "alb_listener_arns" {
  type        = list(string)
  default     = []
  description = "ALB listener ARNs used for listener rules"
}

variable "alb_security_group_id" {
  type        = string
  default     = null
  description = "ALB security group id used to allow inbound traffic to API"
}

variable "api_hostnames" {
  type        = list(string)
  default     = ["api.nuttoo.example"]
}

variable "web_hostnames" {
  type        = list(string)
  default     = ["nuttoo.example"]
}

variable "api_listener_priority" {
  type        = number
  default     = 100
}

variable "web_listener_priority" {
  type        = number
  default     = 110
}

variable "api_container_port" {
  type        = number
  default     = 8080
}

variable "web_container_port" {
  type        = number
  default     = 80
}

variable "api_health_check_path" {
  type        = string
  default     = "/healthz"
}

variable "web_health_check_path" {
  type        = string
  default     = "/"
}

variable "enable_container_healthcheck" {
  type        = bool
  default     = true
}

# ---------------------------------------------------------------------------
# Service sizing defaults (can be overridden per service)
# ---------------------------------------------------------------------------
variable "api_cpu" { type = number, default = 512 }
variable "api_memory" { type = number, default = 1024 }
variable "api_desired_count" { type = number, default = 2 }

variable "worker_cpu" { type = number, default = 512 }
variable "worker_memory" { type = number, default = 1024 }
variable "worker_desired_count" { type = number, default = 2 }

variable "agent_cpu" { type = number, default = 512 }
variable "agent_memory" { type = number, default = 1024 }
variable "agent_desired_count" { type = number, default = 1 }

variable "indexer_cpu" { type = number, default = 512 }
variable "indexer_memory" { type = number, default = 1024 }
variable "indexer_desired_count" { type = number, default = 1 }

variable "web_cpu" { type = number, default = 256 }
variable "web_memory" { type = number, default = 512 }
variable "web_desired_count" { type = number, default = 2 }

variable "service_overrides" {
  type        = map(any)
  default     = {}
  description = "Per-service overrides for cpu, memory, port, desired, health_path, command"
}

# ---------------------------------------------------------------------------
# Autoscaling
# ---------------------------------------------------------------------------
variable "enable_autoscaling" {
  type        = bool
  default     = true
}

variable "autoscaling_min" {
  type        = map(number)
  default     = {}
}

variable "autoscaling_max" {
  type        = map(number)
  default     = {}
}

variable "autoscaling_cpu_target" {
  type        = map(number)
  default     = {}
}

# ---------------------------------------------------------------------------
# Optional extra IAM policy for task role
# ---------------------------------------------------------------------------
variable "task_role_extra_policy_json" {
  type        = string
  default     = ""
  description = "JSON policy document to attach to task role (optional)"
}
