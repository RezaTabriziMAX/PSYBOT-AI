variable "cidr_block" {
  type = string
}

variable "public_subnets" {
  type = list(string)
}

variable "azs" {
  type = list(string)
}

variable "tags" {
  type    = map(string)
  default = {}
}
