# EC2 VSCode Server

Deploy and manage a VSCode Server on AWS EC2 for remote development accessible from any web browser.

## Features

- 🚀 **One-command deployment** to AWS EC2
- 💻 **VSCode Server** accessible via web browser
- 🔐 **Secure access** with password authentication
- 💾 **Automatic daily backups** to S3
- 🔄 **Start/stop management** to save costs
- 🌐 **Access from anywhere** with internet connection
- 📱 **Mobile-friendly** development environment
- 🛠 **Pre-installed tools**: Node.js, Docker, AWS CLI, Git

## Quick Start

### 1. Deploy the Server

```bash
# Navigate to the package
cd packages/ec2-vsc

# Deploy with default settings
yarn deploy

# Or deploy with custom options
yarn deploy -t t3.large -k my-key-pair -s 50
```

During deployment, you'll be prompted for:
- VSCode server password (minimum 8 characters)
- AWS credentials (if not already configured in the deploy package)

**Note**: This package uses the same AWS credentials as the deploy package. If you've already configured credentials for the deploy package, they will be automatically used.

### 2. Access Your VSCode Server

After deployment, you'll see output like:
```
🌐 VSCode URL: http://54.123.45.67:8080
🌍 Public IP: 54.123.45.67
💾 Backup Bucket: ec2-vscode-server-backup-123456789012
```

Open the VSCode URL in your browser and enter the password you set.

### 3. Manage Your Server

```bash
# Check server status
yarn status

# Start the server (if stopped)
yarn start

# Stop the server (to save costs)
yarn stop

# Get connection information
yarn connect

# Remove all resources
yarn remove
```

## Configuration Options

### Deployment Options

| Option | Default | Description |
|--------|---------|-------------|
| `-t, --instance-type` | `t3.medium` | EC2 instance type |
| `-k, --key-pair` | None | EC2 Key Pair for SSH access |
| `-i, --allowed-ips` | `0.0.0.0/0` | CIDR block for allowed IPs |
| `-s, --volume-size` | `20` | EBS volume size in GB |
| `-n, --stack-name` | `ec2-vscode-server` | CloudFormation stack name |

### Instance Types

Choose based on your needs:

| Type | vCPUs | RAM | Use Case |
|------|-------|-----|----------|
| `t3.micro` | 2 | 1 GB | Light development, testing |
| `t3.small` | 2 | 2 GB | Small projects |
| `t3.medium` | 2 | 4 GB | **Default** - Most projects |
| `t3.large` | 2 | 8 GB | Larger projects, multiple services |
| `t3.xlarge` | 4 | 16 GB | Heavy development, containers |
| `c5.large` | 2 | 4 GB | CPU-intensive tasks |
| `c5.xlarge` | 4 | 8 GB | High-performance computing |

## Usage Examples

### Basic Deployment
```bash
yarn deploy
```

### Custom Configuration
```bash
# Deploy with larger instance and SSH access
yarn deploy --instance-type t3.large --key-pair my-aws-key --volume-size 50

# Deploy with restricted IP access (your public IP only)
yarn deploy --allowed-ips 203.123.45.67/32

# Deploy with custom stack name
yarn deploy --stack-name my-dev-server
```

### Daily Operations
```bash
# Morning: Start your server
yarn start

# Check if it's ready
yarn status

# Get connection URL
yarn connect

# Evening: Stop to save costs
yarn stop
```

## Cost Management

### Stop When Not in Use
```bash
# Stop the instance to avoid hourly charges
yarn stop

# Start when you need to work
yarn start
```

**Cost Savings**: Stopping the instance stops EC2 charges but keeps:
- ✅ EBS storage (your data and settings)
- ✅ S3 backups
- ✅ Elastic IP (if configured)

### Instance Costs (approximate, us-east-1)
| Instance Type | Hourly | Monthly (24/7) | Monthly (8h/day) |
|---------------|--------|----------------|------------------|
| t3.micro | $0.0104 | $7.59 | $2.53 |
| t3.small | $0.0208 | $15.18 | $5.06 |
| t3.medium | $0.0416 | $30.37 | $10.12 |
| t3.large | $0.0832 | $60.74 | $20.25 |

