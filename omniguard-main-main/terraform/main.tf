terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ─── VPC Network Infrastructure ────────────────────────────────────────────────
resource "aws_vpc" "nexus" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "omniguard-nexus-vpc"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "nexus" {
  vpc_id = aws_vpc.nexus.id
}

resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.nexus.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "public_b" {
  vpc_id            = aws_vpc.nexus.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  map_public_ip_on_launch = true
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.nexus.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.nexus.id
  }
}

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# ─── Security Groups ───────────────────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "nexus-alb-sg"
  description = "Allow inbound public traffic to ALB"
  vpc_id      = aws_vpc.nexus.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "nexus-ecs-tasks-sg"
  description = "Limit inbound traffic to ALB only"
  vpc_id      = aws_vpc.nexus.id

  ingress {
    from_port       = 5173
    to_port         = 5175
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ─── ECS Fargate Service Container Tasks ──────────────────────────────────────────
resource "aws_ecs_cluster" "nexus" {
  name = "omniguard-nexus-cluster"
}

resource "aws_ecs_task_definition" "app" {
  family                   = "omniguard-nexus-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"

  container_definitions = jsonencode([{
    name      = "omniguard-app"
    image     = "omniguard-enterprise:latest"
    essential = true
    portMappings = [
      { containerPort = 5173, hostPort = 5173 },
      { containerPort = 5175, hostPort = 5175 }
    ]
    environment = [
      { name = "NODE_ENV", value = var.environment }
    ]
  }])
}

resource "aws_ecs_service" "main" {
  name            = "nexus-service"
  cluster         = aws_ecs_cluster.nexus.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }
}
