output "vpc_id" {
  value       = aws_vpc.nexus.id
  description = "The VPC ID created for the OmniGuard security node"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.nexus.name
  description = "ECS cluster identifier"
}

output "ecs_service_name" {
  value       = aws_ecs_service.main.name
  description = "ECS Service identifier for deployment monitoring"
}