## Backup & Restore

### Automatic Backups
- Daily backup at 2 AM UTC
- Stored in dedicated S3 bucket
- Includes entire workspace directory

### Manual Backup
```bash
# SSH into your instance and run:
~/backup-workspace.sh
```

### Restore from Backup
```bash
# SSH into your instance
ssh -i ~/.ssh/your-key.pem ec2-user@YOUR_PUBLIC_IP

# List available backups
~/restore-workspace.sh

# Restore specific backup
~/restore-workspace.sh workspace-backup-20250629-120000.tar.gz
```

## Pre-installed Software

Your VSCode server comes with:

### Development Tools
- **Node.js** (Latest LTS)
- **npm & yarn**
- **Git**
- **Docker & Docker Compose**
- **AWS CLI v2**

### System Tools
- **curl & wget**
- **unzip**
- **systemctl** (service management)

### VSCode Extensions
You can install any VSCode extension directly in the web interface.

## Security

### Network Security
- Security group restricts access to specified IPs
- Only ports 22 (SSH) and 8080 (VSCode) are open
- All outbound traffic allowed for package installation

### Access Control
- Password-protected VSCode access
- Optional SSH key authentication
- IAM role with minimal required permissions

### Data Protection
- EBS volumes encrypted at rest
- S3 backup bucket with encryption
- Private subnets available for enhanced security

## Troubleshooting

### Connection Issues

**Can't access VSCode URL:**
1. Check instance status: `yarn status`
2. Ensure instance is running: `yarn start`
3. Verify security group allows your IP
4. Check if port 8080 is blocked by your firewall

**Slow performance:**
1. Consider upgrading instance type
2. Check EBS volume size
3. Monitor CloudWatch metrics

### SSH Access

**SSH connection refused:**
```bash
# Ensure you have the key pair
ls ~/.ssh/your-key-pair.pem

# Check permissions
chmod 400 ~/.ssh/your-key-pair.pem

# Use Session Manager instead
aws ssm start-session --target i-1234567890abcdef0
```

### VSCode Issues

**Can't install extensions:**
- Check internet connectivity
- Verify outbound rules in security group
- Try restarting code-server: `sudo systemctl restart code-server@ec2-user`

**Lost password:**
- SSH into instance and edit: `~/.config/code-server/config.yaml`
- Restart service: `sudo systemctl restart code-server@ec2-user`

## Advanced Configuration

### Custom Security Groups
Deploy with restricted access:
```bash
# Only allow your office IP
yarn deploy --allowed-ips 203.0.113.0/24

# Multiple IP ranges (edit cfn-template.yaml)
```

### Multiple Environments
```bash
# Development server
yarn deploy --stack-name dev-vscode

# Production server  
yarn deploy --stack-name prod-vscode
```

### Custom Domains
Add a custom domain by:
1. Setting up Route 53 hosted zone
2. Creating SSL certificate in ACM
3. Adding Application Load Balancer
4. Updating security groups

## Monitoring

### CloudWatch Integration
The instance automatically sends logs to CloudWatch:
- System metrics
- Application logs
- VSCode server status

### Health Checks
```bash
# Check instance health
yarn status

# Detailed system info via SSH
ssh -i ~/.ssh/key.pem ec2-user@IP
htop
df -h
```

## Support

### Common Commands
```bash
# Full deployment lifecycle
yarn deploy    # Deploy new server
yarn status    # Check current status
yarn start     # Start stopped instance
yarn stop      # Stop running instance
yarn connect   # Get connection info
yarn remove    # Delete all resources

# Development
yarn build     # Compile TypeScript
yarn dev       # Run in development mode
yarn lint      # Check code quality
```

### Getting Help
1. Check CloudFormation events in AWS Console
2. Review CloudWatch logs
3. SSH into instance for system logs
4. Use AWS Systems Manager Session Manager

## License

MIT License - see LICENSE file for details.

---

**Happy remote coding! 🚀💻**
