variable "name" {
  type        = string
  description = "Stack name"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to resources"
}

variable "log_groups" {
  type        = list(string)
  default     = ["api", "worker", "agent", "indexer", "web"]
  description = "List of log groups to create (names are scoped under /nuttoo/<name>/...)"
}

variable "log_retention_days" {
  type        = number
  default     = 14
  description = "Log retention in days"
}

variable "log_kms_key_arn" {
  type        = string
  default     = null
  description = "Optional KMS key ARN for log group encryption"
}

variable "create_alarm_topic" {
  type        = bool
  default     = true
  description = "Create an SNS topic for alarm notifications"
}

variable "alarm_email_subscribers" {
  type        = list(string)
  default     = []
  description = "Email subscribers for alarm notifications (requires confirmation)"
}

variable "alarm_action_arns" {
  type        = list(string)
  default     = []
  description = "Additional alarm actions"
}

variable "ok_action_arns" {
  type        = list(string)
  default     = []
  description = "Additional OK actions"
}

variable "metric_alarms" {
  type = list(object({
    alarm_name          = string
    alarm_description   = string
    namespace           = string
    metric_name         = string
    statistic           = string
    period              = number
    evaluation_periods  = number
    threshold           = number
    comparison_operator = string
    treat_missing_data  = string
    dimensions          = map(string)
  }))
  default     = []
  description = "Generic CloudWatch metric alarms"
}

variable "create_dashboard" {
  type        = bool
  default     = false
  description = "Create a CloudWatch dashboard"
}

variable "dashboard_body_json" {
  type        = string
  default     = "{\"widgets\":[]}"
  description = "CloudWatch dashboard JSON body"
}
